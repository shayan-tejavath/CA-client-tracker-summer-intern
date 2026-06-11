import express from "express";

import protect from "../middleware/authMiddleware.js";

import authorizeRoles, {
  ROLES,
} from "../middleware/roleMiddleware.js";

import {
  getReportsAnalytics,
} from "../controllers/reportController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/analytics",
  authorizeRoles(
    ROLES.SuperAdmin,
    ROLES.Partner,
    ROLES.Manager,
    ROLES.Employee
  ),
  getReportsAnalytics
);

export default router;