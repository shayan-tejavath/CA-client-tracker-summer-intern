import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { getServiceReports } from "../../../services/reportService.js";
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

const normalizeServices = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.services)) return payload.services;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const ServiceReports = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getServiceReports({
          search: filters.search.trim() || undefined,
          category: filters.category === "All" ? undefined : filters.category,
        });
        setRows(normalizeServices(response));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load service reports.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters.search, filters.category]);

  const stats = useMemo(() => {
    const total = rows.length;
    const categories = new Set(rows.map((row) => row.serviceCategory).filter(Boolean));
    return { total, categories: categories.size };
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
              <h1 className="reports-title">Service Reports</h1>
              <p className="reports-subtitle">
                Review service categories, sub-services, frequency, and linked work.
              </p>
            </div>
            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              {stats.total} services
            </div>
          </div>
        </section>

        <section className="reports-metrics-grid" aria-label="Service report summary">
          <article className="reports-metric-card">
            <div className="reports-metric-label">Services</div>
            <div className="reports-metric-value">{stats.total}</div>
            <div className="reports-metric-trend">Total service rows</div>
          </article>
          <article className="reports-metric-card">
            <div className="reports-metric-label">Categories</div>
            <div className="reports-metric-value reports-metric-value--info">{stats.categories}</div>
            <div className="reports-metric-trend">Unique service groups</div>
          </article>
        </section>

        <div className="reports-card" style={{ marginTop: 20 }}>
          <div className="reports-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="reports-card-title">Service Table</h2>
              <p className="reports-card-text">
                Service category, sub-service, frequency, description, and usage summary.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search service"
                style={inputStyle}
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                style={inputStyle}
              >
                <option value="All">All Categories</option>
                <option value="GST">GST</option>
                <option value="Income Tax">Income Tax</option>
                <option value="TDS">TDS</option>
                <option value="ROC">ROC</option>
                <option value="Audit">Audit</option>
                <option value="Payroll">Payroll</option>
                <option value="PF & ESI">PF & ESI</option>
                <option value="Registration">Registration</option>
                <option value="Certification">Certification</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading service report…</div>
          ) : error ? (
            <div style={emptyStyle}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>No services found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Service</th>
                    <th style={thStyle}>Frequency</th>
                    <th style={thStyle}>Clients</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((service) => (
                    <tr key={service._id || service.id}>
                      <td style={tdStyle}>{service.serviceCategory || "—"}</td>
                      <td style={tdStyle}>{service.subService || "—"}</td>
                      <td style={tdStyle}>{service.frequency || "—"}</td>
                      <td style={tdStyle}>
                        {Number.isFinite(Number(service.clientCount))
                          ? Number(service.clientCount)
                          : 0}
                      </td>
                      <td style={tdStyle}>{formatDate(service.createdAt)}</td>
                      <td style={tdStyle}>{service.description || "—"}</td>
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

export default ServiceReports;