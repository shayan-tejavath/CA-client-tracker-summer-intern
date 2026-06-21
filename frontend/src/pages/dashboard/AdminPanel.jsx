import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Edit3, Trash2, Users, FileText } from "lucide-react";

import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card.jsx";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table.jsx";
import { Badge } from "../../components/ui/badge.jsx";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import EditUserModal from "../../components/EditUserModal.jsx";
import {
  getAdminOverview,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../../services/adminService.js";

import "../../styles/adminpanel.css";

const roles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const getRoleMeta = (role) => {
  const map = {
    SuperAdmin: { color: "#2563EB", label: "SuperAdmin" },
    Partner: { color: "#0EA5E9", label: "Partner" },
    Manager: { color: "#16A34A", label: "Manager" },
    Employee: { color: "#64748B", label: "Employee" },
    Client: { color: "#D97706", label: "Client" },
  };

  return map[role] || { color: "#2563EB", label: role || "Unknown" };
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const AdminPanel = () => {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Partner",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewData, userData] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(),
      ]);
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

  const handleRoleChange = (event) => {
    setForm((prev) => ({ ...prev, role: event.target.value }));
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

  const overviewCards = useMemo(
    () =>
      overview
        ? [
            { label: "Total Users", value: overview.totalUsers ?? 0, icon: Users },
            { label: "Total Clients", value: overview.totalClients ?? 0, icon: Users },
            { label: "Total Tasks", value: overview.totalTasks ?? 0, icon: FileText },
            { label: "Documents", value: overview.totalDocuments ?? 0, icon: FileText },
          ]
        : [],
    [overview]
  );

  const roleDistribution = useMemo(
    () =>
      roles.map((role) => {
        const meta = getRoleMeta(role);
        const count = roleCounts[role] || 0;
        const totalUsers = overview?.totalUsers || 0;
        const percent = totalUsers > 0 ? Math.min((count / totalUsers) * 100, 100) : 0;

        return {
          role,
          count,
          percent,
          color: meta.color,
        };
      }),
    [overview?.totalUsers, roleCounts]
  );

  return (
    <DashboardLayout>
      <div className="admin-panel-page">
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <div className="admin-eyebrow">SuperAdmin Console</div>
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-subtitle">
              Manage practice users, monitor role distribution, and maintain system access with a clean enterprise workflow.
            </p>
          </div>

          <div className="admin-hero-chip">
            <span className="admin-hero-chip-dot" />
            System overview
          </div>
        </section>

        {loading ? (
          <Card className="admin-card">
            <CardContent className="admin-loading">
              <div className="admin-loading-title">Loading admin data…</div>
              <div className="admin-loading-text">Fetching users and overview metrics.</div>
              <div className="admin-loading-grid">
                <div className="admin-skeleton-card" />
                <div className="admin-skeleton-card" />
                <div className="admin-skeleton-card" />
                <div className="admin-skeleton-card" />
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="admin-card">
            <CardContent>
              <div className="admin-error" role="alert">
                {error}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="admin-metrics-grid" aria-label="Admin overview metrics">
              {overviewCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="admin-metric-card">
                    <CardContent className="admin-metric-content">
                      <div className="admin-metric-top">
                        <div className="admin-metric-icon">
                          <Icon size={18} strokeWidth={2.2} />
                        </div>
                        <Badge variant="secondary" className="admin-metric-badge">
                          Live
                        </Badge>
                      </div>
                      <div className="admin-metric-label">{card.label}</div>
                      <div className="admin-metric-value">{card.value}</div>
                      <div className="admin-metric-note">Updated from current admin dataset</div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="admin-split-grid">
              <Card className="admin-card admin-card--soft">
                <CardHeader className="admin-card-header">
                  <div>
                    <CardTitle className="admin-card-title">Role distribution</CardTitle>
                    <CardDescription className="admin-card-description">
                      Active users grouped by system role.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="admin-role-list">
                    {roleDistribution.map((item) => (
                      <div key={item.role} className="admin-role-row">
                        <div className="admin-role-head">
                          <span className="admin-role-name">{item.role}</span>
                          <span className="admin-role-count">{item.count}</span>
                        </div>
                        <div className="admin-role-track">
                          <div
                            className="admin-role-fill"
                            style={{
                              width: `${item.percent}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="admin-card admin-card--soft">
                <CardHeader className="admin-card-header">
                  <div>
                    <CardTitle className="admin-card-title">Quick actions</CardTitle>
                    <CardDescription className="admin-card-description">
                      Common admin operations available on this screen.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="admin-quick-list">
                    <li>Create new system users.</li>
                    <li>Edit existing user role and profile details.</li>
                    <li>Delete inactive or unnecessary accounts.</li>
                    <li>Review client, task, and document totals.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <Card className="admin-card admin-card--table">
              <CardHeader className="admin-card-header admin-card-header--team">
                <div className="admin-section-heading">
                  <div className="admin-eyebrow admin-eyebrow--section">User management</div>
                  <CardTitle className="admin-card-title admin-card-title--large">
                    Team Members
                  </CardTitle>
                  <CardDescription className="admin-card-description">
                    Review and manage all users in the platform.
                  </CardDescription>
                </div>

                <div className="admin-section-meta">
                  <Badge variant="secondary" className="admin-count-badge">
                    {users.length} users
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="admin-table-shell">
                  <Table className="admin-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="admin-table-actions-head">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {users.length > 0 ? (
                        users.map((user) => {
                          const meta = getRoleMeta(user.role);

                          return (
                            <TableRow key={user._id} className="admin-table-row">
                              <TableCell className="admin-user-name-cell">
                                <div className="admin-user-name">{user.name}</div>
                              </TableCell>
                              <TableCell className="admin-email-cell">{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="admin-role-badge"
                                  style={{
                                    borderColor: `${meta.color}33`,
                                    color: meta.color,
                                    backgroundColor: `${meta.color}0F`,
                                  }}
                                >
                                  {meta.label}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="admin-table-actions-cell">
                                <div className="admin-row-actions">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="admin-btn admin-btn-outline"
                                    onClick={() => handleEditClick(user)}
                                  >
                                    <Edit3 size={16} />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    className="admin-btn admin-btn-danger"
                                    onClick={() => handleDeleteUser(user._id)}
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="admin-empty-state">No users found.</div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="admin-card admin-card--form">
              <CardHeader className="admin-card-header">
                <div>
                  <CardTitle className="admin-card-title">Create account</CardTitle>
                  <CardDescription className="admin-card-description">
                    Add a new user and assign a role.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreateUser} className="admin-form-grid">
                  <div className="admin-field">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Full name"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-field">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="user@domain.com"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-field">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={handleRoleChange}
                      className="admin-select"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Secure password"
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-form-actions">
                    <Button
                      type="submit"
                      className="admin-btn admin-btn-primary"
                      disabled={submitting}
                    >
                      <Plus size={16} />
                      {submitting ? "Creating..." : "Create user"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

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