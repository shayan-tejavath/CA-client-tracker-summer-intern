import express from "express";
import {
  getWorkflowTemplates,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
} from "../controllers/workflowTemplateController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/:serviceId/templates", authorizeRoles(...Object.values(ROLES)), getWorkflowTemplates);
router.post("/:serviceId/templates", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), createWorkflowTemplate);
router.put("/:serviceId/templates/:templateId", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), updateWorkflowTemplate);
router.delete("/:serviceId/templates/:templateId", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), deleteWorkflowTemplate);

export default router;
