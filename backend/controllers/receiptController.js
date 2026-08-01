import mongoose from "mongoose";
import Receipt from "../models/Receipt.js";
import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const getInvoiceNo = (invoice) =>
  invoice?.invoiceNo || invoice?.invoiceNumber || invoice?.id || String(invoice?._id || "");

const getInvoiceAmount = (invoice) =>
  toNumber(invoice?.grandTotal ?? invoice?.amount ?? invoice?.totalAmount ?? 0);

const getInvoicePaid = (invoice) =>
  toNumber(invoice?.paidAmount ?? 0);

const getInvoiceBalance = (invoice) => {
  const grand = getInvoiceAmount(invoice);
  const paid = getInvoicePaid(invoice);
  const balance = invoice?.balanceAmount ?? grand - paid;
  return Math.max(toNumber(balance), 0);
};

const computeInvoiceStatus = (invoice, newPaidAmount) => {
  const grand = getInvoiceAmount(invoice);
  const balance = Math.max(grand - newPaidAmount, 0);

  if (balance <= 0) return "Paid";

  const dueDate = invoice?.dueDate ? new Date(invoice.dueDate) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
    return "Overdue";
  }

  if (newPaidAmount > 0) return "Partially Paid";
  return "Unpaid";
};

const applyReceiptToInvoices = async ({ settlements = [], companyId }) => {
  const updatedSettlements = [];

  for (const settlement of settlements) {
    const invoiceId = settlement.invoice;
    if (!invoiceId) continue;

    const invoice = await Invoice.findOne({ _id: invoiceId, companyId });
    if (!invoice) continue;

    const currentPaid = getInvoicePaid(invoice);
    const invoiceAmount = getInvoiceAmount(invoice);
    const dueBefore = getInvoiceBalance(invoice);

    const settledAmount = Math.max(
      0,
      Math.min(toNumber(settlement.settledAmount), dueBefore)
    );

    const newPaidAmount = currentPaid + settledAmount;
    const newBalance = Math.max(invoiceAmount - newPaidAmount, 0);

    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalance;
    invoice.status = computeInvoiceStatus(invoice, newPaidAmount);

    await invoice.save();

    updatedSettlements.push({
      invoice: invoice._id,
      invoiceNo: getInvoiceNo(invoice),
      invoiceDate: invoice.invoiceDate || invoice.createdAt || null,
      invoiceAmount,
      dueAmount: dueBefore,
      settledAmount,
    });
  }

  return updatedSettlements;
};

const autoAllocateSettlements = async (remainingAmount, clientId, skipInvoiceIds = [], companyId) => {
  if (remainingAmount <= 0) return [];

  const openInvoices = await Invoice.find({
    companyId,
    client: clientId,
    _id: { $nin: skipInvoiceIds.filter(Boolean) },
  })
    .sort({ invoiceDate: 1, createdAt: 1 })
    .lean();

  const autoSettlements = [];
  let remaining = remainingAmount;

  for (const invoice of openInvoices) {
    if (remaining <= 0) break;

    const dueAmount = getInvoiceBalance(invoice);
    if (dueAmount <= 0) continue;

    const settledAmount = Math.min(remaining, dueAmount);
    remaining -= settledAmount;

    autoSettlements.push({
      invoice: invoice._id,
      invoiceNo: getInvoiceNo(invoice),
      invoiceDate: invoice.invoiceDate || invoice.createdAt || null,
      invoiceAmount: getInvoiceAmount(invoice),
      dueAmount,
      settledAmount,
    });
  }

  return autoSettlements;
};

export const getReceipts = async (req, res, next) => {
  try {
    const receipts = await Receipt.find(getCompanyFilter(req))
      .populate("client", "clientName clientCode email mobile gstin")
      .populate("settlements.invoice", "invoiceNo invoiceNumber invoiceDate grandTotal amount paidAmount balanceAmount status dueDate")
      .sort({ receiptDate: -1, createdAt: -1 });

    return res.json(receipts);
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    })
      .populate("client", "clientName clientCode email mobile gstin address")
      .populate("settlements.invoice", "invoiceNo invoiceNumber invoiceDate grandTotal amount paidAmount balanceAmount status dueDate");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    return res.json(receipt);
  } catch (error) {
    next(error);
  }
};

export const getOpenInvoicesByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const invoices = await Invoice.find({
      ...getCompanyFilter(req),
      client: clientId,
    })
      .sort({ invoiceDate: 1, createdAt: 1 })
      .lean();

    const openInvoices = invoices
      .map((invoice) => {
        const dueAmount = getInvoiceBalance(invoice);
        const totalAmount = getInvoiceAmount(invoice);
        const paidAmount = getInvoicePaid(invoice);

        return {
          id: String(invoice._id),
          _id: String(invoice._id),
          invoiceNo: getInvoiceNo(invoice),
          invoiceDate: invoice.invoiceDate || invoice.createdAt || null,
          totalAmount,
          paidAmount,
          dueAmount,
          balanceAmount: dueAmount,
          status: invoice.status,
        };
      })
      .filter((invoice) => invoice.dueAmount > 0);

    return res.json(openInvoices);
  } catch (error) {
    next(error);
  }
};

export const createReceipt = async (req, res, next) => {
  try {
    const {
      receiptNo,
      billingEntity = "Primary",
      client,
      receiptDate,
      paymentMode = "UPI",
      receivedAmount = 0,
      tdsAmount = 0,
      discountAmount = 0,
      remark = "",
      settlements = [],
      status = "Completed",
    } = req.body;

    if (!receiptNo?.trim()) {
      return res.status(400).json({ message: "Receipt number is required" });
    }

    if (!client) {
      return res.status(400).json({ message: "Client is required" });
    }

    const clientExists = await Client.findOne({
      _id: client,
      ...getCompanyFilter(req),
    }).lean();
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    const totalAmount = toNumber(receivedAmount) + toNumber(tdsAmount) + toNumber(discountAmount);

    let preparedSettlements = Array.isArray(settlements) ? settlements : [];

    if (preparedSettlements.length > 0) {
      const normalized = preparedSettlements
        .filter((item) => item && item.invoice && toNumber(item.settledAmount) > 0)
        .map((item) => ({
          invoice: item.invoice,
          settledAmount: toNumber(item.settledAmount),
        }));

      const updated = await applyReceiptToInvoices({ settlements: normalized, companyId: getCompanyId(req) });
      preparedSettlements = updated;

      const allocated = updated.reduce((sum, item) => sum + toNumber(item.settledAmount), 0);
      if (allocated < totalAmount) {
        const remainingSettlements = await autoAllocateSettlements(
          totalAmount - allocated,
          client,
          updated.map((item) => item.invoice),
          getCompanyId(req)
        );
        const moreUpdated = await applyReceiptToInvoices({ settlements: remainingSettlements, companyId: getCompanyId(req) });
        preparedSettlements = [...updated, ...moreUpdated];
      }
    } else {
      const autoSettlements = await autoAllocateSettlements(totalAmount, client, [], getCompanyId(req));
      preparedSettlements = await applyReceiptToInvoices({ settlements: autoSettlements, companyId: getCompanyId(req) });
    }

    const appliedAmount = preparedSettlements.reduce((sum, item) => sum + toNumber(item.settledAmount), 0);
    const unappliedAmount = Math.max(totalAmount - appliedAmount, 0);

    const receipt = await Receipt.create({
      companyId: getCompanyId(req),
      receiptNo: receiptNo.trim(),
      billingEntity,
      client,
      receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      paymentMode,
      receivedAmount: toNumber(receivedAmount),
      tdsAmount: toNumber(tdsAmount),
      discountAmount: toNumber(discountAmount),
      remark: remark || "",
      settlements: preparedSettlements,
      totalAmount,
      appliedAmount,
      unappliedAmount,
      status,
      createdBy: req.user?._id || null,
    });

    const populated = await Receipt.findById(receipt._id)
      .populate("client", "clientName clientCode email mobile gstin")
      .populate("settlements.invoice", "invoiceNo invoiceNumber invoiceDate grandTotal amount paidAmount balanceAmount status dueDate");

    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Receipt number already exists" });
    }
    next(error);
  }
};

export const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Revert old settlements before re-applying new ones
    if (Array.isArray(receipt.settlements) && receipt.settlements.length > 0) {
      for (const settlement of receipt.settlements) {
        if (!settlement.invoice) continue;

        const invoice = await Invoice.findOne({ _id: settlement.invoice, companyId: receipt.companyId });
        if (!invoice) continue;

        const currentPaid = getInvoicePaid(invoice);
        const invoiceAmount = getInvoiceAmount(invoice);
        const revertedPaid = Math.max(currentPaid - toNumber(settlement.settledAmount), 0);
        const newBalance = Math.max(invoiceAmount - revertedPaid, 0);

        invoice.paidAmount = revertedPaid;
        invoice.balanceAmount = newBalance;
        invoice.status = computeInvoiceStatus(invoice, revertedPaid);

        await invoice.save();
      }
    }

    const {
      receiptNo,
      billingEntity,
      client,
      receiptDate,
      paymentMode,
      receivedAmount,
      tdsAmount,
      discountAmount,
      remark,
      settlements,
      status,
    } = req.body;

    if (receiptNo !== undefined) receipt.receiptNo = receiptNo;
    if (billingEntity !== undefined) receipt.billingEntity = billingEntity;
    if (client !== undefined) receipt.client = client;
    if (receiptDate !== undefined) receipt.receiptDate = new Date(receiptDate);
    if (paymentMode !== undefined) receipt.paymentMode = paymentMode;
    if (receivedAmount !== undefined) receipt.receivedAmount = toNumber(receivedAmount);
    if (tdsAmount !== undefined) receipt.tdsAmount = toNumber(tdsAmount);
    if (discountAmount !== undefined) receipt.discountAmount = toNumber(discountAmount);
    if (remark !== undefined) receipt.remark = remark;
    if (status !== undefined) receipt.status = status;

    const totalAmount =
      toNumber(receivedAmount ?? receipt.receivedAmount) +
      toNumber(tdsAmount ?? receipt.tdsAmount) +
      toNumber(discountAmount ?? receipt.discountAmount);

    let preparedSettlements = Array.isArray(settlements) ? settlements : [];

    if (preparedSettlements.length > 0) {
      const normalized = preparedSettlements
        .filter((item) => item && item.invoice && toNumber(item.settledAmount) > 0)
        .map((item) => ({
          invoice: item.invoice,
          settledAmount: toNumber(item.settledAmount),
        }));
      preparedSettlements = await applyReceiptToInvoices({ settlements: normalized, companyId: receipt.companyId });
    } else {
      preparedSettlements = await applyReceiptToInvoices({
        settlements: await autoAllocateSettlements(totalAmount, receipt.client, [], receipt.companyId),
        companyId: receipt.companyId,
      });
    }

    const appliedAmount = preparedSettlements.reduce((sum, item) => sum + toNumber(item.settledAmount), 0);
    const unappliedAmount = Math.max(totalAmount - appliedAmount, 0);

    receipt.totalAmount = totalAmount;
    receipt.appliedAmount = appliedAmount;
    receipt.unappliedAmount = unappliedAmount;
    receipt.settlements = preparedSettlements;

    await receipt.save();

    const populated = await Receipt.findById(receipt._id)
      .populate("client", "clientName clientCode email mobile gstin")
      .populate("settlements.invoice", "invoiceNo invoiceNumber invoiceDate grandTotal amount paidAmount balanceAmount status dueDate");

    return res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Revert receipt settlements from invoices
    if (Array.isArray(receipt.settlements) && receipt.settlements.length > 0) {
      for (const settlement of receipt.settlements) {
        if (!settlement.invoice) continue;

        const invoice = await Invoice.findOne({ _id: settlement.invoice, companyId: receipt.companyId });
        if (!invoice) continue;

        const currentPaid = getInvoicePaid(invoice);
        const invoiceAmount = getInvoiceAmount(invoice);
        const revertedPaid = Math.max(currentPaid - toNumber(settlement.settledAmount), 0);
        const newBalance = Math.max(invoiceAmount - revertedPaid, 0);

        invoice.paidAmount = revertedPaid;
        invoice.balanceAmount = newBalance;
        invoice.status = computeInvoiceStatus(invoice, revertedPaid);

        await invoice.save();
      }
    }

    await receipt.deleteOne();

    return res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    next(error);
  }
};