import express from "express";
import {
  getAllUsersForAttendance,
  getAttendanceByDate,
  markAttendance,
  grantSelfPermission,
  revokeSelfPermission,
  selfCheckIn,
  selfCheckOut,
  getMonthlyReport,
  bulkMarkAttendance,
  getUserAttendance,
  getSelfPermissionStatus,
} from "../controllers/attendanceController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes (all authenticated users)
router.get("/permission-status", protect, getSelfPermissionStatus);
router.get("/my-attendance", protect, getUserAttendance);
router.post("/self-check-in", protect, selfCheckIn);
router.post("/self-check-out", protect, selfCheckOut);

// SuperAdmin only routes
router.get("/all-users", protect, authorizeRoles(ROLES.SuperAdmin), getAllUsersForAttendance);
router.get("/by-date", protect, authorizeRoles(ROLES.SuperAdmin), getAttendanceByDate);
router.post("/mark", protect, authorizeRoles(ROLES.SuperAdmin), markAttendance);
router.post("/grant-permission", protect, authorizeRoles(ROLES.SuperAdmin), grantSelfPermission);
router.post("/revoke-permission", protect, authorizeRoles(ROLES.SuperAdmin), revokeSelfPermission);
router.get("/monthly-report", protect, authorizeRoles(ROLES.SuperAdmin), getMonthlyReport);
router.post("/bulk-mark", protect, authorizeRoles(ROLES.SuperAdmin), bulkMarkAttendance);

export default router;
