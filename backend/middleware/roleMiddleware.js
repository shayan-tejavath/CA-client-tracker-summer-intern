/**
 * Role-based Authorization Middleware
 * Uses centralized RBAC constants from constants/rbac.js
 */

import { ROLES as RBAC_ROLES } from "../constants/rbac.js";

const normalizeRole = (role) => String(role || "").trim();

// Re-export ROLES for backward compatibility
export const ROLES = {
  SuperAdmin: RBAC_ROLES.SUPER_ADMIN,
  Partner: RBAC_ROLES.PARTNER,
  Manager: RBAC_ROLES.MANAGER,
  Employee: RBAC_ROLES.EMPLOYEE,
  Client: RBAC_ROLES.CLIENT,
};

/**
 * Middleware to authorize routes based on user roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      console.error("[AUTHORIZE] req.user is missing");
      return res.status(401).json({ message: "Not authorized - user context missing" });
    }

    if (!req.user.role) {
      console.error("[AUTHORIZE] req.user.role is missing", { userId: req.user._id, user: req.user });
      return res.status(401).json({ message: "Not authorized - no role assigned" });
    }

    const userRole = normalizeRole(req.user.role);
    console.log("[AUTHORIZE] Checking access", {
      userRole,
      userId: req.user._id,
      allowedRoles,
      allowed: allowedRoles.includes(userRole),
    });

    if (!allowedRoles.includes(userRole)) {
      console.warn("[AUTHORIZE] Access denied", {
        userRole,
        userId: req.user._id,
        allowedRoles,
      });
      return res.status(403).json({ message: "Forbidden - insufficient permissions" });
    }

    next();
  };
};

export default authorizeRoles;

