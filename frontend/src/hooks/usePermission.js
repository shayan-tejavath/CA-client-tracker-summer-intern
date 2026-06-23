import { useAuth } from "../context/AuthContext.jsx";

import {
  ROLES,
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



  // ============================================
  // SUPER ADMIN BYPASS
  // ============================================

  const isSuperAdmin =
    userRole === ROLES.SUPER_ADMIN;



  // ============================================
  // USER PERMISSION HELPERS
  // ============================================

  const hasPermissionByUser = (
    permission
  ) => {

    if (
      !Array.isArray(userPermissions)
    ) {
      return null;
    }

    return userPermissions.includes(
      permission
    );
  };



  const hasAnyPermissionByUser = (
    permissions = []
  ) => {

    if (
      !Array.isArray(userPermissions)
    ) {
      return null;
    }

    return permissions.some(
      (permission) =>
        userPermissions.includes(
          permission
        )
    );
  };



  const hasAllPermissionsByUser = (
    permissions = []
  ) => {

    if (
      !Array.isArray(userPermissions)
    ) {
      return null;
    }

    return permissions.every(
      (permission) =>
        userPermissions.includes(
          permission
        )
    );
  };



  const canAccessFeatureByUser = (
    feature
  ) => {

    if (
      !Array.isArray(userPermissions)
    ) {
      return null;
    }

    return null;
  };



  return {

    // ============================================
    // HAS PERMISSION
    // ============================================

    hasPermission: (
      permission
    ) => {

      if (!userRole) {
        return false;
      }

      // SUPER ADMIN ALWAYS TRUE
      if (isSuperAdmin) {
        return true;
      }

      const explicit =
        hasPermissionByUser(
          permission
        );

      if (explicit !== null) {
        return explicit;
      }

      return checkPermission(
        userRole,
        permission
      );
    },



    // ============================================
    // HAS ANY PERMISSION
    // ============================================

    hasAnyPermission: (
      permissions = []
    ) => {

      if (!userRole) {
        return false;
      }

      if (isSuperAdmin) {
        return true;
      }

      const explicit =
        hasAnyPermissionByUser(
          permissions
        );

      if (explicit !== null) {
        return explicit;
      }

      return hasAnyPermission(
        userRole,
        permissions
      );
    },



    // ============================================
    // HAS ALL PERMISSIONS
    // ============================================

    hasAllPermissions: (
      permissions = []
    ) => {

      if (!userRole) {
        return false;
      }

      if (isSuperAdmin) {
        return true;
      }

      const explicit =
        hasAllPermissionsByUser(
          permissions
        );

      if (explicit !== null) {
        return explicit;
      }

      return hasAllPermissions(
        userRole,
        permissions
      );
    },



    // ============================================
    // ROLE CHECK
    // ============================================

    hasRole: (roles) => {

      if (!userRole) {
        return false;
      }

      if (Array.isArray(roles)) {
        return roles.includes(
          userRole
        );
      }

      return userRole === roles;
    },



    // ============================================
    // FEATURE ACCESS
    // ============================================

    canAccessFeature: (
      feature
    ) => {

      if (!userRole) {
        return false;
      }

      if (isSuperAdmin) {
        return true;
      }

      const explicit =
        canAccessFeatureByUser(
          feature
        );

      if (explicit !== null) {
        return explicit;
      }

      return canAccessFeature(
        userRole,
        feature
      );
    },



    // ============================================
    // GET PERMISSIONS
    // ============================================

    getPermissions: () => {

      if (!userRole) {
        return [];
      }

      // SUPER ADMIN GETS ALL
      if (isSuperAdmin) {
        return getPermissionsForRole(
          ROLES.SUPER_ADMIN
        );
      }

      if (
        Array.isArray(userPermissions)
      ) {
        return userPermissions;
      }

      return getPermissionsForRole(
        userRole
      );
    },



    // ============================================
    // AUTH HELPERS
    // ============================================

    isAuthenticated: () => !!user,

    getRole: () => userRole,

    getUser: () => user,

  };
};

export default usePermission;