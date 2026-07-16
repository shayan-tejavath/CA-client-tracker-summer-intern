import { useAuth } from "../context/AuthContext.jsx";

import {
  ROLES,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  canAccessFeature as checkFeatureAccess,
  getPermissionsForRole,
} from "../constants/rbac.js";

export const usePermission = () => {
  const { user } = useAuth();

  const userRole = user?.role;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : null;
  const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

  const hasExplicitPermissions = userPermissions !== null;

  const hasPermissionByUser = (permission) => {
    if (!hasExplicitPermissions) return null;
    return userPermissions.includes(permission);
  };

  const hasAnyPermissionByUser = (permissions = []) => {
    if (!hasExplicitPermissions) return null;
    return permissions.some((permission) => userPermissions.includes(permission));
  };

  const hasAllPermissionsByUser = (permissions = []) => {
    if (!hasExplicitPermissions) return null;
    return permissions.every((permission) => userPermissions.includes(permission));
  };

  const canAccessFeatureByUser = (feature) => {
    if (!userRole) return null;
    return checkFeatureAccess(userRole, feature);
  };

  return {
    hasPermission: (permission) => {
      if (!userRole) return false;
      if (isSuperAdmin) return true;

      const explicit = hasPermissionByUser(permission);
      if (explicit !== null) return explicit;

      return checkPermission(userRole, permission);
    },

    hasAnyPermission: (permissions = []) => {
      if (!userRole) return false;
      if (isSuperAdmin) return true;

      const explicit = hasAnyPermissionByUser(permissions);
      if (explicit !== null) return explicit;

      return checkAnyPermission(userRole, permissions);
    },

    hasAllPermissions: (permissions = []) => {
      if (!userRole) return false;
      if (isSuperAdmin) return true;

      const explicit = hasAllPermissionsByUser(permissions);
      if (explicit !== null) return explicit;

      return checkAllPermissions(userRole, permissions);
    },

    hasRole: (roles) => {
      if (!userRole) return false;

      if (Array.isArray(roles)) {
        return roles.includes(userRole);
      }

      return userRole === roles;
    },

    canAccessFeature: (feature) => {
      if (!userRole) return false;
      if (isSuperAdmin) return true;

      const explicit = canAccessFeatureByUser(feature);
      if (explicit !== null) return explicit;

      return checkFeatureAccess(userRole, feature);
    },

    getPermissions: () => {
      if (!userRole) return [];

      if (isSuperAdmin) {
        return getPermissionsForRole(ROLES.SUPER_ADMIN);
      }

      if (hasExplicitPermissions) {
        return userPermissions;
      }

      return getPermissionsForRole(userRole);
    },

    isAuthenticated: () => !!user,
    getRole: () => userRole,
    getUser: () => user,
  };
};

export default usePermission;