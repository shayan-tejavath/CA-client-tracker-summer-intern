import express from "express";

import {
  createDscRecord,
  getDscRecords,
  updateDscRecord,
} from "../controllers/dscController.js";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager,
    ROLES.Employee,
    ROLES.Client
  ),
  getDscRecords
);

router.post(
  "/",
  authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager),
  createDscRecord
);

router.put(
  "/:id",
  authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager),
  updateDscRecord
);

export default router;
