import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createExpense,
  approveExpense,
  deleteExpenseReceipt,
  deleteExpense,
  exportExpenses,
  markExpensePaid,
  downloadExpenseReceipt,
  getExpenseById,
  getExpenseDashboard,
  getExpenses,
  previewExpenseReceipt,
  rejectExpense,
  uploadExpenseReceipt,
  updateExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

const expenseViewRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager];
const expenseManageRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager];
const expenseApprovalRoles = [ROLES.SuperAdmin, ROLES.Manager];

router.use(protect);

router.get("/", authorizeRoles(...expenseViewRoles), getExpenses);
router.get("/dashboard", authorizeRoles(...expenseViewRoles), getExpenseDashboard);
router.get("/export", authorizeRoles(...expenseViewRoles), exportExpenses);
router.get("/:id/receipt/preview", authorizeRoles(...expenseViewRoles), previewExpenseReceipt);
router.get("/:id/receipt/download", authorizeRoles(...expenseViewRoles), downloadExpenseReceipt);
router.get("/:id", authorizeRoles(...expenseViewRoles), getExpenseById);
router.post("/", authorizeRoles(...expenseManageRoles), createExpense);
router.post("/:id/receipt", authorizeRoles(...expenseManageRoles), upload.single("receipt"), uploadExpenseReceipt);
router.put("/:id", authorizeRoles(...expenseManageRoles), updateExpense);
router.patch("/:id/approve", authorizeRoles(...expenseApprovalRoles), approveExpense);
router.patch("/:id/reject", authorizeRoles(...expenseApprovalRoles), rejectExpense);
router.patch("/:id/mark-paid", authorizeRoles(...expenseApprovalRoles), markExpensePaid);
router.delete("/:id/receipt", authorizeRoles(...expenseManageRoles), deleteExpenseReceipt);
router.delete("/:id", authorizeRoles(...expenseManageRoles), deleteExpense);

export default router;
