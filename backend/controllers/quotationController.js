import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Quotation from "../models/Quotation.js";
import Client from "../models/Client.js";
import { sendEmailViaUMS } from "../services/umsService.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const QUOTATION_STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isValidStatus = (value) => QUOTATION_STATUSES.includes(value);

const formatQuotationNumber = async (companyId) => {
  const count = await Quotation.countDocuments({ companyId });
  return `QTN-${String(count + 1).padStart(4, "0")}`;
};

const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const quantity = Math.max(toNumber(item.quantity), 0);
    const unitPrice = Math.max(toNumber(item.unitPrice || item.rate), 0);
    const discount = Math.max(toNumber(item.discount), 0);
    const gstPercentage = Math.max(toNumber(item.gstPercentage || item.gst), 0);
    const taxableAmount = Math.max(quantity * unitPrice - discount, 0);
    const amount = taxableAmount + (taxableAmount * gstPercentage) / 100;

    return {
      title: String(item.title || item.description || "").trim(),
      description: String(item.description || "").trim(),
      quantity,
      unitPrice,
      discount,
      gstPercentage,
      amount,
    };
  });
};

const calculateTotals = (items = []) => {
  const normalizedItems = normalizeItems(items);
  const subtotal = normalizedItems.reduce((sum, item) => sum + Math.max(toNumber(item.quantity) * toNumber(item.unitPrice) - toNumber(item.discount), 0), 0);
  const gstAmount = normalizedItems.reduce((sum, item) => {
    const taxableAmount = Math.max(toNumber(item.quantity) * toNumber(item.unitPrice) - toNumber(item.discount), 0);
    return sum + (taxableAmount * toNumber(item.gstPercentage)) / 100;
  }, 0);
  const totalAmount = subtotal + gstAmount;

  return {
    items: normalizedItems,
    subtotal,
    gstPercentage: 0,
    gstAmount,
    totalAmount,
  };
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getBillingEntityDetails = (billingEntity = "") => {
  const normalized = String(billingEntity || "").trim().toLowerCase();

  switch (normalized) {
    case "secondary":
      return {
        firmName: "Your Company Advisory",
        legalName: "Your Company Advisory LLP",
        address: ["Billing address line 2", "City, State", "India"],
        contact: "+91 98877 66550",
        email: "billing-secondary@yourcompany.com",
      };
    case "amd":
      return {
        firmName: "AMD Associates",
        legalName: "AMD Associates",
        address: ["CG Road, Ahmedabad", "Gujarat", "India"],
        contact: "+91 97979 79797",
        email: "accounts@amd.test",
      };
    default:
      return {
        firmName: "Primary",
        legalName: "Your Company",
        address: ["Billing address line 1", "City, State", "India"],
        contact: "+91 99988 87770",
        email: "billing@yourcompany.com",
      };
  }
};

const buildLogoText = (billingEntity = "") => {
  const words = String(billingEntity || "Firm")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return words || "F";
};

export const generateQuotationPdfBuffer = async (quotation) => {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const companyName = quotation?.billingEntity || "Firm Name";
    const entityDetails = getBillingEntityDetails(companyName);
    const clientName = quotation?.clientId?.clientName || quotation?.client?.clientName || "Client";
    const clientEmail = quotation?.clientId?.email || quotation?.client?.email || "";
    const clientMobile = quotation?.clientId?.mobile || quotation?.client?.mobile || "";
    const clientGstin = quotation?.clientId?.gstin || quotation?.client?.gstin || "";
    const termsAndConditions = quotation?.termsAndConditions || quotation?.notes || entityDetails.legalName;
    const quotationNumber = quotation?.quotationNumber || "QTN-0001";
    const quotationDate = quotation?.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString("en-IN") : "—";
    const validityDate = quotation?.validityDate ? new Date(quotation.validityDate).toLocaleDateString("en-IN") : "—";
    const logoText = buildLogoText(companyName);

    doc.fillColor("#0F172A");
    doc.font("Helvetica-Bold").fontSize(20).text("Professional Quotation", 40, 40);
    doc.font("Helvetica").fontSize(10).fillColor("#64748B").text(`Prepared for ${clientName}`, 40, 66);

    doc.roundedRect(40, 85, 515, 90, 12).fillOpacity(0.04).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.fillOpacity(1);

    doc.roundedRect(50, 96, 58, 58, 12).fillAndStroke("#2563EB", "#2563EB");
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#FFFFFF").text(logoText, 79, 115, { width: 58, align: "center" });

    doc.font("Helvetica-Bold").fontSize(13).fillColor("#0F172A").text(entityDetails.firmName, 125, 100);
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(entityDetails.address.join(", "), 125, 118, { width: 220 });
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(`${entityDetails.contact} • ${entityDetails.email}`, 125, 138, { width: 220 });

    doc.roundedRect(430, 96, 110, 58, 10).fillAndStroke("#EFF6FF", "#BFDBFE");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#2563EB").text("Quotation No.", 441, 107);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(quotationNumber, 441, 122, { width: 88 });

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Client Details", 40, 205);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(clientName, 40, 222);
    if (clientEmail) doc.text(clientEmail, 40, 239);
    if (clientMobile) doc.text(clientMobile, 40, 256);
    if (clientGstin) doc.text(`GSTIN: ${clientGstin}`, 40, 273);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Quotation Details", 300, 205);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`Date: ${quotationDate}`, 300, 222);
    doc.text(`Validity: ${validityDate}`, 300, 239);
    doc.text(`Status: ${quotation?.status || "Draft"}`, 300, 256);
    doc.text(`Billing Entity: ${companyName}`, 300, 273);

    const tableTop = 320;
    doc.rect(40, tableTop, 515, 24).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#334155").text("Line Item", 50, tableTop + 7, { width: 150 });
    doc.text("Qty", 220, tableTop + 7, { width: 40 });
    doc.text("Rate", 278, tableTop + 7, { width: 60 });
    doc.text("GST", 340, tableTop + 7, { width: 50 });
    doc.text("Amount", 410, tableTop + 7, { width: 80 });

    const rows = Array.isArray(quotation?.items) ? quotation.items : [];
    let y = tableTop + 30;
    rows.forEach((item, index) => {
      const title = String(item.title || item.description || "Service Item").trim();
      const description = String(item.description || "").trim();
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.rate || 0);
      const discount = Number(item.discount || 0);
      const gstPercentage = Number(item.gstPercentage || item.gst || 0);
      const taxableAmount = Math.max(quantity * unitPrice - discount, 0);
      const lineAmount = taxableAmount + (taxableAmount * gstPercentage) / 100;

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A").text(`${index + 1}. ${title}`, 50, y, { width: 160 });
      if (description) doc.font("Helvetica").fontSize(8).fillColor("#64748B").text(description, 50, y + 12, { width: 160 });
      doc.font("Helvetica").fontSize(8).fillColor("#334155").text(String(quantity), 220, y + 2, { width: 40 });
      doc.font("Helvetica").fontSize(8).fillColor("#334155").text(formatCurrency(unitPrice), 278, y + 2, { width: 60 });
      doc.font("Helvetica").fontSize(8).fillColor("#334155").text(`${gstPercentage}%`, 340, y + 2, { width: 50 });
      doc.font("Helvetica").fontSize(8).fillColor("#334155").text(formatCurrency(lineAmount), 410, y + 2, { width: 80 });
      y += 28;
    });

    const summaryY = Math.max(y + 18, 640);
    doc.roundedRect(360, summaryY, 195, 90, 10).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Subtotal", 380, summaryY + 16);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(formatCurrency(quotation?.subtotal || 0), 480, summaryY + 16, { align: "right", width: 60 });
    doc.text("GST", 380, summaryY + 38);
    doc.text(formatCurrency(quotation?.gstAmount || 0), 480, summaryY + 38, { align: "right", width: 60 });
    doc.moveTo(380, summaryY + 58).lineTo(535, summaryY + 58).stroke("#CBD5E1");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Grand Total", 380, summaryY + 66);
    doc.text(formatCurrency(quotation?.totalAmount || 0), 480, summaryY + 66, { align: "right", width: 60 });

    const termsY = summaryY + 110;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Terms & Conditions", 40, termsY);
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(String(termsAndConditions || "This quotation is valid for 15 days from the date of issue. Payment is due on receipt unless otherwise agreed.").slice(0, 730), 40, termsY + 18, { width: 300 });

    const signatureY = termsY + 70;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Authorized Signature", 395, signatureY);
    doc.moveTo(395, signatureY + 24).lineTo(525, signatureY + 24).stroke("#CBD5E1");
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(entityDetails.firmName, 395, signatureY + 32);

    doc.end();
  });
};

export const downloadQuotationPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findOne({
      _id: id,
      ...getCompanyFilter(req),
    }).populate(
      "clientId",
      "clientName clientCode email mobile gstin address status"
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const pdfBuffer = await generateQuotationPdfBuffer(quotation);
    const safeName = String(quotation.quotationNumber || "quotation").replace(/[^a-zA-Z0-9-_]+/g, "-");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getQuotations = async (req, res, next) => {
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

    const query = { ...getCompanyFilter(req) };

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (fromDate || toDate) {
      query.quotationDate = {};
      if (fromDate) query.quotationDate.$gte = new Date(fromDate);
      if (toDate) query.quotationDate.$lte = new Date(toDate);
    }

    let quotations = await Quotation.find(query)
      .populate("clientId", "clientName clientCode email mobile gstin address status")
      .sort({ quotationDate: -1, createdAt: -1 });

    const normalizedSearch = String(search || "").trim().toLowerCase();
    if (normalizedSearch) {
      quotations = quotations.filter((quotation) => {
        const haystack = [
          quotation.quotationNumber,
          quotation.billingEntity,
          quotation.status,
          quotation.clientId?.clientName,
          quotation.clientId?.clientCode,
          quotation.clientId?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 20, 1);
    const total = quotations.length;
    const start = (pageNumber - 1) * limitNumber;
    const paginated = quotations.slice(start, start + limitNumber);

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

export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findOne({
      _id: id,
      ...getCompanyFilter(req),
    }).populate(
      "clientId",
      "clientName clientCode email mobile gstin address status"
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.json(quotation);
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const {
      quotationNumber,
      billingEntity,
      clientId,
      invoiceId,
      quotationDate,
      validityDate,
      status,
      items = [],
      notes = "",
      termsAndConditions = "",
      subtotal,
      gstAmount,
      totalAmount,
    } = req.body;

    if (!billingEntity) {
      return res.status(400).json({ message: "Billing entity is required" });
    }

    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Valid client ID is required" });
    }

    const clientExists = await Client.findOne({
      _id: clientId,
      ...getCompanyFilter(req),
    });
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    if (!quotationDate) {
      return res.status(400).json({ message: "Quotation date is required" });
    }

    if (!validityDate) {
      return res.status(400).json({ message: "Validity date is required" });
    }

    const finalStatus = status && isValidStatus(status) ? status : "Draft";
    const calculated = calculateTotals(items);

    const quotation = await Quotation.create({
      companyId: getCompanyId(req),
      quotationNumber: quotationNumber || (await formatQuotationNumber(getCompanyId(req))),
      billingEntity,
      clientId,
      quotationDate,
      validityDate,
      status: finalStatus,
      items: calculated.items,
      subtotal: toNumber(subtotal ?? calculated.subtotal),
      gstPercentage: calculated.gstPercentage,
      gstAmount: toNumber(gstAmount ?? calculated.gstAmount),
      totalAmount: toNumber(totalAmount ?? calculated.totalAmount),
      notes,
      termsAndConditions,
    });

    return res.status(201).json(quotation);
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findOne({
      _id: id,
      ...getCompanyFilter(req),
    });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const {
      quotationNumber,
      billingEntity,
      clientId,
      invoiceId,
      quotationDate,
      validityDate,
      status,
      items = [],
      notes = quotation.notes || "",
      termsAndConditions = quotation.termsAndConditions || "",
      subtotal,
      gstAmount,
      totalAmount,
    } = req.body;

    if (billingEntity !== undefined && !billingEntity) {
      return res.status(400).json({ message: "Billing entity is required" });
    }

    if (clientId !== undefined && (!clientId || !mongoose.Types.ObjectId.isValid(clientId))) {
      return res.status(400).json({ message: "Valid client ID is required" });
    }

    if (clientId) {
      const clientExists = await Client.findOne({
        _id: clientId,
        ...getCompanyFilter(req),
      });
      if (!clientExists) {
        return res.status(404).json({ message: "Client not found" });
      }
    }

    const calculated = calculateTotals(items);

    const updateData = {
      ...(quotationNumber !== undefined ? { quotationNumber } : {}),
      ...(billingEntity !== undefined ? { billingEntity } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(invoiceId !== undefined ? { invoiceId: invoiceId && mongoose.Types.ObjectId.isValid(invoiceId) ? invoiceId : null } : {}),
      ...(quotationDate !== undefined ? { quotationDate } : {}),
      ...(validityDate !== undefined ? { validityDate } : {}),
      ...(status !== undefined ? { status: isValidStatus(status) ? status : quotation.status } : {}),
      items: calculated.items,
      subtotal: toNumber(subtotal ?? calculated.subtotal),
      gstPercentage: calculated.gstPercentage,
      gstAmount: toNumber(gstAmount ?? calculated.gstAmount),
      totalAmount: toNumber(totalAmount ?? calculated.totalAmount),
      notes,
      termsAndConditions,
    };

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { _id: id, ...getCompanyFilter(req) },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("clientId", "clientName clientCode email mobile gstin address status");

    return res.json(updatedQuotation);
  } catch (error) {
    next(error);
  }
};

export const shareQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { channel = "email", message = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findOne({
      _id: id,
      ...getCompanyFilter(req),
    }).populate(
      "clientId",
      "clientName clientCode email mobile gstin address status"
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (String(channel).toLowerCase() !== "email") {
      return res.status(400).json({ message: "Only email sharing is supported at the moment." });
    }

    const clientEmail = quotation.clientId?.email || "";
    if (!clientEmail) {
      return res.status(400).json({ message: "Client email is required to share the quotation." });
    }

    const pdfBuffer = await generateQuotationPdfBuffer(quotation);

    await sendEmailViaUMS({
      to: clientEmail,
      subject: `Quotation ${quotation.quotationNumber} from ${quotation.billingEntity}`,
      body: message || `Please find the quotation ${quotation.quotationNumber} attached for your review.`,
      metadata: {
        quotationId: quotation._id.toString(),
        quotationNumber: quotation.quotationNumber,
        clientName: quotation.clientId?.clientName || "",
        pdfFileName: `${quotation.quotationNumber}.pdf`,
      },
    });

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { _id: id, ...getCompanyFilter(req) },
      { status: "Sent" },
      { new: true, runValidators: true }
    ).populate("clientId", "clientName clientCode email mobile gstin address status");

    return res.json({
      message: "Quotation shared successfully.",
      quotation: updatedQuotation,
      pdfBase64: pdfBuffer.toString("base64"),
      pdfFileName: `${quotation.quotationNumber}.pdf`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findOneAndDelete({
      _id: id,
      ...getCompanyFilter(req),
    });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.json({ message: "Quotation deleted successfully" });
  } catch (error) {
    next(error);
  }
};
