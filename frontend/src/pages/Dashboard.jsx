import { useEffect, useMemo, useState } from "react";

import {
  FaUsers,
  FaUserFriends,
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout.jsx";

import { getDashboardSummary } from "../services/dashboardService.js";

const statusColors = {
  Completed: "#16A34A",
  Pending: "#D97706",
  Overdue: "#DC2626",
};

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
    label: "Total Tasks",
    icon: FaTasks,
    color: "#4F46E5",
  },
  {
    label: "Completed Tasks",
    icon: FaCheckCircle,
    color: "#16A34A",
  },
  {
    label: "Pending Tasks",
    icon: FaClock,
    color: "#D97706",
  },
  {
    label: "Overdue Tasks",
    icon: FaExclamationTriangle,
    color: "#DC2626",
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

  const statusMetrics = useMemo(() => {
    if (!summary) return [];

    return [
      {
        label: "Completed",
        value: summary.completedTasks,
        color: statusColors.Completed,
      },
      {
        label: "Pending",
        value: summary.pendingTasks,
        color: statusColors.Pending,
      },
      {
        label: "Overdue",
        value: summary.overdueTasks,
        color: statusColors.Overdue,
      },
    ];
  }, [summary]);

  const statusTotal =
    statusMetrics.reduce((sum, metric) => sum + metric.value, 0) || 1;

  const donutSegments = useMemo(() => {
    const circumference = 2 * Math.PI * 70;
    let offset = 0;

    return statusMetrics.map((metric) => {
      const percent = metric.value / statusTotal;
      const dash = percent * circumference;
      const segment = {
        ...metric,
        percent: Math.round(percent * 100),
        dash,
        offset,
      };
      offset -= dash;
      return segment;
    });
  }, [statusMetrics, statusTotal]);

  const recentActivities = useMemo(() => {
    if (!summary?.recentActivities) return [];

    return summary.recentActivities.map((activity) => ({
      ...activity,
      formattedDate: new Date(activity.date).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  }, [summary]);

  const monthlyTrendValues = useMemo(() => {
    const months = summary?.monthlyTaskTrend || [];
    const values = months.map((item) => item.total || 0);
    const maxValue = Math.max(...values, 1);

    const width = 620;
    const height = 240;
    const padding = 24;

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const points = months.map((item, index) => {
      const x =
        padding +
        (innerWidth * index) / Math.max(months.length - 1, 1);
      const y =
        padding +
        innerHeight -
        (innerHeight * (item.total || 0)) / maxValue;

      return `${x},${y}`;
    });

    return {
      months,
      points,
      width,
      height,
      padding,
    };
  }, [summary]);

  const stats = summary
    ? [
        { label: "Total Clients", value: summary.totalClients },
        { label: "Total Employees", value: summary.totalEmployees },
        { label: "Total Tasks", value: summary.totalTasks },
        { label: "Completed Tasks", value: summary.completedTasks },
        { label: "Pending Tasks", value: summary.pendingTasks },
        { label: "Overdue Tasks", value: summary.overdueTasks },
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

            <section className="grid grid-3">
              <article className="page-card">
                <div className="card-header">
                  <div className="card-title">Task Activity</div>
                  <div className="card-description">
                    Tasks created in the last 6 months
                  </div>
                </div>

                <div className="chart-container">
                  {monthlyTrendValues.months.length === 0 ? (
                    <div className="shimmer-wrapper" style={{ padding: "24px 0" }}>
                      <p>No chart data available.</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        viewBox={`0 0 ${monthlyTrendValues.width} ${monthlyTrendValues.height}`}
                        className="line-chart-svg"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Monthly task trend chart"
                      >
                        <defs>
                          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="50%" stopColor="#1D4ED8" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                        </defs>

                        <polygon
                          fill="url(#areaGlow)"
                          points={`${monthlyTrendValues.points.join(" ")} ${
                            monthlyTrendValues.width - monthlyTrendValues.padding
                          },${monthlyTrendValues.height - monthlyTrendValues.padding} ${
                            monthlyTrendValues.padding
                          },${monthlyTrendValues.height - monthlyTrendValues.padding}`}
                        />

                        <polyline
                          fill="none"
                          stroke="url(#lineGlow)"
                          strokeWidth="5"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points={monthlyTrendValues.points.join(" ")}
                        />
                      </svg>

                      <div className="chart-x-axis">
                        {monthlyTrendValues.months.map((month) => (
                          <span key={month.month}>{month.month}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </article>

              <article className="page-card">
                <div className="card-header">
                  <div className="card-title">Task Breakdown</div>
                  <div className="card-description">
                    Status overview distribution
                  </div>
                </div>

                <div className="donut-wrapper">
                  <svg viewBox="0 0 220 220" className="donut-svg" role="img" aria-label="Task breakdown chart">
                    <circle
                      cx="110"
                      cy="110"
                      r="70"
                      fill="transparent"
                      stroke="var(--border)"
                      strokeWidth="26"
                    />
                    {donutSegments.map((segment) => (
                      <circle
                        key={segment.label}
                        className="donut-segment"
                        cx="110"
                        cy="110"
                        r="70"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="26"
                        strokeDasharray={`${segment.dash} ${2 * Math.PI * 70 - segment.dash}`}
                        strokeDashoffset={segment.offset}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>

                  <div className="donut-center">
                    <strong>{summary.totalTasks}</strong>
                    <span>Total Tasks</span>
                  </div>
                </div>

                <div className="legend-list">
                  {donutSegments.map((metric) => (
                    <div key={metric.label} className="legend-item">
                      <div className="legend-title" style={{ color: metric.color }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                          <circle cx="5" cy="5" r="5" fill={metric.color} />
                        </svg>
                        {metric.label}
                      </div>
                      <span className="legend-value">
                        {metric.percent}% ({metric.value})
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="page-card">
                <div className="card-header">
                  <div className="card-title">Quick Overview</div>
                  <div className="card-description">Core numbers at a glance</div>
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
                    <div className="metric-title">Tasks</div>
                    <div className="metric-value" style={{ fontSize: "24px" }}>
                      {summary.totalTasks}
                    </div>
                  </div>
                  <div className="metric-card" style={{ padding: "16px" }}>
                    <div className="metric-title">Docs</div>
                    <div className="metric-value" style={{ fontSize: "24px" }}>
                      {summary.recentActivities?.length || 0}
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="page-card">
              <div className="card-header">
                <div className="card-title">Recent Activities</div>
                <div className="card-description">
                  Latest system events and timeline updates
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="shimmer-wrapper" style={{ padding: "24px 0" }}>
                  <p>No recent activity available.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Subject</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.map((activity, index) => (
                        <tr key={`${activity.type}-${activity.title}-${index}`}>
                          <td>
                            <span className="cell-main">{activity.action}</span>
                            <span className="cell-sub">{activity.title}</span>
                          </td>
                          <td>{activity.subject || "—"}</td>
                          <td>{activity.actor || "—"}</td>
                          <td>
                            <span className="badge badge-outline" style={{ gap: "8px" }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                                <circle
                                  cx="4"
                                  cy="4"
                                  r="4"
                                  fill={statusColors[activity.status] || "#94A3B8"}
                                />
                              </svg>
                              {activity.status}
                            </span>
                          </td>
                          <td className="date-cell">{activity.formattedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;