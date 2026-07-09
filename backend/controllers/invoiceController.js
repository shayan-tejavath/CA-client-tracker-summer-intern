import Invoice from "../models/Invoice.js";
import Task from "../models/Task.js";
import Client from "../models/Client.js";
import Service from "../models/Service.js";

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate("client", "clientName email gstin")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client")
      .populate("items.task")
      .populate("items.service");

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const getUnbilledTasks = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const tasks = await Task.find({
      client: clientId,
      billingStatus: "Unbilled",
    })
      .populate("service")
      .populate("client");

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      invoiceNumber,
      billingType,
      client,
      invoiceDate,
      dueDate,
      paymentTerms,
      items,
      discount,
      notes,
    } = req.body;

    let subtotal = 0;
    let totalGST = 0;

    const processedItems = items.map((item) => {
      const gstAmount =
        (item.amount * item.gstPercentage) / 100;

      const totalAmount =
        item.amount + gstAmount;

      subtotal += item.amount;
      totalGST += gstAmount;

      return {
        ...item,
        gstAmount,
        totalAmount,
      };
    });

    const grandTotal =
      subtotal +
      totalGST -
      (discount || 0);

    const invoice = await Invoice.create({
      invoiceNumber,
      billingType,
      client,
      invoiceDate,
      dueDate,
      paymentTerms,
      items: processedItems,
      subtotal,
      totalGST,
      discount,
      grandTotal,
      balanceAmount: grandTotal,
      notes,
    });

    for (const item of processedItems) {
      if (item.task) {
        await Task.findByIdAndUpdate(
          item.task,
          {
            billingStatus: "Billed",
            invoiceId: invoice._id,
          }
        );
      }
    }

    const createdInvoice =
      await Invoice.findById(invoice._id)
        .populate("client");

    res.status(201).json(createdInvoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice =
      await Invoice.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice =
      await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    await Task.updateMany(
      { invoiceId: invoice._id },
      {
        billingStatus: "Unbilled",
        invoiceId: null,
      }
    );

    await invoice.deleteOne();

    res.json({
      message:
        "Invoice deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};