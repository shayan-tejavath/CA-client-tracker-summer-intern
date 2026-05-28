/**
 * Custom Hook for Permission & Role Checking
 * 
 * Usage:
 * const { hasPermission, canAccess, hasRole } = usePermission();
 * 
 * if (hasPermission(PERMISSIONS.CLIENT_CREATE)) {
 *   // Show create client button
 * }
 */

import { useAuth } from "../context/AuthContext.jsx";
import {
  hasPermission as checkPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessFeature,
  getPermissionsForRole,
} from "../constants/rbac.js";

export const usePermission = () => {
  const { user } = useAuth();
  const userRole = user?.role;
  const userPermissions = user?.permissions;
  const hasPermissionByUser = (permission) => {
    if (!Array.isArray(userPermissions)) return null;
    return userPermissions.includes(permission);
  };

  const hasAnyPermissionByUser = (permissions = []) => {
    if (!Array.isArray(userPermissions)) return null;
    return permissions.some((permission) => userPermissions.includes(permission));
  };

  const hasAllPermissionsByUser = (permissions = []) => {
    if (!Array.isArray(userPermissions)) return null;
    return permissions.every((permission) => userPermissions.includes(permission));
  };

  const canAccessFeatureByUser = (feature) => {
    if (!Array.isArray(userPermissions)) return null;
    return null; // feature access remains role-based unless explicit feature permission mapping is added later
  };

  return {
    /**
     * Check if current user has a specific permission
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission: (permission) => {
      if (!userRole) return false;
      const explicit = hasPermissionByUser(permission);
      if (explicit !== null) return explicit;
      return checkPermission(userRole, permission);
    },

    /**
     * Check if current user has any of the given permissions
     * @param {string[]} permissions
     * @returns {boolean}
     */
    hasAnyPermission: (permissions = []) => {
      if (!userRole) return false;
      const explicit = hasAnyPermissionByUser(permissions);
      if (explicit !== null) return explicit;
      return hasAnyPermission(userRole, permissions);
    },

    /**
     * Check if current user has all of the given permissions
     * @param {string[]} permissions
     * @returns {boolean}
     */
    hasAllPermissions: (permissions = []) => {
      if (!userRole) return false;
      const explicit = hasAllPermissionsByUser(permissions);
      if (explicit !== null) return explicit;
      return hasAllPermissions(userRole, permissions);
    },

    /**
     * Check if current user has a specific role
     * @param {string|string[]} roles
     * @returns {boolean}
     */
    hasRole: (roles) => {
      if (!userRole) return false;
      if (Array.isArray(roles)) {
        return roles.includes(userRole);
      }
      return userRole === roles;
    },

    /**
     * Check if current user can access a feature
     * @param {string} feature
     * @returns {boolean}
     */
    canAccessFeature: (feature) => {
      if (!userRole) return false;
      const explicit = canAccessFeatureByUser(feature);
      if (explicit !== null) return explicit;
      return canAccessFeature(userRole, feature);
    },

    /**
     * Get all permissions for current user
     * @returns {string[]}
     */
    getPermissions: () => {
      if (!userRole) return [];
      if (Array.isArray(userPermissions)) return userPermissions;
      return getPermissionsForRole(userRole);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated: () => !!user,

    /**
     * Get current user role
     * @returns {string}
     */
    getRole: () => userRole,

    /**
     * Get current user
     * @returns {Object}
     */
    getUser: () => user,
  };
};

export default usePermission;
