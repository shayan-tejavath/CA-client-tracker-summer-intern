/**
 * Frontend RBAC Constants - Mirror of backend rbac.js
 * 
 * Used for:
 * - Route protection
 * - Component rendering based on roles/permissions
 * - UI element visibility
 */

// ============================================================================
// ROLE DEFINITIONS (must match backend)
// ============================================================================
export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  PARTNER: "Partner",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  CLIENT: "Client",
};

// Backward compatibility
export const ROLE_NAMES = {
  SuperAdmin: ROLES.SUPER_ADMIN,
  Partner: ROLES.PARTNER,
  Manager: ROLES.MANAGER,
  Employee: ROLES.EMPLOYEE,
  Client: ROLES.CLIENT,
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: "Full system access - manage users, settings, and all features",
  [ROLES.PARTNER]: "Partner-level access - manage clients, services, and team",
  [ROLES.MANAGER]: "Manager-level access - manage clients and tasks",
  [ROLES.EMPLOYEE]: "Employee-level access - view/manage assigned tasks and documents",
  [ROLES.CLIENT]: "Client-level access - view own documents and communications",
};

// ============================================================================
// PERMISSIONS (must match backend)
// ============================================================================
export const PERMISSIONS = {
  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_LIST: "user:list",

  // Client Management
  CLIENT_CREATE: "client:create",
  CLIENT_READ: "client:read",
  CLIENT_UPDATE: "client:update",
  CLIENT_DELETE: "client:delete",
  CLIENT_LIST: "client:list",

  // Task Management
  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_LIST: "task:list",
  TASK_ASSIGN: "task:assign",

  // Document Management
  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_READ: "document:read",
  DOCUMENT_UPDATE: "document:update",
  DOCUMENT_DELETE: "document:delete",
  DOCUMENT_LIST: "document:list",

  // Service Management
  SERVICE_CREATE: "service:create",
  SERVICE_READ: "service:read",
  SERVICE_UPDATE: "service:update",
  SERVICE_DELETE: "service:delete",
  SERVICE_LIST: "service:list",

  // Dashboard & Reports
  DASHBOARD_VIEW: "dashboard:view",
  REPORTS_VIEW: "reports:view",
  ADMIN_PANEL_ACCESS: "admin:access",
  ADMIN_SETTINGS: "admin:settings",

  // System
  SYSTEM_SETTINGS: "system:settings",
  AUDIT_LOG_VIEW: "audit:view",
};

// ============================================================================
// ROLE-PERMISSION MAPPINGS (must match backend)
// ============================================================================
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.PARTNER]: [
    // User management (limited)
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,

    // Full client management
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.CLIENT_LIST,

    // Full task management
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_LIST,
    PERMISSIONS.TASK_ASSIGN,

    // Full document management
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LIST,

    // Service management
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.SERVICE_UPDATE,
    PERMISSIONS.SERVICE_DELETE,
    PERMISSIONS.SERVICE_LIST,

    // Dashboard & Reports
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],

  [ROLES.MANAGER]: [
    // User management (read-only)
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,

    // Full client management
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.CLIENT_LIST,

    // Full task management
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_LIST,
    PERMISSIONS.TASK_ASSIGN,

    // Full document management
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LIST,

    // Service (read-only)
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.SERVICE_LIST,

    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  [ROLES.EMPLOYEE]: [
    // Task management (limited)
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_LIST,

    // Document management
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_LIST,

    // Service (read-only)
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.SERVICE_LIST,

    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  [ROLES.CLIENT]: [
    // Document management (read-only)
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_LIST,

    // Service (read-only)
    PERMISSIONS.SERVICE_READ,
    PERMISSIONS.SERVICE_LIST,

    // Dashboard (read-only)
    PERMISSIONS.DASHBOARD_VIEW,
  ],
};

// ============================================================================
// FEATURE ACCESS MATRIX (for UI rendering)
// ============================================================================
export const FEATURE_ACCESS = {
  CLIENT_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER],
  TASK_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE],
  DOCUMENT_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT],
  REPORTS: [ROLES.SUPER_ADMIN, ROLES.PARTNER],
  ADMIN_PANEL: [ROLES.SUPER_ADMIN],
  USER_MANAGEMENT: [ROLES.SUPER_ADMIN],
};

// ============================================================================
// SIDEBAR MENU ITEMS CONFIGURATION
// ============================================================================
export const SIDEBAR_MENU = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "dashboard",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE],
    requiredPermission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    name: "Clients",
    path: "/dashboard/clients",
    icon: "clients",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER],
    requiredPermission: PERMISSIONS.CLIENT_LIST,
  },
  {
    name: "Services",
    path: "/dashboard/services",
    icon: "services",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE],
    requiredPermission: PERMISSIONS.SERVICE_LIST,
  },
  {
    name: "Tasks",
    path: "/dashboard/tasks",
    icon: "tasks",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE],
    requiredPermission: PERMISSIONS.TASK_LIST,
  },
  {
    name: "Documents",
    path: "/dashboard/documents",
    icon: "documents",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT],
    requiredPermission: PERMISSIONS.DOCUMENT_LIST,
  },
  {
    name: "Reports",
    path: "/dashboard/reports",
    icon: "reports",
    requiredRoles: [ROLES.SUPER_ADMIN, ROLES.PARTNER],
    requiredPermission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    name: "Admin",
    path: "/dashboard/admin",
    icon: "admin",
    requiredRoles: [ROLES.SUPER_ADMIN],
    requiredPermission: PERMISSIONS.ADMIN_PANEL_ACCESS,
  },
  {
    name: "Permissions",
    path: "/dashboard/permissions",
    icon: "admin",
    requiredRoles: [ROLES.SUPER_ADMIN],
    requiredPermission: PERMISSIONS.ADMIN_SETTINGS,
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if role has any of the given permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions = []) => {
  return permissions.some((permission) => hasPermission(role, permission));
};

/**
 * Check if role has all of the given permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions = []) => {
  return permissions.every((permission) => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if feature is accessible by role
 * @param {string} role - User role
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export const canAccessFeature = (role, feature) => {
  const allowedRoles = FEATURE_ACCESS[feature] || [];
  return allowedRoles.includes(role);
};

/**
 * Get accessible menu items for a role
 * @param {string} role - User role
 * @returns {Array} Menu items
 */
export const getMenuForRole = (role) => {
  return SIDEBAR_MENU.filter((item) => item.requiredRoles.includes(role));
};

export default {
  ROLES,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  FEATURE_ACCESS,
  SIDEBAR_MENU,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
  canAccessFeature,
  getMenuForRole,
};
