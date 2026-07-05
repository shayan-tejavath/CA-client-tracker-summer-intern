import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  listSubTasks,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  listTaskDocuments,
  uploadTaskDocument,
  deleteTaskDocument,
  listTaskActivities,
  createTaskDocumentRequest,
  listTaskDocumentRequests,
  updateTaskDocumentRequestStatus,
} from "../controllers/taskController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import taskDocumentUpload from "../middleware/taskDocumentUploadMiddleware.js";

const taskViewRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager, ROLES.Employee, ROLES.Client];
const taskManageRoles = [ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager];
const taskUpdateRoles = [...taskManageRoles, ROLES.Employee];

const router = express.Router();
router.use(protect);
router.get("/", authorizeRoles(...taskViewRoles), getTasks);
router.post("/", authorizeRoles(...taskManageRoles), createTask);
router.get("/:taskId/subtasks", authorizeRoles(...taskViewRoles), listSubTasks);
router.post("/:taskId/subtasks", authorizeRoles(...taskUpdateRoles), createSubTask);
router.put("/:taskId/subtasks/:subTaskId", authorizeRoles(...taskUpdateRoles), updateSubTask);
router.delete("/:taskId/subtasks/:subTaskId", authorizeRoles(...taskUpdateRoles), deleteSubTask);
router.get("/:taskId/documents", authorizeRoles(...taskViewRoles), listTaskDocuments);
router.post("/:taskId/documents", authorizeRoles(...taskUpdateRoles), taskDocumentUpload.single("file"), uploadTaskDocument);
router.delete("/:taskId/documents/:documentId", authorizeRoles(...taskUpdateRoles), deleteTaskDocument);
router.get("/:taskId/document-requests", authorizeRoles(...taskViewRoles), listTaskDocumentRequests);
router.post("/:taskId/document-requests", authorizeRoles(...taskViewRoles), createTaskDocumentRequest);
router.put("/:taskId/document-requests/:requestId", authorizeRoles(...taskViewRoles), updateTaskDocumentRequestStatus);
router.get("/:taskId/activities", authorizeRoles(...taskViewRoles), listTaskActivities);
router.get("/:id", authorizeRoles(...taskViewRoles), getTaskById);
router.put("/:id", authorizeRoles(...taskUpdateRoles), updateTask);
router.post("/:id/comments", authorizeRoles(...taskViewRoles), addComment);
router.delete("/:id", authorizeRoles(...taskManageRoles), deleteTask);
export default router;

