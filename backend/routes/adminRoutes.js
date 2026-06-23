import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles, { ROLES } from "../middleware/roleMiddleware.js";
import {
  getAdminOverview,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRoles,
  getUserRole,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  getPermissions,
  updatePermissions,
} from "../controllers/adminController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(protect);

router.get("/overview", authorizeRoles(ROLES.SuperAdmin), getAdminOverview);
router.get("/users", authorizeRoles(ROLES.SuperAdmin), getUsers);
router.post("/users", authorizeRoles(ROLES.SuperAdmin), upload.single("photo"), createUser);
router.put("/users/:id", authorizeRoles(ROLES.SuperAdmin), upload.single("photo"), updateUser);
router.delete("/users/:id", authorizeRoles(ROLES.SuperAdmin), deleteUser);

router.get("/user-roles", authorizeRoles(ROLES.SuperAdmin), getUserRoles);
router.post("/user-roles", authorizeRoles(ROLES.SuperAdmin), createUserRole);
router.get("/user-roles/:id", authorizeRoles(ROLES.SuperAdmin), getUserRole);
router.put("/user-roles/:id", authorizeRoles(ROLES.SuperAdmin), updateUserRole);
router.delete("/user-roles/:id", authorizeRoles(ROLES.SuperAdmin), deleteUserRole);

router.get("/permissions", authorizeRoles(ROLES.SuperAdmin), getPermissions);
router.put("/permissions", authorizeRoles(ROLES.SuperAdmin), updatePermissions);

export default router;
