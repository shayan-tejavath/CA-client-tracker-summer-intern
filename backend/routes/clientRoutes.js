import express from "express";

import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
} from "../controllers/clientController.js";

import protect from "../middleware/authMiddleware.js";

import authorizeRoles, {
  ROLES,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);



// GET ALL CLIENTS

router.get(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
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
  createClient
);



// GET CLIENT BY ID

router.get(
  "/:id",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager
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
  updateClient
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

export default router;