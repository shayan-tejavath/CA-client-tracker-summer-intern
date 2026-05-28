import express from "express";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), getClients);
router.post("/", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), createClient);
router.get("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner, ROLES.Manager), getClientById);
router.put("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), updateClient);
router.delete("/:id", authorizeRoles(ROLES.SuperAdmin, ROLES.Partner), deleteClient);
export default router;

