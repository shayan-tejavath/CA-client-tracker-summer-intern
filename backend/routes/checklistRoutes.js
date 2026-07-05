import express from "express";
import {
  getChecklistsByTask,
  createChecklist,
  updateChecklist,
  deleteChecklist,
} from "../controllers/checklistController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const checklistViewRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
  ROLES.Employee,
  ROLES.Client,
];
const checklistManageRoles = [
  ROLES.SuperAdmin,
  ROLES.Partner,
  ROLES.Manager,
  ROLES.Employee,
];

const router = express.Router();
router.use(protect);

router.get(
  "/task/:taskId",
  authorizeRoles(...checklistViewRoles),
  getChecklistsByTask
);
router.post(
  "/task/:taskId",
  authorizeRoles(...checklistManageRoles),
  createChecklist
);
router.put("/:id", authorizeRoles(...checklistManageRoles), updateChecklist);
router.delete("/:id", authorizeRoles(...checklistManageRoles), deleteChecklist);

export default router;
