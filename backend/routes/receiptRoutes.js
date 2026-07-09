import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  getReceipts,
  getReceiptById,
  getOpenInvoicesByClient,
  createReceipt,
  updateReceipt,
  deleteReceipt,
} from "../controllers/receiptController.js";

const router = express.Router();

router.use(protect);

const receiptViewRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
];

const receiptManageRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
];

router.get("/", authorizeRoles(...receiptViewRoles), getReceipts);
router.get("/client/:clientId/open-invoices", authorizeRoles(...receiptViewRoles), getOpenInvoicesByClient);
router.get("/:id", authorizeRoles(...receiptViewRoles), getReceiptById);
router.post("/", authorizeRoles(...receiptManageRoles), createReceipt);
router.put("/:id", authorizeRoles(...receiptManageRoles), updateReceipt);
router.delete("/:id", authorizeRoles(...receiptManageRoles), deleteReceipt);

export default router;