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

// UI Helper: Map roles to premium brand colors
const getRoleColor = (role) => {
  const colors = {
    SuperAdmin: "#A855F7", // Purple
    Partner: "#06B6D4",    // Cyan
    Manager: "#3B82F6",    // Blue
    Employee: "#10B981",   // Emerald
    Client: "#FBBF24",     // Amber
  };
  return colors[role] || "#7C3AED";
};

const permissionGroups = [
  {
    title: "Client Management",
    icon: <FaUsers />,
    permissions: [
      { key: PERMISSIONS.CLIENT_LIST, label: "View Clients" },
      { key: PERMISSIONS.CLIENT_CREATE, label: "Create Clients" },
      { key: PERMISSIONS.CLIENT_UPDATE, label: "Edit Clients" },
      { key: PERMISSIONS.CLIENT_DELETE, label: "Delete Clients" },
    ],
  },
  {
    title: "Task Management",
    icon: <FaTasks />,
    permissions: [
      { key: PERMISSIONS.TASK_ASSIGN, label: "Assign Tasks" },
      { key: PERMISSIONS.TASK_UPDATE, label: "Update Tasks" },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: <FaChartBar />,
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: "View Reports" },
    ],
  },
  {
    title: "User Management",
    icon: <FaUserCog />,
    permissions: [
      { key: PERMISSIONS.USER_LIST, label: "View Users" },
    ],
  },
];

const PermissionMatrix = () => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

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

    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = roles.reduce((acc, role) => {
        acc[role] = Array.from(rolePermissions[role] || []);
        return acc;
      }, {});

      await savePermissions(payload);

      toast.success("Permissions updated successfully.");
      setHasChanges(false);
      setError("");
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to save permissions.";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const setFullAccess = (role) => {
    const allPermissions = permissionGroups.flatMap((group) =>
      group.permissions.map((p) => p.key)
    );

    setRolePermissions((current) => ({
      ...current,
      [role]: new Set(allPermissions),
    }));

    setHasChanges(true);
  };

  const clearAccess = (role) => {
    setRolePermissions((current) => ({
      ...current,
      [role]: new Set(),
    }));

    setHasChanges(true);
  };

  const roleStats = useMemo(
    () =>
      roles.map((role) => ({
        role,
        total: rolePermissions[role]?.size || 0,
      })),
    [rolePermissions]
  );

  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ BASE & ANIMATIONS ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes qca-pulse-amber {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
          50% { box-shadow: 0 0 12px 2px rgba(249, 115, 22, 0.3); }
        }

        .qca-matrix-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── SURFACES & HEADERS ── */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .qca-header-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 24px; margin-bottom: 24px;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #A855F7; text-transform: uppercase;
          background: rgba(168, 85, 247, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(168, 85, 247, 0.2);
          margin-bottom: 12px;
        }

        .qca-title { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 8px 0; }
        .qca-subtitle { font-size: 1rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── UNSAVED BANNER ── */
        .qca-unsaved-banner {
          background: linear-gradient(90deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.1));
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #FDBA74; padding: 12px 20px; border-radius: 12px;
          display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 0.95rem;
          animation: qca-pulse-amber 2s infinite; margin-top: 16px;
        }

        /* ── BUTTONS ── */
        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 20px; height: 44px; border-radius: 12px;
          font-size: 14px; font-weight: 600; font-family: inherit;
          transition: all 0.3s ease; cursor: pointer; border: none;
        }
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
        }
        .qca-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.6);
        }
        .qca-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .qca-btn-micro { height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
        .qca-btn-outline { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.15); color: #fff; }
        .qca-btn-outline:hover { background: rgba(255,255,255,0.1); }
        .qca-btn-ghost { background: transparent; color: rgba(255,255,255,0.5); }
        .qca-btn-ghost:hover { color: #fff; background: rgba(255,255,255,0.05); }

        /* ── ROLE GRID ── */
        .qca-role-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.1s;
        }

        .qca-role-card {
          padding: 24px; display: flex; flex-direction: column;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, background 0.3s;
        }
        .qca-role-card:hover { transform: translateY(-4px); background: rgba(255, 255, 255, 0.04); }

        .qca-role-icon {
          width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #fff; margin-bottom: 16px;
        }
        .qca-role-card h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 4px; color: #fff; }
        .qca-role-card h2 { font-size: 2rem; font-weight: 800; margin: 0 0 4px; line-height: 1; }
        .qca-role-card p { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); margin: 0 0 20px; }

        .qca-role-actions { display: flex; gap: 8px; margin-top: auto; }

        /* ── PERMISSION MATRICES ── */
        .qca-group-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .qca-group-icon {
          width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 255, 255, 0.05);
          display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .qca-group-header h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 4px; color: #fff; }
        .qca-group-header p { font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); margin: 0; }

        .qca-table-wrapper { width: 100%; overflow-x: auto; }
        .qca-table { width: 100%; border-collapse: collapse; text-align: left; }
        
        .qca-table th {
          padding: 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qca-table th.text-center { text-align: center; }

        .qca-table td {
          padding: 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.8); font-weight: 500;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle;
        }
        .qca-table td.text-center { text-align: center; }
        
        .qca-table tbody tr { transition: background 0.2s; }
        .qca-table tbody tr:hover td { background: rgba(255, 255, 255, 0.02); }

        /* ── CUSTOM TOGGLE SWITCH ── */
        .qca-toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
        .qca-toggle input { opacity: 0; width: 0; height: 0; }
        
        .qca-toggle-slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
        }
        .qca-toggle-slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: rgba(255, 255, 255, 0.6); border-radius: 50%; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .qca-toggle input:checked + .qca-toggle-slider {
          background: linear-gradient(135deg, #7C3AED, #A855F7);
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.4);
        }
        .qca-toggle input:checked + .qca-toggle-slider:before {
          transform: translateX(20px); background-color: #fff;
        }
        
        .qca-toggle input:focus + .qca-toggle-slider {
          outline: 2px solid rgba(124, 58, 237, 0.5); outline-offset: 2px;
        }

        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center;
        }

        @media (max-width: 768px) {
          .qca-surface { padding: 24px; }
          .qca-header-row { flex-direction: column; gap: 16px; }
          .qca-btn { width: 100%; }
        }
      `}</style>

      <div className="qca-matrix-shell">
        
        {/* Main Header */}
        <section className="qca-surface" style={{ paddingBottom: hasChanges ? "24px" : "32px" }}>
          <div className={`qca-header-row ${!hasChanges ? "no-border" : ""}`} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
            <div>
              <span className="qca-eyebrow">RBAC MANAGEMENT</span>
              <h1 className="qca-title">Enterprise Permission Matrix</h1>
              <p className="qca-subtitle">Control access, security, and role permissions across the platform.</p>
            </div>
            <div>
              <button
                type="button"
                className="qca-btn qca-btn-primary"
                onClick={handleSave}
                disabled={loading || saving || !hasChanges}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {hasChanges && (
            <div className="qca-unsaved-banner">
              <span>⚠️ Unsaved changes detected in the permission matrix.</span>
            </div>
          )}
        </section>

        {/* Role Summary Cards */}
        <section className="qca-role-grid">
          {roleStats.map((item) => {
            const roleColor = getRoleColor(item.role);
            return (
              <div key={item.role} className="qca-role-card">
                <div className="qca-role-icon" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}80)` }}>
                  <FaShieldAlt />
                </div>
                <h3>{item.role}</h3>
                <h2 style={{ color: roleColor }}>{item.total}</h2>
                <p>Active Permissions</p>

                <div className="qca-role-actions">
                  <button
                    className="qca-btn qca-btn-micro qca-btn-outline"
                    onClick={() => setFullAccess(item.role)}
                    style={{ flex: 1 }}
                  >
                    Full Access
                  </button>
                  <button
                    className="qca-btn qca-btn-micro qca-btn-ghost"
                    onClick={() => clearAccess(item.role)}
                    style={{ flex: 1 }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Permission Groups */}
        {loading ? (
          <section className="qca-surface" style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
            Loading permissions...
          </section>
        ) : error ? (
          <section className="qca-alert-danger">{error}</section>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {permissionGroups.map((group, index) => (
              <section 
                key={group.title} 
                className="qca-surface" 
                style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
              >
                <div className="qca-group-header">
                  <div className="qca-group-icon">{group.icon}</div>
                  <div>
                    <h2>{group.title}</h2>
                    <p>Manage {group.title.toLowerCase()} access across roles.</p>
                  </div>
                </div>

                <div className="qca-table-wrapper">
                  <table className="qca-table">
                    <thead>
                      <tr>
                        <th>Permission Node</th>
                        {roles.map((role) => (
                          <th key={role} className="text-center">{role}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.permissions.map((permission) => (
                        <tr key={permission.key}>
                          <td>{permission.label}</td>
                          {roles.map((role) => (
                            <td key={`${role}-${permission.key}`} className="text-center">
                              <label className="qca-toggle">
                                <input
                                  type="checkbox"
                                  checked={rolePermissions[role]?.has(permission.key) || false}
                                  onChange={() => togglePermission(role, permission.key)}
                                />
                                <span className="qca-toggle-slider"></span>
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PermissionMatrix;