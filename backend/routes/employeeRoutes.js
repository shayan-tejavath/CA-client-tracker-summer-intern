import express from "express";
import { getEmployees } from "../controllers/employeeController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getEmployees);
export default router;

