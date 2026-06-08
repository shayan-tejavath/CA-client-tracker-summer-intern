import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getPermissions, savePermissions } from "../../services/permissionService.js";
import { PERMISSIONS } from "../../constants/rbac.js";

const roles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];
const permissions = [
  { key: PERMISSIONS.CLIENT_LIST, label: "View clients" },
  { key: PERMISSIONS.CLIENT_CREATE, label: "Create clients" },
  { key: PERMISSIONS.CLIENT_UPDATE, label: "Edit clients" },
  { key: PERMISSIONS.CLIENT_DELETE, label: "Delete clients" },
  { key: PERMISSIONS.TASK_ASSIGN, label: "Assign tasks" },
  { key: PERMISSIONS.TASK_UPDATE, label: "Update tasks" },
  { key: PERMISSIONS.REPORTS_VIEW, label: "View reports" },
  { key: PERMISSIONS.USER_LIST, label: "View users" },
];

const PermissionMatrix = () => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      try {
        const records = await getPermissions();
        const normalized = roles.reduce((acc, role) => {
          const record = records.find((item) => item.role === role);
          acc[role] = new Set(record?.permissions || []);
          return acc;
        }, {});
        setRolePermissions(normalized);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load permissions.");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const togglePermission = (role, permissionKey) => {
    setRolePermissions((current) => {
      const next = { ...current };
      const permissionSet = new Set(next[role] || []);
      if (permissionSet.has(permissionKey)) {
        permissionSet.delete(permissionKey);
      } else {
        permissionSet.add(permissionKey);
      }
      next[role] = permissionSet;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = roles.reduce((acc, role) => {
        acc[role] = Array.from(rolePermissions[role] || []);
        return acc;
      }, {});
      await savePermissions(payload);
      toast.success("Permissions saved successfully.");
      setError("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save permissions.");
      setError(err.response?.data?.message || "Unable to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Permission management</p>
            <h1>Role permission matrix</h1>
            <p>Review and update access controls for each role across core system actions.</p>
          </div>
          <div className="page-tools">
            <button type="button" className="button button-primary" onClick={handleSave} disabled={loading || saving}>
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="page-card">
          <p>Loading permission matrix…</p>
        </section>
      ) : error ? (
        <section className="page-card alert danger">{error}</section>
      ) : (
        <section className="page-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  {roles.map((role) => (
                    <th key={role}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.key}>
                    <td>{permission.label}</td>
                    {roles.map((role) => (
                      <td key={`${role}-${permission.key}`} className="permission-checkbox-cell">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={rolePermissions[role]?.has(permission.key) || false}
                            onChange={() => togglePermission(role, permission.key)}
                          />
                          <span className="checkbox-custom" />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
};

export default PermissionMatrix;
