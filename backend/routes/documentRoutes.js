import express from "express";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", authorizeRoles(...Object.values(ROLES)), getDocuments);
router.post("/", authorizeRoles(ROLES.Employee, ROLES.Client), upload.single("file"), uploadDocument);
router.get("/:id", authorizeRoles(...Object.values(ROLES)), getDocumentById);
router.put("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), updateDocument);
router.delete("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), deleteDocument);
export default router;

