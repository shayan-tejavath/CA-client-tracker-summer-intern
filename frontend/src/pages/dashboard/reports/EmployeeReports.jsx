import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { getEmployeeReports } from "../../../services/reportService.js";
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

const normalizeEmployees = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const EmployeeReports = () => {
  const [filters, setFilters] = useState({
    search: "",
    role: "All",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeReports({
          search: filters.search.trim() || undefined,
          role: filters.role === "All" ? undefined : filters.role,
        });
        setRows(normalizeEmployees(response));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load employee reports.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters.search, filters.role]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.isActive !== false).length;
    return { total, active };
  }, [rows]);

  const completionRate = (employee) => {
    const assigned = Number(employee.assignedTasks || 0);
    const completed = Number(employee.completedTasks || 0);
    if (!assigned) return 0;
    return Math.round((completed / assigned) * 100);
  };

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
              <h1 className="reports-title">Employee Timelog</h1>
              <p className="reports-subtitle">
                Track employee workload, task assignment, completion, pending work, and overdue tasks.
              </p>
            </div>
            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              {stats.active} active employees
            </div>
          </div>
        </section>

        <section className="reports-metrics-grid" aria-label="Employee report summary">
          <article className="reports-metric-card">
            <div className="reports-metric-label">Employees</div>
            <div className="reports-metric-value">{stats.total}</div>
            <div className="reports-metric-trend">Loaded in report</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Active</div>
            <div className="reports-metric-value reports-metric-value--success">{stats.active}</div>
            <div className="reports-metric-trend">Currently active</div>
          </article>
        </section>

        <div className="reports-card" style={{ marginTop: 20 }}>
          <div className="reports-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="reports-card-title">Employee Table</h2>
              <p className="reports-card-text">
                Employee, assigned tasks, completed tasks, pending tasks, overdue tasks, and completion rate.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search employee"
                style={inputStyle}
              />
              <select
                value={filters.role}
                onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Roles</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Partner">Partner</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading employee report…</div>
          ) : error ? (
            <div style={emptyStyle}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>No employees found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Assigned</th>
                    <th style={thStyle}>Completed</th>
                    <th style={thStyle}>Pending</th>
                    <th style={thStyle}>Overdue</th>
                    <th style={thStyle}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((employee) => (
                    <tr key={employee._id || employee.id}>
                      <td style={tdStyle}>{employee.name || "—"}</td>
                      <td style={tdStyle}>{employee.role || "—"}</td>
                      <td style={tdStyle}>{Number(employee.assignedTasks || 0)}</td>
                      <td style={tdStyle}>{Number(employee.completedTasks || 0)}</td>
                      <td style={tdStyle}>{Number(employee.pendingTasks || 0)}</td>
                      <td style={tdStyle}>{Number(employee.overdueTasks || 0)}</td>
                      <td style={tdStyle}>{completionRate(employee)}%</td>
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

export default EmployeeReports;