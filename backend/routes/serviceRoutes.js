import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAvailableClients,
  getAssignedClients,
  assignClientsToService,
  updateServiceAssignment,
  bulkUpdateAssignments,
  removeClientFromService,
  bulkRemoveClientsFromService,
} from "../controllers/serviceController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

// Service CRUD
router.get("/", authorizeRoles(...Object.values(ROLES)), getServices);
router.post("/", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), createService);
router.get("/:id", authorizeRoles(...Object.values(ROLES)), getServiceById);
router.put("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), updateService);
router.delete("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), deleteService);

// Service Assignments
router.get("/:serviceId/available-clients", authorizeRoles(...Object.values(ROLES)), getAvailableClients);
router.get("/:serviceId/assigned-clients", authorizeRoles(...Object.values(ROLES)), getAssignedClients);
router.post("/:serviceId/assign-clients", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), assignClientsToService);
router.put("/:serviceId/assignments/:assignmentId", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), updateServiceAssignment);
router.patch("/:serviceId/assignments/bulk-update", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), bulkUpdateAssignments);
router.delete("/:serviceId/assignments/:assignmentId", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), removeClientFromService);
router.post("/:serviceId/assignments/bulk-remove", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), bulkRemoveClientsFromService);

export default router;
