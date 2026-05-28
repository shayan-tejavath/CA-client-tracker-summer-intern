import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Permission from "../models/Permission.js";
import { getPermissionsForRole } from "../constants/rbac.js";
import generateToken from "../utils/generateToken.js";

const validRoles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const resolveRolePermissions = async (role) => {
  const record = await Permission.findOne({ role }).lean();
  if (record && Array.isArray(record.permissions) && record.permissions.length > 0) {
    return record.permissions;
  }
  return getPermissionsForRole(role);
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "Client" } = req.body;

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.error("[LOGIN] User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.error("[LOGIN] Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const permissions = await resolveRolePermissions(user.role);
    console.log("[LOGIN] Success", {
      userId: user._id,
      role: user.role,
      email: user.email,
      permissions: permissions.length,
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const permissions = await resolveRolePermissions(req.user.role);
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminDashboard = async (req, res, next) => {
  try {
    res.json({ message: "Welcome SuperAdmin. This route is role protected." });
  } catch (error) {
    next(error);
  }
};

