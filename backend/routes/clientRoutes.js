import express from "express";

import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  updateClientProfileImage,
  archiveClient,
  restoreClient,
  deleteClient,
} from "../controllers/clientController.js";

import {
  bulkImportClients,
  previewClientImport,
  downloadClientTemplate,
} from "../controllers/clientImportController.js";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import authorizeRoles, {
  ROLES,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

/* ===========================================================
   BULK IMPORT ROUTES
=========================================================== */

// Import Clients from Excel

router.post(
  "/import",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  upload.single("file"),
  bulkImportClients
);

// Preview Excel Before Import

router.post(
  "/preview-import",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  upload.single("file"),
  previewClientImport
);

// Download Excel Template

router.get(
  "/download-template",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
  ),
  downloadClientTemplate
);

/* ===========================================================
   CLIENT CRUD
=========================================================== */

// GET ALL CLIENTS

router.get(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager,
    ROLES.Client
  ),
  getClients
);

// CREATE CLIENT

router.post(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  upload.single("profileImage"),
  createClient
);

// GET CLIENT BY ID

router.get(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager,
    ROLES.Client
  ),
  getClientById
);

// UPDATE CLIENT

router.put(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  upload.single("profileImage"),
  updateClient
);

// UPDATE CLIENT PROFILE IMAGE

router.post(
  "/:id/photo",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  upload.single("profileImage"),
  updateClientProfileImage
);

// ARCHIVE CLIENT

router.patch(
  "/:id/archive",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  archiveClient
);

// RESTORE CLIENT

router.patch(
  "/:id/restore",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  restoreClient
);

// DELETE CLIENT

router.delete(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner
  ),
  deleteClient
);

export default router;