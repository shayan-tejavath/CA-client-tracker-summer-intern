import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import EditUserModal from "../../components/EditUserModal.jsx";
import { getAdminOverview, getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../../services/adminService.js";

const roles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

// Added a pure visual helper to map roles to our premium color palette
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

const AdminPanel = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", role: "Partner", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewData, userData] = await Promise.all([getAdminOverview(), getAdminUsers()]);
      setOverview(overviewData);
      setUsers(userData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createAdminUser(form);
      toast.success("User created successfully.");
      setForm({ name: "", email: "", role: "Partner", password: "" });
      await loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteAdminUser(id);
      toast.success("User deleted.");
      await loadAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user.");
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleEditSave = async (userId, updateData) => {
    try {
      await updateAdminUser(userId, updateData);
      await loadAdminData();
      setEditModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const roleCounts = useMemo(() => overview?.roleCounts || {}, [overview]);
  const overviewCards = overview
    ? [
        { label: "Total Users", value: overview.totalUsers },
        { label: "Total Clients", value: overview.totalClients },
        { label: "Total Tasks", value: overview.totalTasks },
        { label: "Documents", value: overview.totalDocuments },
      ]
    : [];

  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ ANIMATIONS & BASE ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-admin-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── GLASS SURFACES ── */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── HEADERS ── */
        .qca-header-block {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 24px;
        }
        .qca-header-block.no-border { border-bottom: none; padding-bottom: 0; }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #A855F7; text-transform: uppercase;
          background: rgba(168, 85, 247, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .qca-title { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
        .qca-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── METRICS GRID ── */
        .qca-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.1s;
        }

        .qca-metric-card {
          padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, background 0.3s, border-color 0.3s;
        }
        .qca-metric-card:hover {
          transform: translateY(-4px); background: rgba(255, 255, 255, 0.04);
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        .qca-metric-card p { font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin-bottom: 8px; }
        .qca-metric-card h2 { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0; line-height: 1; }

        /* ── SPLIT DASHBOARD LAYOUT ── */
        .qca-split-grid {
          display: grid; grid-template-columns: 3fr 2fr; gap: 24px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.2s;
        }

        /* ── ROLE DISTRIBUTION BARS ── */
        .qca-status-bars { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
        .qca-status-bar-row { display: flex; flex-direction: column; gap: 8px; }
        .qca-status-bar-title { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
        .qca-status-bar-title span { color: rgba(255, 255, 255, 0.7); font-weight: 600; }
        .qca-status-bar-title strong { color: #fff; font-weight: 800; }
        
        .qca-status-bar-track {
          width: 100%; height: 8px; background: rgba(255, 255, 255, 0.05);
          border-radius: 100px; overflow: hidden; position: relative;
        }
        .qca-status-bar-fill {
          height: 100%; border-radius: 100px;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .qca-status-bar-fill::after {
          content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
        }

        /* ── INFO LIST ── */
        .qca-info-list { margin: 20px 0 0; padding-left: 20px; color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; line-height: 1.8; }
        .qca-info-list li::marker { color: #7C3AED; }

        /* ── DATA TABLE ── */
        .qca-table-wrapper { width: 100%; overflow-x: auto; margin-top: 16px; }
        .qca-table { width: 100%; border-collapse: collapse; text-align: left; }
        .qca-table th {
          padding: 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qca-table td {
          padding: 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle;
        }
        .qca-table tbody tr { transition: background 0.2s; }
        .qca-table tbody tr:hover td { background: rgba(255, 255, 255, 0.03); }

        .qca-role-badge {
          display: inline-flex; align-items: center; padding: 4px 10px;
          border-radius: 6px; font-size: 0.75rem; font-weight: 700;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .qca-table-actions { display: flex; gap: 8px; }

        /* ── BUTTONS ── */
        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 16px; height: 36px; border-radius: 8px;
          font-size: 13px; font-weight: 600; font-family: inherit;
          transition: all 0.2s; cursor: pointer; border: none; white-space: nowrap;
        }
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3); height: 44px; font-size: 14px;
        }
        .qca-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 4px 16px rgba(124, 58, 237, 0.5);
        }
        .qca-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .qca-btn-outline {
          background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.8);
        }
        .qca-btn-outline:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
        
        .qca-btn-danger {
          background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5;
        }
        .qca-btn-danger:hover {
          background: rgba(239, 68, 68, 0.1); border-color: #EF4444; color: #fff;
        }

        /* ── FORM ── */
        .qca-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;
        }
        .qca-form-field { display: flex; flex-direction: column; gap: 8px; }
        .qca-form-field label { font-size: 0.85rem; font-weight: 600; color: rgba(255, 255, 255, 0.7); }
        .qca-form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 8px; }

        .qca-input, .qca-select {
          width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff; padding: 12px 16px; border-radius: 12px; font-size: 0.95rem; font-family: inherit; transition: all 0.2s;
        }
        .qca-select {
          appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; padding-right: 40px;
        }
        .qca-select option { background: #120a23; color: #fff; }
        
        .qca-input:hover, .qca-select:hover { border-color: rgba(255, 255, 255, 0.2); }
        .qca-input:focus, .qca-select:focus {
          border-color: #7C3AED; outline: none; background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }

        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center; font-weight: 500;
        }

        @media (max-width: 768px) {
          .qca-split-grid { grid-template-columns: 1fr; }
          .qca-form-grid { grid-template-columns: 1fr; }
          .qca-surface { padding: 20px; }
        }
      `}</style>

      <div className="qca-admin-shell">
        {/* Page Header */}
        <div className="qca-header-block no-border">
          <span className="qca-eyebrow">SuperAdmin</span>
          <h1 className="qca-title">System administration</h1>
          <p className="qca-subtitle">Manage system users, see role counts, and review key practice metrics.</p>
        </div>

        {loading ? (
          <div className="qca-surface" style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
            <p>Loading admin data…</p>
          </div>
        ) : error ? (
          <div className="qca-alert-danger">{error}</div>
        ) : (
          <>
            {/* Top Metrics */}
            <section className="qca-metrics-grid">
              {overviewCards.map((card, idx) => (
                <article key={card.label} className="qca-metric-card" style={{ animationDelay: `${0.1 + (idx * 0.05)}s` }}>
                  <p>{card.label}</p>
                  <h2>{card.value}</h2>
                </article>
              ))}
            </section>

            {/* Split Grid: Role Dist & Quick Actions */}
            <section className="qca-split-grid">
              <article className="qca-surface">
                <div className="qca-header-block no-border" style={{ marginBottom: "0" }}>
                  <span className="qca-eyebrow">Role distribution</span>
                  <h2 className="qca-title" style={{ fontSize: "1.4rem" }}>Active users by role</h2>
                </div>
                <div className="qca-status-bars">
                  {roles.map((role) => {
                    const color = getRoleColor(role);
                    const count = roleCounts[role] || 0;
                    const percent = Math.min((count / Math.max(overview.totalUsers, 1)) * 100, 100);
                    return (
                      <div key={role} className="qca-status-bar-row">
                        <div className="qca-status-bar-title">
                          <span>{role}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className="qca-status-bar-track">
                          <div
                            className="qca-status-bar-fill"
                            style={{ 
                              width: `${percent}%`, 
                              background: color,
                              boxShadow: `0 0 10px ${color}80` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="qca-surface">
                <div className="qca-header-block no-border" style={{ marginBottom: "0" }}>
                  <span className="qca-eyebrow">Quick actions</span>
                  <h2 className="qca-title" style={{ fontSize: "1.4rem" }}>SuperAdmin tools</h2>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                    Use this section to add users and manage the practice access model.
                  </p>
                  <ul className="qca-info-list">
                    <li>Create new team members and assign roles.</li>
                    <li>Delete stale service accounts.</li>
                    <li>Review active user counts and system usage.</li>
                  </ul>
                </div>
              </article>
            </section>

            {/* User Management Table */}
            <section className="qca-surface" style={{ animationDelay: "0.3s" }}>
              <div className="qca-header-block">
                <span className="qca-eyebrow">User management</span>
                <h2 className="qca-title" style={{ fontSize: "1.6rem" }}>Team members</h2>
                <p className="qca-subtitle">Review and manage SuperAdmin, Partner, Manager, Employee, and Client accounts.</p>
              </div>

              <div className="qca-table-wrapper">
                <table className="qca-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const badgeColor = getRoleColor(user.role);
                      return (
                        <tr key={user._id}>
                          <td><strong style={{ color: "#fff" }}>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <span className="qca-role-badge" style={{ borderColor: `${badgeColor}50`, color: badgeColor }}>
                              {user.role}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="qca-table-actions" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="qca-btn qca-btn-outline"
                                onClick={() => handleEditClick(user)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="qca-btn qca-btn-danger"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Add User Form */}
            <section className="qca-surface" style={{ animationDelay: "0.4s" }}>
              <div className="qca-header-block">
                <span className="qca-eyebrow">Add new user</span>
                <h2 className="qca-title" style={{ fontSize: "1.6rem" }}>Create account</h2>
                <p className="qca-subtitle">Invite a new member by creating a system account with a role.</p>
              </div>

              <form onSubmit={handleCreateUser} className="qca-form-grid">
                <div className="qca-form-field">
                  <label htmlFor="name">Name</label>
                  <input className="qca-input" id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Full Name" />
                </div>
                <div className="qca-form-field">
                  <label htmlFor="email">Email</label>
                  <input className="qca-input" id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="user@domain.com" />
                </div>
                <div className="qca-form-field">
                  <label htmlFor="role">Role</label>
                  <select className="qca-select" id="role" name="role" value={form.role} onChange={handleChange}>
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="qca-form-field">
                  <label htmlFor="password">Password</label>
                  <input className="qca-input" id="password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Secure password" />
                </div>
                <div className="qca-form-actions">
                  <button type="submit" className="qca-btn qca-btn-primary" disabled={submitting}>
                    {submitting ? "Creating..." : "Create user"}
                  </button>
                </div>
              </form>
            </section>

            <EditUserModal
              user={selectedUser}
              isOpen={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              onSave={handleEditSave}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;