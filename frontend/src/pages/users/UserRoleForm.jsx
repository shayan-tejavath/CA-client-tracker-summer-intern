import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createUserRole, deleteUserRole, getUserRole, updateUserRole } from "../../services/adminService.js";
import "../../styles/users.css";

const permissionSections = [
  {
    key: "client",
    title: "Client",
    actions: [
      ["create", "Create client"],
      ["edit", "Edit clients"],
      ["view", "View clients"],
      ["delete", "Delete clients"],
      ["ledger", "View client ledger"],
      ["managePackages", "Manage Client Packages"],
      ["viewPackages", "View Client Packages"],
    ],
  },
  {
    key: "task",
    title: "Task",
    actions: [
      ["create", "Create task"],
      ["edit", "Edit tasks"],
      ["view", "View tasks"],
      ["delete", "Delete tasks"],
      ["checklist", "Update Task Checklist"],
      ["verify", "Verify tasks"],
      ["assign", "Assign tasks to other users"],
      ["timeLog", "Add or Update Time Log Manually"],
      ["deleteNote", "Delete Note"],
    ],
  },
  {
    key: "invoice",
    title: "Invoice/Receipt/Quotation",
    actions: [
      ["create", "Create invoice/receipt/quotation"],
      ["edit", "Edit invoice/receipt/quotation"],
      ["view", "View invoice/receipt/quotation"],
      ["delete", "Delete invoice/receipt/quotation"],
    ],
  },
  {
    key: "expense",
    title: "Expense",
    actions: [
      ["create", "Create expense"],
      ["edit", "Edit expense"],
      ["view", "View expense"],
      ["delete", "Delete expense"],
    ],
  },
  {
    key: "documents",
    title: "Doc. In-Out Reg / DSC",
    actions: [
      ["create", "Create"],
      ["edit", "Edit"],
      ["view", "View"],
      ["delete", "Delete"],
    ],
  },
  {
    key: "attendance",
    title: "Attendance",
    actions: [
      ["mark", "Mark attendance"],
      ["markPastFuture", "Mark past/future attendance"],
    ],
  },
  {
    key: "todo",
    title: "To-Do",
    actions: [["assign", "Assign to-do to other users"]],
  },
  {
    key: "settings",
    title: "Settings",
    actions: [["masters", "Manage Masters"]],
  },
  {
    key: "reports",
    title: "Reports",
    actions: [["view", "View reports"]],
  },
  {
    key: "others",
    title: "Others",
    actions: [["dashboard", "View dashboard"]],
  },
];

const scopes = ["Everything", "Self Only"];

const makeDefaultPermissions = () =>
  permissionSections.reduce((acc, section) => {
    acc[section.key] = section.actions.reduce((actionAcc, [key]) => {
      actionAcc[key] = { enabled: false, scope: "Everything" };
      return actionAcc;
    }, {});
    return acc;
  }, {});

const UserRoleForm = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const isNew = roleId === "new";
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState(makeDefaultPermissions);
  const [isSystem, setIsSystem] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;

    const loadRole = async () => {
      try {
        const data = await getUserRole(roleId);
        setRoleName(data.name || "");
        setPermissions({ ...makeDefaultPermissions(), ...(data.permissions || {}) });
        setIsSystem(Boolean(data.isSystem));
      } catch (err) {
        toast.error(err.response?.data?.message || "Unable to load user role.");
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [isNew, roleId]);

  const pageTitle = useMemo(() => (isNew ? "New User Role" : "Edit User Role"), [isNew]);

  const updatePermission = (section, action, key, value) => {
    setPermissions((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [action]: {
          ...current[section]?.[action],
          [key]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { name: roleName, permissions };
      if (isNew) await createUserRole(payload);
      else await updateUserRole(roleId, payload);
      toast.success("User role saved successfully.");
      navigate("/dashboard/user-roles");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save user role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this user role?")) return;
    try {
      await deleteUserRole(roleId);
      toast.success("User role deleted.");
      navigate("/dashboard/user-roles");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete user role.");
    }
  };

  return (
    <DashboardLayout>
      <form className="users-page" onSubmit={handleSubmit}>
        <div className="users-header">
          <div>
            <p className="users-breadcrumb">
              <Link to="/dashboard/user-roles">User Roles</Link> <span>›</span> {pageTitle}
            </p>
            <h1>{pageTitle}</h1>
          </div>
          {!isNew && !isSystem && (
            <button className="danger-button" type="button" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>

        <section className="users-card role-name-card">
          <label>Role Name <span>*</span></label>
          <input required disabled={isSystem} value={roleName} onChange={(event) => setRoleName(event.target.value)} />
        </section>

        {loading ? (
          <div className="users-empty">Loading role...</div>
        ) : (
          <div className="permission-grid">
            {permissionSections.map((section) => (
              <section className="permission-card" key={section.key}>
                <h2>{section.title}</h2>
                <div className="permission-list">
                  {section.actions.map(([action, label]) => {
                    const value = permissions?.[section.key]?.[action] || {};
                    return (
                      <div className="permission-row" key={action}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={Boolean(value.enabled)}
                            onChange={(event) => updatePermission(section.key, action, "enabled", event.target.checked)}
                          />
                          {label}
                        </label>
                        {(action === "edit" || action === "view" || action === "delete" || action === "mark") && (
                          <select
                            value={value.scope || "Everything"}
                            onChange={(event) => updatePermission(section.key, action, "scope", event.target.value)}
                          >
                            {scopes.map((scope) => <option key={scope}>{scope}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <button className="users-primary save-button" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </DashboardLayout>
  );
};

export default UserRoleForm;
