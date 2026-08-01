import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import Expense from "../models/Expense.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const SORTABLE_FIELDS = new Set([
  "expenseNumber",
  "expenseDate",
  "category",
  "vendor",
  "paymentMode",
  "amount",
  "gstPercentage",
  "gstAmount",
  "totalAmount",
  "status",
  "createdAt",
  "updatedAt",
]);

const EXPENSE_FIELDS = [
  "expenseDate",
  "category",
  "vendor",
  "client",
  "employee",
  "paymentMode",
  "amount",
  "gstPercentage",
  "remarks",
];

const RECEIPT_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const RECEIPT_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
const UPLOADS_DIRECTORY = path.resolve(process.cwd(), "uploads");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidObjectId = (value) =>
  value === null || value === "" || mongoose.Types.ObjectId.isValid(value);

const populateExpense = (query) =>
  query
    .populate("client", "clientName clientCode email mobile")
    .populate("employee", "name email role")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("approvedBy", "name email")
    .populate("activityHistory.performedBy", "name email");

const getReceiptPath = (receipt) => {
  if (!receipt) return null;
  const resolvedPath = path.resolve(process.cwd(), receipt);
  const uploadsPrefix = `${UPLOADS_DIRECTORY}${path.sep}`;
  return resolvedPath.startsWith(uploadsPrefix) ? resolvedPath : null;
};

const removeReceiptFile = (receipt) => {
  const receiptPath = getReceiptPath(receipt);
  try {
    if (receiptPath && fs.existsSync(receiptPath)) fs.unlinkSync(receiptPath);
  } catch (error) {
    console.error("Unable to remove expense receipt:", error.message);
  }
};

const validateReceiptFile = (file) => {
  if (!file) return "Receipt file is required";
  const extension = path.extname(file.originalname).toLowerCase();
  if (!RECEIPT_EXTENSIONS.has(extension) || !RECEIPT_MIME_TYPES.has(file.mimetype)) {
    return "Receipt must be a PDF, PNG, JPG, or JPEG file";
  }
  return null;
};

const validateReferences = (body) => {
  for (const field of ["client", "employee"]) {
    if (body[field] !== undefined && !isValidObjectId(body[field])) {
      return `${field[0].toUpperCase()}${field.slice(1)} must be a valid ID`;
    }
  }
  return null;
};

const validateExpenseInput = (body, { isCreate = false } = {}) => {
  if (isCreate && !String(body.category || "").trim()) return "Expense category is required";
  if (isCreate && !String(body.paymentMode || "").trim()) return "Payment mode is required";

  if (body.amount !== undefined && (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0)) {
    return "Amount must be greater than 0";
  }

  if (body.gstPercentage !== undefined && (!Number.isFinite(Number(body.gstPercentage)) || Number(body.gstPercentage) < 0)) {
    return "GST percentage cannot be negative";
  }

  if (body.expenseDate !== undefined && Number.isNaN(new Date(body.expenseDate).getTime())) {
    return "Expense date must be a valid date";
  }

  return validateReferences(body);
};

const buildExpenseFilter = (query) => {
  const filter = {};
  const { category, status, vendor, employee, paymentMode, search, date, dateFrom, dateTo } = query;

  if (category) filter.category = new RegExp(`^${escapeRegExp(category)}$`, "i");
  if (status) filter.status = status;
  if (vendor) filter.vendor = new RegExp(escapeRegExp(vendor), "i");
  if (paymentMode) filter.paymentMode = new RegExp(`^${escapeRegExp(paymentMode)}$`, "i");

  if (employee) {
    if (!mongoose.Types.ObjectId.isValid(employee)) return { error: "Employee must be a valid ID" };
    filter.employee = employee;
  }

  if (search?.trim()) {
    const expression = new RegExp(escapeRegExp(search.trim()), "i");
    filter.$or = [
      { expenseNumber: expression },
      { category: expression },
      { vendor: expression },
      { remarks: expression },
    ];
  }

  const start = date || dateFrom;
  if (start || dateTo) {
    filter.expenseDate = {};
    if (start) {
      const startDate = new Date(start);
      if (Number.isNaN(startDate.getTime())) return { error: "Date filter must be a valid date" };
      startDate.setHours(0, 0, 0, 0);
      filter.expenseDate.$gte = startDate;
    }
    if (date) {
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = endDate;
    } else if (dateTo) {
      const endDate = new Date(dateTo);
      if (Number.isNaN(endDate.getTime())) return { error: "Date filter must be a valid date" };
      endDate.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = endDate;
    }
  }

  return { filter };
};

const formatDateForExport = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmountForExport = (value) => {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "0.00";
};

const mapExpenseForExport = (expense) => ({
  ExpenseNumber: expense.expenseNumber || "",
  Date: formatDateForExport(expense.expenseDate),
  Category: expense.category || "",
  Vendor: expense.vendor || "",
  Client: expense.client?.clientName || expense.client?.clientCode || "",
  Employee: expense.employee?.name || expense.employee?.email || "",
  PaymentMode: expense.paymentMode || "",
  Amount: Number.isFinite(Number(expense.totalAmount)) ? Number(expense.totalAmount) : 0,
  GSTPercentage:
    expense.gstPercentage !== undefined && expense.gstPercentage !== null
      ? `${expense.gstPercentage}%`
      : "",
  GSTAmount: Number.isFinite(Number(expense.gstAmount)) ? Number(expense.gstAmount) : 0,
  TotalAmount: Number.isFinite(Number(expense.totalAmount)) ? Number(expense.totalAmount) : 0,
  Status: expense.status || "",
  CreatedAt: formatDateForExport(expense.createdAt),
  UpdatedAt: formatDateForExport(expense.updatedAt),
});

const generateExpensePdf = (res, rows) => {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

  res.setHeader("Content-Disposition", "attachment; filename=expenses-export.pdf");
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(16).text("Expense Export", { align: "center" });
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(10).fillColor("#4B5563").text(`Generated: ${new Date().toLocaleString("en-IN")}`, { align: "center" });
  doc.moveDown(1);

  const tableTop = doc.y;
  const columnWidths = [80, 55, 80, 100, 70, 70, 70];
  const headers = [
    "Expense No",
    "Date",
    "Category",
    "Vendor",
    "Payment Mode",
    "Amount",
    "Status",
  ];

  const renderRow = (y, columns, isHeader = false) => {
    doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(isHeader ? 9 : 8).fillColor("#111827");
    let x = doc.page.margins.left;

    columns.forEach((text, index) => {
      doc.text(String(text || ""), x, y, {
        width: columnWidths[index],
        ellipsis: true,
      });
      x += columnWidths[index];
    });
  };

  renderRow(tableTop, headers, true);
  let y = tableTop + 18;
  doc.moveTo(doc.page.margins.left, y - 4)
    .lineTo(doc.page.width - doc.page.margins.right, y - 4)
    .strokeColor("#E2E8F0")
    .lineWidth(1)
    .stroke();

  rows.forEach((row) => {
    const rowData = [
      row.ExpenseNumber,
      row.Date,
      row.Category,
      row.Vendor,
      row.PaymentMode,
      `₹${formatAmountForExport(row.Amount)}`,
      row.Status,
    ];

    if (y + 20 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      renderRow(y, headers, true);
      y += 22;
      doc.moveTo(doc.page.margins.left, y - 4)
        .lineTo(doc.page.width - doc.page.margins.right, y - 4)
        .strokeColor("#E2E8F0")
        .lineWidth(1)
        .stroke();
    }

    renderRow(y, rowData);
    y += 18;
  });

  if (rows.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#374151").text("No expenses match the selected filters.", doc.page.margins.left, y + 10);
  }

  doc.end();
};

export const exportExpenses = async (req, res, next) => {
  try {
    const format = String(req.query.format || "xlsx").toLowerCase();
    const result = buildExpenseFilter(req.query);
    if (result.error) return res.status(400).json({ message: result.error });

    const companyFilter = getCompanyFilter(req);
    const expenses = await populateExpense(
      Expense.find({ ...companyFilter, ...result.filter }).sort({ expenseDate: -1, _id: -1 })
    );

    const rows = expenses.map(mapExpenseForExport);
    const filename = `expenses-export.${format === "csv" ? "csv" : format === "pdf" ? "pdf" : "xlsx"}`;

    if (format === "csv") {
      const fields = [
        "ExpenseNumber",
        "Date",
        "Category",
        "Vendor",
        "Client",
        "Employee",
        "PaymentMode",
        "Amount",
        "GSTPercentage",
        "GSTAmount",
        "TotalAmount",
        "Status",
        "CreatedAt",
        "UpdatedAt",
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(rows);

      res.header("Content-Disposition", `attachment; filename=${filename}`);
      res.header("Content-Type", "text/csv");
      return res.send(csv);
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expenses");

      worksheet.columns = [
        { header: "Expense Number", key: "ExpenseNumber", width: 18 },
        { header: "Date", key: "Date", width: 14 },
        { header: "Category", key: "Category", width: 18 },
        { header: "Vendor", key: "Vendor", width: 24 },
        { header: "Client", key: "Client", width: 20 },
        { header: "Employee", key: "Employee", width: 20 },
        { header: "Payment Mode", key: "PaymentMode", width: 15 },
        { header: "Amount", key: "Amount", width: 12 },
        { header: "GST %", key: "GSTPercentage", width: 10 },
        { header: "GST Amount", key: "GSTAmount", width: 12 },
        { header: "Total Amount", key: "TotalAmount", width: 14 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Created At", key: "CreatedAt", width: 16 },
        { header: "Updated At", key: "UpdatedAt", width: 16 },
      ];

      worksheet.addRows(rows);
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach((column) => {
        column.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      });
      worksheet.getColumn("Amount").numFmt = "₹#,##0.00";
      worksheet.getColumn("GSTAmount").numFmt = "₹#,##0.00";
      worksheet.getColumn("TotalAmount").numFmt = "₹#,##0.00";

      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "pdf") {
      return generateExpensePdf(res, rows);
    }

    return res.status(400).json({ message: "Unsupported export format" });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const validationError = validateExpenseInput(req.body, { isCreate: true });
    if (validationError) return res.status(400).json({ message: validationError });

    const expenseData = Object.fromEntries(
      EXPENSE_FIELDS.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    expenseData.companyId = getCompanyId(req);
    expenseData.createdBy = req.user?._id || null;
    expenseData.updatedBy = req.user?._id || null;
    expenseData.activityHistory = [{
      action: "Expense created",
      details: "Expense recorded",
      performedBy: req.user?._id || null,
    }];

    const expense = await Expense.create(expenseData);
    const populatedExpense = await populateExpense(Expense.findById(expense._id));
    return res.status(201).json(populatedExpense);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Expense number already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const result = buildExpenseFilter(req.query);
    if (result.error) return res.status(400).json({ message: result.error });

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const sortBy = SORTABLE_FIELDS.has(req.query.sortBy) ? req.query.sortBy : "expenseDate";
    const sortOrder = String(req.query.sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder, _id: -1 };

    const companyFilter = getCompanyFilter(req);
    const scopedFilter = { ...companyFilter, ...result.filter };

    const [expenses, total, summaryResult] = await Promise.all([
      populateExpense(Expense.find(scopedFilter).sort(sort).skip((page - 1) * limit).limit(limit)),
      Expense.countDocuments(scopedFilter),
      Expense.aggregate([
        { $match: scopedFilter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
            pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
            paid: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: summaryResult[0] || { totalAmount: 0, pending: 0, approved: 0, paid: 0 },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const companyFilter = getCompanyFilter(req);

    const [dashboard] = await Expense.aggregate([
      { $match: companyFilter },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalExpenses: { $sum: "$totalAmount" },
                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
                paid: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] } },
              },
            },
          ],
          monthlyExpenses: [
            { $match: { expenseDate: { $gte: monthStart } } },
            { $group: { _id: null, amount: { $sum: "$totalAmount" } } },
          ],
          monthlyTrend: [
            { $match: { expenseDate: { $gte: trendStart } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$expenseDate" } },
                amount: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          categories: [
            { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, amount: { $sum: "$totalAmount" } } },
            { $sort: { amount: -1 } },
            { $limit: 7 },
          ],
          paymentModes: [
            { $group: { _id: { $ifNull: ["$paymentMode", "Other"] }, amount: { $sum: "$totalAmount" } } },
            { $sort: { amount: -1 } },
          ],
          topVendors: [
            { $match: { vendor: { $nin: [null, ""] } } },
            { $group: { _id: "$vendor", amount: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
            { $sort: { amount: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const trendLookup = new Map((dashboard.monthlyTrend || []).map((item) => [item._id, item.amount]));
    const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: date.toLocaleString("en-IN", { month: "short" }),
        amount: trendLookup.get(key) || 0,
      };
    });

    const summary = dashboard.summary?.[0] || {};
    return res.json({
      summary: {
        totalExpenses: summary.totalExpenses || 0,
        monthlyExpenses: dashboard.monthlyExpenses?.[0]?.amount || 0,
        pending: summary.pending || 0,
        approved: summary.approved || 0,
        paid: summary.paid || 0,
      },
      monthlyTrend,
      categories: (dashboard.categories || []).map((item) => ({ name: item._id, amount: item.amount })),
      paymentModes: (dashboard.paymentModes || []).map((item) => ({ name: item._id, amount: item.amount })),
      topVendors: (dashboard.topVendors || []).map((item) => ({ name: item._id, amount: item.amount, count: item.count })),
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await populateExpense(
      Expense.findOne({ _id: req.params.id, ...getCompanyFilter(req) })
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    return res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const validationError = validateExpenseInput(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const updatedFields = [];
    for (const field of EXPENSE_FIELDS) {
      if (req.body[field] === undefined) continue;
      expense[field] = req.body[field];
      if (expense.isModified(field)) {
        updatedFields.push(field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()));
      }
    }
    expense.updatedBy = req.user?._id || null;
    if (updatedFields.length > 0) {
      expense.activityHistory.push({
        action: "Expense updated",
        details: `Updated ${updatedFields.join(", ")}`,
        performedBy: req.user?._id || null,
      });
    }
    await expense.save();

    const populatedExpense = await populateExpense(Expense.findById(expense._id));
    return res.json(populatedExpense);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const receipt = expense.receipt;
    await expense.deleteOne();
    removeReceiptFile(receipt);
    return res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const uploadExpenseReceipt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.file) removeReceiptFile(req.file.path);
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const fileError = validateReceiptFile(req.file);
    if (fileError) {
      if (req.file) removeReceiptFile(req.file.path);
      return res.status(400).json({ message: fileError });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!expense) {
      removeReceiptFile(req.file.path);
      return res.status(404).json({ message: "Expense not found" });
    }

    const previousReceipt = expense.receipt;
    expense.receipt = req.file.path;
    expense.updatedBy = req.user?._id || null;
    expense.activityHistory.push({
      action: previousReceipt ? "Receipt replaced" : "Receipt uploaded",
      details: req.file.originalname,
      performedBy: req.user?._id || null,
    });
    await expense.save();
    removeReceiptFile(previousReceipt);

    const populatedExpense = await populateExpense(Expense.findById(expense._id));
    return res.json({
      message: previousReceipt ? "Receipt replaced successfully" : "Receipt uploaded successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    if (req.file) removeReceiptFile(req.file.path);
    next(error);
  }
};

export const previewExpenseReceipt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    }).select("receipt");
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const receiptPath = getReceiptPath(expense.receipt);
    if (!receiptPath || !fs.existsSync(receiptPath)) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    return res.sendFile(receiptPath, { headers: { "Content-Disposition": "inline" } });
  } catch (error) {
    next(error);
  }
};

export const downloadExpenseReceipt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    }).select("receipt expenseNumber");
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const receiptPath = getReceiptPath(expense.receipt);
    if (!receiptPath || !fs.existsSync(receiptPath)) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const extension = path.extname(receiptPath);
    return res.download(receiptPath, `${expense.expenseNumber || "expense"}-receipt${extension}`);
  } catch (error) {
    next(error);
  }
};

export const deleteExpenseReceipt = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      ...getCompanyFilter(req),
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    if (!expense.receipt) return res.status(404).json({ message: "Receipt not found" });

    const previousReceipt = expense.receipt;
    expense.receipt = "";
    expense.updatedBy = req.user?._id || null;
    expense.activityHistory.push({
      action: "Receipt deleted",
      details: "Supporting receipt removed",
      performedBy: req.user?._id || null,
    });
    await expense.save();
    removeReceiptFile(previousReceipt);

    return res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const findExpenseForWorkflow = async (expenseId, req, res) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Invalid expense ID" });
    return null;
  }

  const expense = await Expense.findOne({
    _id: expenseId,
    ...getCompanyFilter(req),
  });
  if (!expense) {
    res.status(404).json({ message: "Expense not found" });
    return null;
  }
  return expense;
};

const workflowResponse = async (expense, res, message) => {
  const populatedExpense = await populateExpense(Expense.findById(expense._id));
  return res.json({ message, expense: populatedExpense });
};

export const approveExpense = async (req, res, next) => {
  try {
    const expense = await findExpenseForWorkflow(req.params.id, req, res);
    if (!expense) return;
    if (expense.status !== "Pending") {
      return res.status(400).json({ message: "Only pending expenses can be approved" });
    }

    expense.status = "Approved";
    expense.approvedBy = req.user?._id || null;
    expense.approvedDate = new Date();
    expense.rejectionReason = "";
    expense.updatedBy = req.user?._id || null;
    expense.activityHistory.push({
      action: "Expense approved",
      details: "Approved for payment",
      performedBy: req.user?._id || null,
    });
    await expense.save();
    return workflowResponse(expense, res, "Expense approved successfully");
  } catch (error) {
    next(error);
  }
};

export const rejectExpense = async (req, res, next) => {
  try {
    const reason = String(req.body?.rejectionReason || "").trim();
    if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

    const expense = await findExpenseForWorkflow(req.params.id, req, res);
    if (!expense) return;
    if (expense.status !== "Pending") {
      return res.status(400).json({ message: "Only pending expenses can be rejected" });
    }

    expense.status = "Rejected";
    expense.rejectionReason = reason;
    expense.approvedBy = null;
    expense.approvedDate = null;
    expense.updatedBy = req.user?._id || null;
    expense.activityHistory.push({
      action: "Expense rejected",
      details: reason,
      performedBy: req.user?._id || null,
    });
    await expense.save();
    return workflowResponse(expense, res, "Expense rejected successfully");
  } catch (error) {
    next(error);
  }
};

export const markExpensePaid = async (req, res, next) => {
  try {
    const expense = await findExpenseForWorkflow(req.params.id, req, res);
    if (!expense) return;
    if (expense.status !== "Approved") {
      return res.status(400).json({ message: "Only approved expenses can be marked as paid" });
    }

    expense.status = "Paid";
    expense.updatedBy = req.user?._id || null;
    expense.activityHistory.push({
      action: "Expense marked as paid",
      details: "Payment recorded",
      performedBy: req.user?._id || null,
    });
    await expense.save();
    return workflowResponse(expense, res, "Expense marked as paid successfully");
  } catch (error) {
    next(error);
  }
};
