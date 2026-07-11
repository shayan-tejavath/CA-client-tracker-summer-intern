import express from "express";
import {
  getAnalytics,
  getTaskReports,
  getClientReports,
  getServiceReports,
  getEmployeeReports,
  exportReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/analytics", getAnalytics);

router.get("/tasks", getTaskReports);

router.get("/clients", getClientReports);

router.get("/services", getServiceReports);

router.get("/employees", getEmployeeReports);

router.get("/export/:type", exportReport);

export default router;