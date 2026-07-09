import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoices,
  getInvoicesByClient,
  updateInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.use(protect);

const invoiceViewRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
  ROLES.Employee,
];

const invoiceManageRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
];

router.get("/", authorizeRoles(...invoiceViewRoles), getInvoices);
router.get("/client/:clientId", authorizeRoles(...invoiceViewRoles), getInvoicesByClient);
router.get("/:id", authorizeRoles(...invoiceViewRoles), getInvoiceById);
router.post("/", authorizeRoles(...invoiceManageRoles), createInvoice);
router.put("/:id", authorizeRoles(...invoiceManageRoles), updateInvoice);
router.delete("/:id", authorizeRoles(...invoiceManageRoles), deleteInvoice);

export default router;