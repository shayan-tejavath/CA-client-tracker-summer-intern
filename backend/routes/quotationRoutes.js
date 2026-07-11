import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  createQuotation,
  deleteQuotation,
  downloadQuotationPdf,
  getQuotationById,
  getQuotations,
  shareQuotation,
  updateQuotation,
} from "../controllers/quotationController.js";

const router = express.Router();

router.use(protect);

const quotationViewRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
  ROLES.Employee,
];

const quotationManageRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
];

router.get("/", authorizeRoles(...quotationViewRoles), getQuotations);
router.get("/:id/pdf", authorizeRoles(...quotationViewRoles), downloadQuotationPdf);
router.get("/:id", authorizeRoles(...quotationViewRoles), getQuotationById);
router.post("/", authorizeRoles(...quotationManageRoles), createQuotation);
router.post("/:id/share", authorizeRoles(...quotationManageRoles), shareQuotation);
router.put("/:id", authorizeRoles(...quotationManageRoles), updateQuotation);
router.delete("/:id", authorizeRoles(...quotationManageRoles), deleteQuotation);

export default router;
