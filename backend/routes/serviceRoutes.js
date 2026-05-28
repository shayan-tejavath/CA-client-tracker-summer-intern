import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", authorizeRoles(...Object.values(ROLES)), getServices);
router.post("/", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), createService);
router.get("/:id", authorizeRoles(...Object.values(ROLES)), getServiceById);
router.put("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), updateService);
router.delete("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), deleteService);

export default router;
