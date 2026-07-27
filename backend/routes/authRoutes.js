import express from "express";
import { register, login, getProfile, getSuperAdminDashboard, signup } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/register", register);
router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get("/superadmin", protect, authorizeRoles(ROLES.SuperAdmin), getSuperAdminDashboard);
export default router;

