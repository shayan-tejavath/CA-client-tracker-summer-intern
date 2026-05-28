import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import EditUserModal from "../../components/EditUserModal.jsx";
import { getAdminOverview, getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../../services/adminService.js";

const roles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

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
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">SuperAdmin</p>
            <h1>System administration</h1>
            <p>Manage system users, see role counts, and review key practice metrics.</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="page-card">
          <p>Loading admin data…</p>
        </div>
      ) : error ? (
        <div className="page-card alert danger">{error}</div>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            {overviewCards.map((card) => (
              <article key={card.label} className="overview-card">
                <p className="overview-card-label">{card.label}</p>
                <h2>{card.value}</h2>
              </article>
            ))}
          </section>

          <section className="dashboard-chart-grid">
            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">Role distribution</p>
                  <h2>Active users by role</h2>
                </div>
              </div>
              <div className="status-bars">
                {roles.map((role) => (
                  <div key={role} className="status-bar-row">
                    <div className="status-bar-title">
                      <span>{role}</span>
                      <strong>{roleCounts[role] || 0}</strong>
                    </div>
                    <div className="status-bar-track">
                      <div
                        className="status-bar-fill"
                        style={{ width: `${Math.min(((roleCounts[role] || 0) / Math.max(overview.totalUsers, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">Quick actions</p>
                  <h2>SuperAdmin tools</h2>
                </div>
              </div>
              <div className="page-card">
                <p>Use this section to add users and manage the practice access model.</p>
                <ul>
                  <li>Create new team members and assign roles.</li>
                  <li>Delete stale service accounts.</li>
                  <li>Review active user counts and system usage.</li>
                </ul>
              </div>
            </article>
          </section>

          <section className="page-card">
            <div className="page-header">
              <div>
                <p className="eyebrow">User management</p>
                <h2>Team members</h2>
                <p>Review and manage SuperAdmin, Partner, Manager, Employee, and Client accounts.</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => handleEditClick(user)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="page-card">
            <div className="page-header">
              <div>
                <p className="eyebrow">Add new user</p>
                <h2>Create account</h2>
                <p>Invite a new member by creating a system account with a role.</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label htmlFor="role">Role</label>
                <select id="role" name="role" value={form.role} onChange={handleChange}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={submitting}>
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
    </DashboardLayout>
  );
};

export default AdminPanel;
