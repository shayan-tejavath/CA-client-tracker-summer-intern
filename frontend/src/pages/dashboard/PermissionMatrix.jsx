import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getPermissions,
  savePermissions,
} from "../../services/permissionService.js";

import { PERMISSIONS } from "../../constants/rbac.js";

import {
  FaShieldAlt,
  FaUsers,
  FaTasks,
  FaChartBar,
  FaUserCog,
} from "react-icons/fa";

const roles = [
  "SuperAdmin",
  "Partner",
  "Manager",
  "Employee",
  "Client",
];

const permissionGroups = [
  {
    title: "Client Management",
    icon: <FaUsers />,
    permissions: [
      {
        key: PERMISSIONS.CLIENT_LIST,
        label: "View Clients",
      },
      {
        key: PERMISSIONS.CLIENT_CREATE,
        label: "Create Clients",
      },
      {
        key: PERMISSIONS.CLIENT_UPDATE,
        label: "Edit Clients",
      },
      {
        key: PERMISSIONS.CLIENT_DELETE,
        label: "Delete Clients",
      },
    ],
  },

  {
    title: "Task Management",
    icon: <FaTasks />,
    permissions: [
      {
        key: PERMISSIONS.TASK_ASSIGN,
        label: "Assign Tasks",
      },
      {
        key: PERMISSIONS.TASK_UPDATE,
        label: "Update Tasks",
      },
    ],
  },

  {
    title: "Reports & Analytics",
    icon: <FaChartBar />,
    permissions: [
      {
        key: PERMISSIONS.REPORTS_VIEW,
        label: "View Reports",
      },
    ],
  },

  {
    title: "User Management",
    icon: <FaUserCog />,
    permissions: [
      {
        key: PERMISSIONS.USER_LIST,
        label: "View Users",
      },
    ],
  },
];

const PermissionMatrix = () => {
  const [rolePermissions, setRolePermissions] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [hasChanges, setHasChanges] =
    useState(false);

  useEffect(() => {
    const loadPermissions =
      async () => {
        setLoading(true);

        try {
          const records =
            await getPermissions();

          const normalized =
            roles.reduce(
              (acc, role) => {
                const record =
                  records.find(
                    (item) =>
                      item.role === role
                  );

                acc[role] = new Set(
                  record?.permissions ||
                    []
                );

                return acc;
              },
              {}
            );

          setRolePermissions(
            normalized
          );

          setError("");
        } catch (err) {
          setError(
            err.response?.data
              ?.message ||
              "Unable to load permissions."
          );
        } finally {
          setLoading(false);
        }
      };

    loadPermissions();
  }, []);

  const togglePermission = (
    role,
    permissionKey
  ) => {
    setRolePermissions(
      (current) => {
        const next = {
          ...current,
        };

        const permissionSet =
          new Set(
            next[role] || []
          );

        if (
          permissionSet.has(
            permissionKey
          )
        ) {
          permissionSet.delete(
            permissionKey
          );
        } else {
          permissionSet.add(
            permissionKey
          );
        }

        next[role] = permissionSet;

        return next;
      }
    );

    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload =
        roles.reduce(
          (acc, role) => {
            acc[role] =
              Array.from(
                rolePermissions[
                  role
                ] || []
              );

            return acc;
          },
          {}
        );

      await savePermissions(
        payload
      );

      toast.success(
        "Permissions updated successfully."
      );

      setHasChanges(false);

      setError("");
    } catch (err) {
      toast.error(
        err.response?.data
          ?.message ||
          "Unable to save permissions."
      );

      setError(
        err.response?.data
          ?.message ||
          "Unable to save permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  const setFullAccess = (
    role
  ) => {
    const allPermissions =
      permissionGroups.flatMap(
        (group) =>
          group.permissions.map(
            (p) => p.key
          )
      );

    setRolePermissions(
      (current) => ({
        ...current,
        [role]: new Set(
          allPermissions
        ),
      })
    );

    setHasChanges(true);
  };

  const clearAccess = (
    role
  ) => {
    setRolePermissions(
      (current) => ({
        ...current,
        [role]: new Set(),
      })
    );

    setHasChanges(true);
  };

  const roleStats = useMemo(
    () =>
      roles.map((role) => ({
        role,
        total:
          rolePermissions[
            role
          ]?.size || 0,
      })),
    [rolePermissions]
  );

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              RBAC MANAGEMENT
            </p>

            <h1>
              Enterprise Permission
              Matrix
            </h1>

            <p>
              Control access,
              security, and role
              permissions across
              the platform.
            </p>
          </div>

          <div className="page-tools">
            <button
              type="button"
              className="button button-primary"
              onClick={
                handleSave
              }
              disabled={
                loading ||
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="permissions-save-banner">
            Unsaved changes
            detected.
          </div>
        )}
      </section>

      {/* ROLE CARDS */}

      <section className="permissions-role-grid">
        {roleStats.map(
          (item) => (
            <div
              key={item.role}
              className="permission-role-card"
            >
              <div className="permission-role-icon">
                <FaShieldAlt />
              </div>

              <h3>
                {item.role}
              </h3>

              <h2>
                {item.total}
              </h2>

              <p>
                Active Permissions
              </p>

              <div className="permission-role-actions">
                <button
                  className="button small"
                  onClick={() =>
                    setFullAccess(
                      item.role
                    )
                  }
                >
                  Full Access
                </button>

                <button
                  className="button secondary small"
                  onClick={() =>
                    clearAccess(
                      item.role
                    )
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          )
        )}
      </section>

      {loading ? (
        <section className="page-card">
          Loading permissions...
        </section>
      ) : error ? (
        <section className="page-card alert danger">
          {error}
        </section>
      ) : (
        <div className="permissions-groups">
          {permissionGroups.map(
            (group) => (
              <section
                key={group.title}
                className="page-card"
              >
                <div className="permission-group-header">
                  <div className="permission-group-title">
                    <span>
                      {group.icon}
                    </span>

                    <div>
                      <h2>
                        {
                          group.title
                        }
                      </h2>

                      <p>
                        Manage{" "}
                        {
                          group.title
                        }{" "}
                        permissions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table permission-table">
                    <thead>
                      <tr>
                        <th>
                          Permission
                        </th>

                        {roles.map(
                          (
                            role
                          ) => (
                            <th
                              key={
                                role
                              }
                            >
                              {
                                role
                              }
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {group.permissions.map(
                        (
                          permission
                        ) => (
                          <tr
                            key={
                              permission.key
                            }
                          >
                            <td>
                              {
                                permission.label
                              }
                            </td>

                            {roles.map(
                              (
                                role
                              ) => (
                                <td
                                  key={`${role}-${permission.key}`}
                                >
                                  <div className="toggle-wrapper">
                                    <label className="switch">
                                      <input
                                        type="checkbox"
                                        checked={
                                          rolePermissions[
                                            role
                                          ]?.has(
                                            permission.key
                                          ) ||
                                          false
                                        }
                                        onChange={() =>
                                          togglePermission(
                                            role,
                                            permission.key
                                          )
                                        }
                                      />

                                      <span className="slider"></span>
                                    </label>
                                  </div>
                                </td>
                              )
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PermissionMatrix;