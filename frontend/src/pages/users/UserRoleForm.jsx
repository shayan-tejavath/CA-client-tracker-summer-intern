import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  createUserRole,
  deleteUserRole,
  getUserRole,
  updateUserRole,
} from "../../services/adminService.js";
import "../../styles/users.css";

const scopeOptions = ["Everything", "Self Only"];

const permissionSections = [
  {
    key: "client",
    title: "Client",
    actions: [
      { key: "create", label: "Create client" },
      { key: "edit", label: "Edit clients", scoped: true },
      { key: "view", label: "View clients", scoped: true },
      { key: "delete", label: "Delete clients", scoped: true },
      { key: "ledger", label: "View client ledger" },
      { key: "managePackages", label: "Manage Client Packages", scoped: true },
      { key: "viewPackages", label: "View Client Packages", scoped: true },
    ],
  },
  {
    key: "task",
    title: "Task",
    actions: [
      { key: "create", label: "Create task", scoped: true },
      { key: "edit", label: "Edit tasks", scoped: true },
      { key: "view", label: "View tasks", scoped: true },
      { key: "delete", label: "Delete tasks", scoped: true },
      { key: "checklist", label: "Update Task Checklist" },
      { key: "verify", label: "Verify tasks" },
      { key: "assign", label: "Assign tasks to other users" },
      { key: "timeLog", label: "Add or Update Time Log Manually" },
      { key: "deleteNote", label: "Delete Note" },
    ],
  },
  {
    key: "invoice",
    title: "Invoice/Receipt/Quotation",
    actions: [
      { key: "create", label: "Create invoice/receipt/quotation", scoped: true },
      { key: "edit", label: "Edit invoice/receipt/quotation", scoped: true },
      { key: "view", label: "View invoice/receipt/quotation", scoped: true },
      { key: "delete", label: "Delete invoice/receipt/quotation", scoped: true },
    ],
  },
  {
    key: "expense",
    title: "Expense",
    actions: [
      { key: "create", label: "Create expense" },
      { key: "edit", label: "Edit expense" },
      { key: "view", label: "View expense" },
      { key: "delete", label: "Delete expense" },
    ],
  },
  {
    key: "documents",
    title: "Doc. In-Out Reg / DSC",
    actions: [
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "view", label: "View" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "attendance",
    title: "Attendance",
    actions: [
      { key: "mark", label: "Mark attendance", scoped: true },
      { key: "markPastFuture", label: "Mark past/future attendance" },
    ],
  },
  {
    key: "todo",
    title: "To-Do",
    actions: [
      { key: "assign", label: "Assign to-do to other users" },
    ],
  },
  {
    key: "settings",
    title: "Settings",
    actions: [
      { key: "masters", label: "Manage Masters" },
    ],
  },
  {
    key: "reports",
    title: "Reports",
    actions: [
      { key: "view", label: "View reports" },
    ],
  },
  {
    key: "others",
    title: "Others",
    actions: [
      { key: "dashboard", label: "View dashboard" },
    ],
  },
];

const buildDefaultPermissions = () =>
  permissionSections.reduce((sections, section) => {
    sections[section.key] = section.actions.reduce((actions, action) => {
      actions[action.key] = {
        enabled: false,
        scope: action.scoped ? "Everything" : "",
      };
      return actions;
    }, {});
    return sections;
  }, {});

const UserRoleForm = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const isNew = roleId === "new";

  const [name, setName] = useState("");
  const [isSystem, setIsSystem] = useState(false);
  const [permissions, setPermissions] = useState(() => buildDefaultPermissions());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;

    const loadRole = async () => {
      try {
        setLoading(true);
        const role = await getUserRole(roleId);
        setName(role.name || "");
        setIsSystem(Boolean(role.isSystem));
        setPermissions({
          ...buildDefaultPermissions(),
          ...(role.permissions || {}),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load user role.");
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [isNew, roleId]);

  const title = useMemo(() => (isNew ? "New User Role" : "Edit User Role"), [isNew]);

  const togglePermission = (sectionKey, actionKey, checked) => {
    setPermissions((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [actionKey]: {
          ...(current[sectionKey]?.[actionKey] || {}),
          enabled: checked,
        },
      },
    }));
  };

  const changeScope = (sectionKey, actionKey, scope) => {
    setPermissions((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [actionKey]: {
          ...(current[sectionKey]?.[actionKey] || {}),
          scope,
        },
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    try {
      setSaving(true);
      const payload = { name: name.trim(), permissions };
      if (isNew) {
        await createUserRole(payload);
      } else {
        await updateUserRole(roleId, payload);
      }
      navigate("/dashboard/user-roles");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save user role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this user role?")) return;

    try {
      setDeleting(true);
      await deleteUserRole(roleId);
      navigate("/dashboard/user-roles");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user role.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <form className="users-page" onSubmit={handleSave}>
        <div className="users-header">
          <div>
            <p className="users-breadcrumb">
              <Link to="/dashboard/user-roles">User Roles</Link>
              <span>&gt;</span>
              {title}
            </p>
            <h1>{title}</h1>
          </div>

          {!isNew && !isSystem && (
            <button className="danger-button" type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {error && <div className="users-alert">{error}</div>}

        {loading ? (
          <section className="users-card users-empty">Loading role...</section>
        ) : (
          <>
            <section className="users-card role-name-card">
              <label htmlFor="roleName">Role Name <span>*</span></label>
              <input
                id="roleName"
                value={name}
                disabled={isSystem}
                onChange={(event) => setName(event.target.value)}
              />
            </section>

            <div className="permission-grid">
              {permissionSections.map((section) => (
                <section className="permission-card" key={section.key}>
                  <h2>{section.title}</h2>
                  <div className="permission-list">
                    {section.actions.map((action) => {
                      const value = permissions?.[section.key]?.[action.key] || {};

                      return (
                        <div className="permission-row" key={action.key}>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={Boolean(value.enabled)}
                              onChange={(event) =>
                                togglePermission(section.key, action.key, event.target.checked)
                              }
                            />
                            {action.label}
                          </label>

                          {action.scoped && (
                            <select
                              value={value.scope || "Everything"}
                              onChange={(event) => changeScope(section.key, action.key, event.target.value)}
                            >
                              {scopeOptions.map((scope) => (
                                <option key={scope} value={scope}>{scope}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        <button className="users-primary save-button" type="submit" disabled={saving || loading}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </DashboardLayout>
  );
};

export default UserRoleForm;
