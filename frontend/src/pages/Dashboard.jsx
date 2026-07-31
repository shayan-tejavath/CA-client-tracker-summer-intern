import { useEffect, useMemo, useState } from "react";

import {
  FaUsers,
  FaUserFriends,
  FaTasks,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaDollarSign,
  FaBriefcase,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import { getDashboardSummary } from "../services/dashboardService.js";

const metricCards = [
  {
    label: "Total Clients",
    icon: FaUsers,
    color: "#2563EB",
  },
  {
    label: "Total Employees",
    icon: FaUserFriends,
    color: "#0891B2",
  },
  {
    label: "Pending Tasks",
    icon: FaClock,
    color: "#D97706",
  },
  {
    label: "Active Services",
    icon: FaBriefcase,
    color: "#7C3AED",
  },
  {
    label: "Revenue",
    icon: FaDollarSign,
    color: "#16A34A",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const stats = summary
    ? [
        { label: "Total Clients", value: summary.totalClients },
        { label: "Total Employees", value: summary.totalEmployees },
        { label: "Pending Tasks", value: summary.pendingTasks },
        { label: "Active Services", value: summary.activeServices },
        { label: "Revenue", value: summary.revenueDisplay || "Not available" },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="page-content">
        <section className="page-header">
          <div>
            <span className="eyebrow">Dashboard Overview</span>
            <h1>Monitor growth &amp; activity</h1>
            <p>
              Real-time analytics for clients, tasks, documents, and team productivity.
            </p>
          </div>

          <div className="page-tools">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("/dashboard/documents/upload")}
            >
              Upload Document
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/dashboard/clients")}
            >
              + Add Client
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/dashboard/tasks")}
            >
              + Create Task
            </button>
          </div>
        </section>

        {loading ? (
          <div className="page-card shimmer-wrapper">
            <FaClock className="shimmer-icon" size={28} />
            <p>Loading dashboard intelligence...</p>
          </div>
        ) : error ? (
          <div className="alert danger">
            <FaExclamationTriangle className="alert-icon" size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <section className="grid grid-3">
              {metricCards.map((card) => {
                const Icon = card.icon;
                const stat = stats.find((item) => item.label === card.label);

                return (
                  <article key={card.label} className="metric-card">
                    <div className="metric-header">
                      <div className="metric-icon-wrapper">
                        <Icon size={22} style={{ color: card.color }} />
                      </div>
                      <span className="badge badge-outline">Live</span>
                    </div>

                    <div>
                      <div className="metric-value">{stat?.value ?? 0}</div>
                      <div className="metric-title">{card.label}</div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="page-card">
              <div className="card-header">
                <div className="card-title">Company Snapshot</div>
                <div className="card-description">
                  Current company-only numbers for clients, employees, tasks, services, and revenue.
                </div>
              </div>

              <div className="grid" style={{ marginBottom: 0 }}>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-title">Clients</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    {summary.totalClients}
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-title">Employees</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    {summary.totalEmployees}
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-title">Pending Tasks</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    {summary.pendingTasks}
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-title">Active Services</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    {summary.activeServices}
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-title">Revenue</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    {summary.revenueDisplay || "Not available"}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
