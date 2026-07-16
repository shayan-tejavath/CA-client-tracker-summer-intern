import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  getTodos,
  getTodoSummary,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
} from "../controllers/todoController.js";

const router = express.Router();

const todoRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
  ROLES.Employee,
];

router.use(protect);

router.get("/", authorizeRoles(...todoRoles), getTodos);
router.get("/summary", authorizeRoles(...todoRoles), getTodoSummary);
router.post("/", authorizeRoles(...todoRoles), createTodo);
router.get("/:id", authorizeRoles(...todoRoles), getTodoById);
router.put("/:id", authorizeRoles(...todoRoles), updateTodo);
router.patch("/:id/toggle", authorizeRoles(...todoRoles), toggleTodoStatus);
router.delete("/:id", authorizeRoles(...todoRoles), deleteTodo);

export default router;