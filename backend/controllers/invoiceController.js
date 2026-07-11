import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";

const INVOICE_STATUSES = ["Draft", "Unpaid", "Partially Paid", "Paid", "Overdue"];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isValidStatus = (value) => INVOICE_STATUSES.includes(value);

const formatInvoiceNo = async () => {
  const count = await Invoice.countDocuments();
  return `INV-${String(count + 1).padStart(4, "0")}`;
};

const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const amount = toNumber(item.amount);
    const discount = toNumber(item.discount);
    const gst = toNumber(item.gst);
    const taxableAmount = Math.max(amount - discount, 0);
    const gstAmount = (taxableAmount * gst) / 100;
    const totalAmount = taxableAmount + gstAmount;

    return {
      title: String(item.title || item.description || "").trim(),
      description: String(item.description || "").trim(),
      sac: String(item.sac || "").trim(),
      amount,
      discount,
      gst,
      totalAmount,
      selected: item.selected !== false,
      type: item.type || "manual",
    };
  });
};

const calculateTotals = (items = []) => {
  const normalizedItems = normalizeItems(items);

  const subtotal = normalizedItems.reduce((sum, item) => {
    return sum + Math.max(toNumber(item.amount) - toNumber(item.discount), 0);
  }, 0);

  const discountAmount = normalizedItems.reduce(
    (sum, item) => sum + toNumber(item.discount),
    0
  );

  const taxAmount = normalizedItems.reduce((sum, item) => {
    const taxableAmount = Math.max(toNumber(item.amount) - toNumber(item.discount), 0);
    return sum + (taxableAmount * toNumber(item.gst)) / 100;
  }, 0);

  const grandTotal = subtotal + taxAmount;

  return {
    items: normalizedItems,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
  };
};

const resolveStatus = ({
  grandTotal,
  paidAmount = 0,
  dueDate,
  explicitStatus,
}) => {
  if (explicitStatus && isValidStatus(explicitStatus)) {
    return explicitStatus;
  }

  const paid = toNumber(paidAmount);
  const total = toNumber(grandTotal);
  const balance = Math.max(total - paid, 0);

  if (total <= 0) return "Draft";
  if (balance <= 0) return "Paid";

  const parsedDueDate = dueDate ? new Date(dueDate) : null;
        if (parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) && parsedDueDate < new Date()) {
        return paid > 0 ? "Partially Paid" : "Overdue";
        }

        return paid > 0 ? "Partially Paid" : "Unpaid";
};

const populateInvoice = async (invoice) => {
  return Invoice.findById(invoice._id).populate(
    "client",
    "clientName clientCode email mobile gstin address status"
  );
};

export const getInvoices = async (req, res, next) => {
  try {
    const {
      search = "",
      status = "All",
      clientId = "",
      fromDate = "",
      toDate = "",
      page = 1,
      limit = 20,
    } = req.query;

    let query = {};

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.client = clientId;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }

    let invoices = await Invoice.find(query)
      .populate("client", "clientName clientCode email mobile gstin address status")
      .sort({ invoiceDate: -1, createdAt: -1 });

    const normalizedSearch = String(search || "").trim().toLowerCase();
    if (normalizedSearch) {
      invoices = invoices.filter((invoice) => {
        const haystack = [
          invoice.invoiceNo,
          invoice.billingEntity,
          invoice.status,
          invoice.client?.clientName,
          invoice.client?.clientCode,
          invoice.client?.email,
          invoice.paymentTerm,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 20, 1);
    const total = invoices.length;
    const start = (pageNumber - 1) * limitNumber;
    const paginated = invoices.slice(start, start + limitNumber);

    return res.json({
      data: paginated,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.max(Math.ceil(total / limitNumber), 1),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findById(id).populate(
      "client",
      "clientName clientCode email mobile gstin address status"
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const getInvoicesByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { openOnly = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const invoices = await Invoice.find({ client: clientId })
      .sort({ invoiceDate: -1, createdAt: -1 })
      .lean();

    const mapped = invoices.map((invoice) => {
      const balanceAmount = toNumber(invoice.balanceAmount);
      const grandTotal = toNumber(invoice.grandTotal);
      const paidAmount = toNumber(invoice.paidAmount);

      return {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        billingEntity: invoice.billingEntity,
        paymentTerm: invoice.paymentTerm,
        subtotal: toNumber(invoice.subtotal),
        discountAmount: toNumber(invoice.discountAmount),
        taxAmount: toNumber(invoice.taxAmount),
        grandTotal,
        paidAmount,
        balanceAmount:
          balanceAmount > 0 ? balanceAmount : Math.max(grandTotal - paidAmount, 0),
        status: invoice.status,
        items: invoice.items || [],
      };
    });

    const finalInvoices =
      String(openOnly).toLowerCase() === "true"
        ? mapped.filter((invoice) => invoice.balanceAmount > 0 && invoice.status !== "Draft")
        : mapped;

    return res.json(finalInvoices);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      invoiceNo,
      billingEntity,
      client,
      quotationId,
      invoiceDate,
      dueDate,
      paymentTerm = "NET 15",
      items = [],
      notes = "",
      status,
      paidAmount = 0,
    } = req.body;

    if (!billingEntity?.trim()) {
      return res.status(400).json({ message: "Billing entity is required" });
    }

    if (!client || !mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "Valid client is required" });
    }

    if (!invoiceDate) {
      return res.status(400).json({ message: "Invoice date is required" });
    }

    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one invoice item is required" });
    }

    const clientExists = await Client.findById(client).lean();
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    const normalizedInvoiceNo = String(invoiceNo || "").trim() || (await formatInvoiceNo());
    const { items: normalizedItems, subtotal, discountAmount, taxAmount, grandTotal } =
      calculateTotals(items);

    const paid = toNumber(paidAmount);
    const balanceAmount = Math.max(grandTotal - paid, 0);
    const resolvedStatus = resolveStatus({
      grandTotal,
      paidAmount: paid,
      dueDate,
      explicitStatus: status,
    });

    const invoice = await Invoice.create({
      invoiceNo: normalizedInvoiceNo,
      billingEntity: billingEntity.trim(),
      client,
      quotationId: quotationId && mongoose.Types.ObjectId.isValid(quotationId) ? quotationId : null,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      paymentTerm,
      items: normalizedItems,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paidAmount: paid,
      balanceAmount,
      status: resolvedStatus,
      notes: notes || "",
    });

    const populated = await populateInvoice(invoice);
    return res.status(201).json(populated);
  }catch (error) {
        console.log("FULL ERROR =>", error);

        if (error?.code === 11000) {
            return res.status(409).json({
            message: JSON.stringify(error.keyValue)
            });
        }

        next(error);
        }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const {
      invoiceNo,
      billingEntity,
      client,
      quotationId,
      invoiceDate,
      dueDate,
      paymentTerm,
      items,
      notes,
      status,
      paidAmount,
      balanceAmount,
    } = req.body;

    if (invoiceNo !== undefined) invoice.invoiceNo = String(invoiceNo).trim();
    if (billingEntity !== undefined) invoice.billingEntity = String(billingEntity).trim();

    if (quotationId !== undefined) {
      invoice.quotationId = quotationId && mongoose.Types.ObjectId.isValid(quotationId) ? quotationId : null;
    }

    if (client !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(client)) {
        return res.status(400).json({ message: "Valid client is required" });
      }

      const clientExists = await Client.findById(client).lean();
      if (!clientExists) {
        return res.status(404).json({ message: "Client not found" });
      }

      invoice.client = client;
    }

    if (invoiceDate !== undefined) invoice.invoiceDate = new Date(invoiceDate);
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (paymentTerm !== undefined) invoice.paymentTerm = String(paymentTerm).trim();
    if (notes !== undefined) invoice.notes = String(notes || "");

    if (Array.isArray(items)) {
      const { items: normalizedItems, subtotal, discountAmount, taxAmount, grandTotal } =
        calculateTotals(items);

      invoice.items = normalizedItems;
      invoice.subtotal = subtotal;
      invoice.discountAmount = discountAmount;
      invoice.taxAmount = taxAmount;
      invoice.grandTotal = grandTotal;
    }

    if (paidAmount !== undefined) {
      invoice.paidAmount = toNumber(paidAmount);
    }

    if (balanceAmount !== undefined) {
      invoice.balanceAmount = toNumber(balanceAmount);
    }

    const computedBalance = Math.max(invoice.grandTotal - toNumber(invoice.paidAmount), 0);
    invoice.balanceAmount = balanceAmount !== undefined ? toNumber(balanceAmount) : computedBalance;

    invoice.status = resolveStatus({
      grandTotal: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      dueDate: invoice.dueDate,
      explicitStatus: status,
    });

    await invoice.save();

    const populated = await populateInvoice(invoice);
    return res.json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Invoice number already exists" });
    }
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await invoice.deleteOne();

    return res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
};