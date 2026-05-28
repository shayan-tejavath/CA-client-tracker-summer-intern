import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const taskViewRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager, ROLES.Employee];
const taskManageRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager];

const router = express.Router();
router.use(protect);
router.get("/", authorizeRoles(...taskViewRoles), getTasks);
router.post("/", authorizeRoles(...taskManageRoles), createTask);
router.get("/:id", authorizeRoles(...taskViewRoles), getTaskById);
router.put("/:id", authorizeRoles(...taskViewRoles), updateTask);
router.delete("/:id", authorizeRoles(...taskManageRoles), deleteTask);
export default router;

