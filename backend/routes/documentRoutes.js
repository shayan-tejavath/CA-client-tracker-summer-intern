import express from "express";

import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  archiveDocument,
  restoreDocument,
  deleteDocument,
} from "../controllers/documentController.js";

import protect from "../middleware/authMiddleware.js";

import authorizeRoles, {
  ROLES,
} from "../middleware/roleMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();



// PROTECT ALL ROUTES

router.use(protect);



// GET ALL DOCUMENTS

router.get(
  "/",
  authorizeRoles(
    ...Object.values(ROLES)
  ),
  getDocuments
);



// UPLOAD DOCUMENT

router.post(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager,
    ROLES.Employee,
    ROLES.Client
  ),
  upload.single("file"),
  uploadDocument
);



// GET DOCUMENT BY ID

router.get(
  "/:id",
  authorizeRoles(
    ...Object.values(ROLES)
  ),
  getDocumentById
);



// UPDATE DOCUMENT

router.put(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  updateDocument
);



// ARCHIVE DOCUMENT

router.patch(
  "/:id/archive",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  archiveDocument
);



// RESTORE DOCUMENT

router.patch(
  "/:id/restore",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  restoreDocument
);



// DELETE DOCUMENT

router.delete(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  deleteDocument
);

export default router;
