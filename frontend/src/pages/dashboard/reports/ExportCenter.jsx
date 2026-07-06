import { useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { exportReport } from "../../../services/reportService.js";
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

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const ExportCenter = () => {
  const [reportType, setReportType] = useState("tasks");
  const [format, setFormat] = useState("xlsx");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage("");

      const blob = await exportReport({
        type: reportType,
        format,
      });

      const extension = format === "csv" ? "csv" : "xlsx";
      downloadBlob(blob, `${reportType}-report.${extension}`);

      setMessage("Export downloaded successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Export failed.");
    } finally {
      setLoading(false);
    }
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
              <h1 className="reports-title">Export Center</h1>
              <p className="reports-subtitle">
                Download task, service, client, and employee reports in Excel or CSV format.
              </p>
            </div>
            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              Download reports
            </div>
          </div>
        </section>

        <div className="reports-card" style={{ marginTop: 20 }}>
          <div className="reports-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="reports-card-title">Create Export</h2>
              <p className="reports-card-text">
                Choose the report section and file format.
              </p>
            </div>
          </div>

          <div style={gridStyle}>
            <label style={labelStyle}>
              Report Type
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={inputStyle}
              >
                <option value="tasks">Task Reports</option>
                <option value="services">Service Reports</option>
                <option value="clients">Client Reports</option>
                <option value="employees">Employee Timelog</option>
              </select>
            </label>

            <label style={labelStyle}>
              Format
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={inputStyle}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </label>

            <button type="button" onClick={handleExport} style={buttonStyle} disabled={loading}>
              {loading ? "Exporting..." : "Export Now"}
            </button>
          </div>

          {message ? <div style={messageStyle}>{message}</div> : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 20,
  alignItems: "end",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "#0F172A",
};

const inputStyle = {
  height: 42,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid #CBD5E1",
  background: "#fff",
  outline: "none",
};

const buttonStyle = {
  height: 42,
  border: "none",
  borderRadius: 12,
  background: "#2563EB",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 18px",
  alignSelf: "end",
};

const messageStyle = {
  marginTop: 16,
  color: "#334155",
  fontSize: 14,
};

export default ExportCenter;