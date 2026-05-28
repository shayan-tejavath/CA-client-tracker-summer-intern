import express from "express";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  getAdminOverview,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPermissions,
  updatePermissions,
} from "../controllers/adminController.js";

const router = express.Router();
router.use(protect);
router.get("/overview", authorizeRoles(ROLES.SuperAdmin), getAdminOverview);
router.get("/users", authorizeRoles(ROLES.SuperAdmin), getUsers);
router.post("/users", authorizeRoles(ROLES.SuperAdmin), createUser);
router.put("/users/:id", authorizeRoles(ROLES.SuperAdmin), updateUser);
router.delete("/users/:id", authorizeRoles(ROLES.SuperAdmin), deleteUser);
router.get("/permissions", authorizeRoles(ROLES.SuperAdmin), getPermissions);
router.put("/permissions", authorizeRoles(ROLES.SuperAdmin), updatePermissions);

export default router;
