import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const dashboardViewRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager, ROLES.Employee];

const router = express.Router();
router.use(protect);
router.get("/summary", authorizeRoles(...dashboardViewRoles), getDashboardSummary);
export default router;

