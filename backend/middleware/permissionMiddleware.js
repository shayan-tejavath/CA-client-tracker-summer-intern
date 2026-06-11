/**
 * Permission-based Authorization Middleware
 * Verifies JWT and loads permissions from the Permission collection.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Permission from "../models/Permission.js";
import { ROLES } from "../constants/rbac.js";

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
};

const verifyJwtUser = async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    console.error("[CHECK_PERMISSION] No token provided");
    res.status(401).json({ message: "Not authorized - no token" });
    return null;
  }

  if (!process.env.JWT_SECRET) {
    console.error("[CHECK_PERMISSION] JWT_SECRET is not configured");
    res.status(500).json({ message: "Server configuration error" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.error("[CHECK_PERMISSION] User not found for token", decoded.id);
      res.status(401).json({ message: "Not authorized - user not found" });
      return null;
    }

    return user;
  } catch (error) {
    console.error("[CHECK_PERMISSION] Token verification failed", error.message);
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
      return null;
    }
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid token" });
      return null;
    }
    res.status(401).json({ message: "Not authorized" });
    return null;
  }
};

/**
 * Middleware factory for permission checks.
 * @param {string} permissionName
 */
export const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const user = await verifyJwtUser(req, res);
      if (!user) return;

      const permissionRecord = await Permission.findOne({ role: user.role }).lean();
      const permissions = permissionRecord?.permissions || [];

      const hasPermission = Array.isArray(permissions) && permissions.includes(permissionName);
      if (!hasPermission) {
        console.warn("[CHECK_PERMISSION] Permission denied", {
          userId: user._id,
          role: user.role,
          requiredPermission: permissionName,
        });
        return res.status(403).json({ message: "Forbidden - insufficient permissions" });
      }

      req.user = user;
      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("[CHECK_PERMISSION] Unexpected error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

export default checkPermission;

// Export ROLES for backward compatibility
export { ROLES };
