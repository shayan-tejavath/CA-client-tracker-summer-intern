import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { getClientReports } from "../../../services/reportService.js";
import "../../../styles/Reports.css";

const REPORT_TABS = [
  { to: "/dashboard/reports", label: "Overview", end: true },
  { to: "/dashboard/reports/tasks", label: "Task Reports" },
  { to: "/dashboard/reports/services", label: "Service Reports" },
  { to: "/dashboard/reports/clients", label: "Client Reports" },
  { to: "/dashboard/reports/employees", label: "Employee Timelog" },
  { to: "/dashboard/reports/export", label: "Export Center" },
];

const navStyle = ({ isActive }) => ({
  padding: "10px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 600,
  border: `1px solid ${isActive ? "#2563EB" : "#CBD5E1"}`,
  background: isActive ? "#2563EB" : "#FFFFFF",
  color: isActive ? "#FFFFFF" : "#334155",
  boxShadow: isActive ? "0 8px 20px rgba(37, 99, 235, 0.16)" : "none",
});

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeClients = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.clients)) return payload.clients;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const ClientReports = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    clientType: "All",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getClientReports({
          search: filters.search.trim() || undefined,
          status: filters.status === "All" ? undefined : filters.status,
          clientType: filters.clientType === "All" ? undefined : filters.clientType,
        });
        setRows(normalizeClients(response));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load client reports.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters.search, filters.status, filters.clientType]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "Active").length;
    const archived = rows.filter((row) => row.status === "Archived").length;
    return { total, active, archived };
  }, [rows]);

  return (
    <DashboardLayout>
      <div className="reports-page">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: 20 }}>
          {REPORT_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} style={navStyle}>
              {tab.label}
            </NavLink>
          ))}
        </div>

        <section className="reports-hero">
          <div className="reports-hero-topline">Reports &amp; Analytics</div>
          <div className="reports-hero-row">
            <div>
              <h1 className="reports-title">Client Reports</h1>
              <p className="reports-subtitle">
                Track joined date, client type, assigned services, task load, and current status.
              </p>
            </div>
            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              {stats.total} clients
            </div>
          </div>
        </section>

        <section className="reports-metrics-grid" aria-label="Client report summary">
          <article className="reports-metric-card">
            <div className="reports-metric-label">Total</div>
            <div className="reports-metric-value">{stats.total}</div>
            <div className="reports-metric-trend">All client records</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Active</div>
            <div className="reports-metric-value reports-metric-value--success">{stats.active}</div>
            <div className="reports-metric-trend">Current clients</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Archived</div>
            <div className="reports-metric-value reports-metric-value--danger">{stats.archived}</div>
            <div className="reports-metric-trend">Soft-deleted clients</div>
          </article>
        </section>

        <div className="reports-card" style={{ marginTop: 20 }}>
          <div className="reports-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="reports-card-title">Client Table</h2>
              <p className="reports-card-text">
                Joined date, client type, services, tasks, and assigned manager.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search client"
                style={inputStyle}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
              <select
                value={filters.clientType}
                onChange={(e) => setFilters((prev) => ({ ...prev, clientType: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Partnership">Partnership</option>
                <option value="LLP">LLP</option>
                <option value="Private Limited">Private Limited</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading client report…</div>
          ) : error ? (
            <div style={emptyStyle}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>No clients found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Client</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Joined Date</th>
                    <th style={thStyle}>Assigned Services</th>
                    <th style={thStyle}>Manager</th>
                    <th style={thStyle}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((client) => (
                    <tr key={client._id || client.id}>
                      <td style={tdStyle}>{client.clientName || "—"}</td>
                      <td style={tdStyle}>{client.clientType || "—"}</td>
                      <td style={tdStyle}>{client.status || "—"}</td>
                      <td style={tdStyle}>{formatDate(client.createdAt)}</td>
                      <td style={tdStyle}>
                        {Array.isArray(client.assignedServices)
                          ? client.assignedServices.length
                          : 0}
                      </td>
                      <td style={tdStyle}>{client.assignedManager || "—"}</td>
                      <td style={tdStyle}>{client.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const inputStyle = {
  minWidth: 180,
  height: 42,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid #CBD5E1",
  background: "#fff",
  outline: "none",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 12px",
  background: "#F8FAFC",
  borderBottom: "1px solid #E2E8F0",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #E2E8F0",
  color: "#0F172A",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const emptyStyle = {
  padding: "24px 12px",
  color: "#64748B",
  fontSize: 14,
};

export default ClientReports;