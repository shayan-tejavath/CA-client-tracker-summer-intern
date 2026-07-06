import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { getTaskReports } from "../../../services/reportService.js";
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

const normalizeTasks = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const TaskReports = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    priority: "All",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getTaskReports({
          search: filters.search.trim() || undefined,
          status: filters.status === "All" ? undefined : filters.status,
          priority: filters.priority === "All" ? undefined : filters.priority,
        });
        setRows(normalizeTasks(response));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load task reports.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters.search, filters.status, filters.priority]);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((row) => row.status === "Completed").length;
    const pending = rows.filter((row) => row.status === "Pending").length;
    const overdue = rows.filter((row) => row.status === "Overdue").length;
    return { total, completed, pending, overdue };
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
              <h1 className="reports-title">Task Reports</h1>
              <p className="reports-subtitle">
                Review tasks by client, service, employee, period, and due date.
              </p>
            </div>
            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              {stats.total} tasks loaded
            </div>
          </div>
        </section>

        <section className="reports-metrics-grid" aria-label="Task report summary">
          <article className="reports-metric-card">
            <div className="reports-metric-label">Total</div>
            <div className="reports-metric-value">{stats.total}</div>
            <div className="reports-metric-trend">All tasks in report</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Completed</div>
            <div className="reports-metric-value reports-metric-value--success">{stats.completed}</div>
            <div className="reports-metric-trend">Finished work</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Pending</div>
            <div className="reports-metric-value reports-metric-value--warning">{stats.pending}</div>
            <div className="reports-metric-trend">Needs action</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Overdue</div>
            <div className="reports-metric-value reports-metric-value--danger">{stats.overdue}</div>
            <div className="reports-metric-trend">Past due</div>
          </article>
        </section>

        <div className="reports-card" style={{ marginTop: 20 }}>
          <div className="reports-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="reports-card-title">Task Table</h2>
              <p className="reports-card-text">
                Task, period, date, client, target date, assigned employee, priority, and status.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search task / client / service"
                style={inputStyle}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading task report…</div>
          ) : error ? (
            <div style={emptyStyle}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>No tasks found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Task</th>
                    <th style={thStyle}>Period</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Client</th>
                    <th style={thStyle}>Target Date</th>
                    <th style={thStyle}>Assigned To</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((task) => (
                    <tr key={task._id || task.id}>
                      <td style={tdStyle}>{task.title || "—"}</td>
                      <td style={tdStyle}>{task.recurrence || "None"}</td>
                      <td style={tdStyle}>{formatDate(task.createdAt)}</td>
                      <td style={tdStyle}>{task.client?.clientName || "—"}</td>
                      <td style={tdStyle}>{formatDate(task.dueDate)}</td>
                      <td style={tdStyle}>{task.assignedTo?.name || "—"}</td>
                      <td style={tdStyle}>{task.priority || "—"}</td>
                      <td style={tdStyle}>{task.status || "—"}</td>
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

export default TaskReports;