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
  Completed: "#34d399",
  Pending: "#facc15",
  Overdue: "#f87171",
};

const metricCards = [
  {
    label: "Total Clients",
    icon: FaUsers,
    color: "#6366f1",
  },
  {
    label: "Total Employees",
    icon: FaUserFriends,
    color: "#38bdf8",
  },
  {
    label: "Total Tasks",
    icon: FaTasks,
    color: "#fbbf24",
  },
  {
    label: "Completed Tasks",
    icon: FaCheckCircle,
    color: "#34d399",
  },
  {
    label: "Pending Tasks",
    icon: FaClock,
    color: "#facc15",
  },
  {
    label: "Overdue Tasks",
    icon: FaExclamationTriangle,
    color: "#f87171",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data =
          await getDashboardSummary();

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
        color:
          statusColors.Completed,
      },
      {
        label: "Pending",
        value: summary.pendingTasks,
        color:
          statusColors.Pending,
      },
      {
        label: "Overdue",
        value: summary.overdueTasks,
        color:
          statusColors.Overdue,
      },
    ];
  }, [summary]);

  const statusTotal =
    statusMetrics.reduce(
      (sum, metric) =>
        sum + metric.value,
      0
    ) || 1;

  const donutSegments =
    useMemo(() => {
      const circumference =
        2 * Math.PI * 70;

      let offset = 0;

      return statusMetrics.map(
        (metric) => {
          const percent =
            metric.value /
            statusTotal;

          const dash =
            percent * circumference;

          const segment = {
            ...metric,
            percent: Math.round(
              percent * 100
            ),
            dash,
            offset,
          };

          offset -= dash;

          return segment;
        }
      );
    }, [statusMetrics, statusTotal]);

  const recentActivities =
    useMemo(() => {
      if (
        !summary?.recentActivities
      )
        return [];

      return summary.recentActivities.map(
        (activity) => ({
          ...activity,
          formattedDate:
            new Date(
              activity.date
            ).toLocaleString(
              undefined,
              {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
        })
      );
    }, [summary]);

  const monthlyTrendValues =
    useMemo(() => {
      const months =
        summary?.monthlyTaskTrend ||
        [];

      const values = months.map(
        (item) => item.total || 0
      );

      const maxValue = Math.max(
        ...values,
        1
      );

      const width = 620;
      const height = 240;
      const padding = 24;

      const innerWidth =
        width - padding * 2;

      const innerHeight =
        height - padding * 2;

      const points = months.map(
        (item, index) => {
          const x =
            padding +
            (innerWidth * index) /
              Math.max(
                months.length - 1,
                1
              );

          const y =
            padding +
            innerHeight -
            (innerHeight *
              (item.total || 0)) /
              maxValue;

          return `${x},${y}`;
        }
      );

      return {
        months,
        points,
        width,
        height,
        padding,
        innerHeight,
      };
    }, [summary]);

  const stats = summary
    ? [
        {
          label:
            "Total Clients",
          value:
            summary.totalClients,
        },
        {
          label:
            "Total Employees",
          value:
            summary.totalEmployees,
        },
        {
          label: "Total Tasks",
          value:
            summary.totalTasks,
        },
        {
          label:
            "Completed Tasks",
          value:
            summary.completedTasks,
        },
        {
          label:
            "Pending Tasks",
          value:
            summary.pendingTasks,
        },
        {
          label:
            "Overdue Tasks",
          value:
            summary.overdueTasks,
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">
            Dashboard Overview
          </p>

          <h1>
            Monitor client growth,
            tasks, team performance,
            and business activity in
            one place.
          </h1>

          <p>
            Real-time analytics for
            clients, tasks,
            documents, and employee
            productivity.
          </p>
        </div>

        <div className="intro-actions">
          <button
            className="btn btn-outline"
            onClick={() =>
              navigate(
                "/dashboard/clients"
              )
            }
          >
            + Add Client
          </button>

          <button
            className="btn btn-primary"
            onClick={() =>
              navigate(
                "/dashboard/tasks"
              )
            }
          >
            + Create Task
          </button>

          <button
            className="btn btn-ghost"
            onClick={() =>
              navigate(
                "/dashboard/documents/upload"
              )
            }
          >
            Upload Document
          </button>
        </div>
      </section>

      {loading ? (
        <div className="page-card">
          <p>
            Loading dashboard
            data...
          </p>
        </div>
      ) : error ? (
        <div className="page-card alert danger">
          {error}
        </div>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            {metricCards.map(
              (card) => {
                const Icon =
                  card.icon;

                const stat =
                  stats.find(
                    (item) =>
                      item.label ===
                      card.label
                  );

                return (
                  <article
                    key={card.label}
                    className="overview-card metric-card"
                  >
                    <span
                      className="overview-card-icon"
                      style={{
                        background:
                          card.color,
                      }}
                    >
                      <Icon />
                    </span>

                    <div>
                      <p className="overview-card-label">
                        {card.label}
                      </p>

                      <h2>
                        {stat?.value ??
                          0}
                      </h2>

                      <div className="metric-extra">
                        <span className="metric-pill-small">
                          Live
                        </span>
                      </div>

                      <span className="metric-subtext">
                        Updated in
                        real-time
                      </span>
                    </div>
                  </article>
                );
              }
            )}
          </section>

          <section className="dashboard-chart-grid">
            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">
                    Task Activity
                  </p>

                  <h2>
                    Tasks created in
                    the last 6 months
                  </h2>
                </div>

                <span className="metric-pill">
                  Monthly
                </span>
              </div>

              {monthlyTrendValues
                .months.length ===
              0 ? (
                <p>
                  No chart data
                  available.
                </p>
              ) : (
                <div className="chart-wrapper">
                  <svg
                    viewBox={`0 0 ${monthlyTrendValues.width} ${monthlyTrendValues.height}`}
                    className="chart-svg"
                  >
                    <defs>
                      <linearGradient
                        id="trendGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity="0.3"
                        />

                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={monthlyTrendValues.points.join(
                        " "
                      )}
                    />

                    <polygon
                      fill="url(#trendGradient)"
                      points={`${monthlyTrendValues.points.join(
                        " "
                      )} ${
                        monthlyTrendValues.width -
                        monthlyTrendValues.padding
                      },${
                        monthlyTrendValues.height -
                        monthlyTrendValues.padding
                      } ${
                        monthlyTrendValues.padding
                      },${
                        monthlyTrendValues.height -
                        monthlyTrendValues.padding
                      }`}
                    />
                  </svg>

                  <div className="chart-axis-labels">
                    {monthlyTrendValues.months.map(
                      (month) => (
                        <span
                          key={
                            month.month
                          }
                        >
                          {
                            month.month
                          }
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </article>

            <div className="status-panel">
              <article className="chart-card status-summary-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">
                      Task Status
                    </p>

                    <h2>
                      Task Breakdown
                    </h2>
                  </div>
                </div>

                <div className="status-donut-wrapper">
                  <svg
                    viewBox="0 0 220 220"
                    className="status-donut"
                  >
                    <circle
                      cx="110"
                      cy="110"
                      r="70"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="28"
                    />

                    {donutSegments.map(
                      (
                        segment
                      ) => (
                        <circle
                          key={
                            segment.label
                          }
                          cx="110"
                          cy="110"
                          r="70"
                          fill="transparent"
                          stroke={
                            segment.color
                          }
                          strokeWidth="28"
                          strokeDasharray={`${segment.dash} ${
                            2 *
                              Math.PI *
                              70 -
                            segment.dash
                          }`}
                          strokeDashoffset={
                            segment.offset
                          }
                          strokeLinecap="round"
                          transform="rotate(-90 110 110)"
                        />
                      )
                    )}
                  </svg>

                  <div className="status-donut-center">
                    <span>
                      {
                        summary.totalTasks
                      }
                    </span>

                    <small>
                      Total Tasks
                    </small>
                  </div>
                </div>

                <div className="status-list">
                  {donutSegments.map(
                    (
                      metric
                    ) => (
                      <div
                        key={
                          metric.label
                        }
                        className="status-item"
                      >
                        <span
                          className="status-dot"
                          style={{
                            background:
                              metric.color,
                          }}
                        />

                        <div className="status-item-label">
                          <strong>
                            {
                              metric.label
                            }
                          </strong>

                          <span>
                            {
                              metric.percent
                            }
                            %
                          </span>
                        </div>

                        <span>
                          {
                            metric.value
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </article>

              <article className="chart-card progress-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">
                      Progress
                    </p>

                    <h2>
                      Completion
                      Overview
                    </h2>
                  </div>
                </div>

                {statusMetrics.map(
                  (metric) => (
                    <div
                      key={metric.label}
                      className="progress-item"
                    >
                      <div className="progress-title">
                        <span>
                          {
                            metric.label
                          }
                        </span>

                        <strong>
                          {
                            metric.value
                          }
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${metric.percent}%`,
                            background:
                              metric.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </article>

              <article className="chart-card quick-summary-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">
                      Quick Summary
                    </p>

                    <h2>
                      Business
                      Overview
                    </h2>
                  </div>
                </div>

                <div className="quick-grid">
                  <div className="quick-row">
                    <span className="label">
                      Clients
                    </span>

                    <strong>
                      {
                        summary.totalClients
                      }
                    </strong>
                  </div>

                  <div className="quick-row">
                    <span className="label">
                      Employees
                    </span>

                    <strong>
                      {
                        summary.totalEmployees
                      }
                    </strong>
                  </div>

                  <div className="quick-row">
                    <span className="label">
                      Tasks
                    </span>

                    <strong>
                      {
                        summary.totalTasks
                      }
                    </strong>
                  </div>

                  <div className="quick-row">
                    <span className="label">
                      Documents
                    </span>

                    <strong>
                      {
                        summary.recentActivities
                          ?.length || 0
                      }
                    </strong>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="page-card">
            <div className="page-header">
              <div>
                <p className="eyebrow">
                  Recent Activities
                </p>

                <h2>
                  Latest System
                  Events
                </h2>

                <p>
                  Monitor recent
                  updates from tasks,
                  clients, and
                  documents.
                </p>
              </div>
            </div>

            {recentActivities.length ===
            0 ? (
              <p>
                No recent activity
                available.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        Activity
                      </th>
                      <th>
                        Subject
                      </th>
                      <th>
                        Owner
                      </th>
                      <th>
                        Status
                      </th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentActivities.map(
                      (
                        activity,
                        index
                      ) => (
                        <tr
                          key={`${activity.type}-${activity.title}-${index}`}
                        >
                          <td>
                            <strong>
                              {
                                activity.action
                              }
                            </strong>

                            <div className="detail-label">
                              {
                                activity.title
                              }
                            </div>
                          </td>

                          <td>
                            {activity.subject ||
                              "—"}
                          </td>

                          <td>
                            {activity.actor ||
                              "—"}
                          </td>

                          <td>
                            {
                              activity.status
                            }
                          </td>

                          <td>
                            {
                              activity.formattedDate
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;