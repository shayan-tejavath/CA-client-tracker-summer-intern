import express from "express";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles, {
  ROLES,
} from "../middleware/roleMiddleware.js";

import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getUnbilledTasks,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  getInvoices
);

router.get(
  "/unbilled/:clientId",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  getUnbilledTasks
);

router.get(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  getInvoiceById
);

router.post(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  createInvoice
);

router.put(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  updateInvoice
);

router.delete(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  deleteInvoice
);

export default router;