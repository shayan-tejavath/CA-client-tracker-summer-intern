import { useEffect, useMemo, useState } from "react";
import { FaUsers, FaUserFriends, FaTasks, FaCheckCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

const statusColors = {
  Completed: "#34d399",
  Pending: "#facc15",
  Overdue: "#f87171",
};

const metricCards = [
  { label: "Total Clients", icon: FaUsers, color: "#6366f1" },
  { label: "Total Employees", icon: FaUserFriends, color: "#38bdf8" },
  { label: "Total Tasks", icon: FaTasks, color: "#fbbf24" },
  { label: "Completed Tasks", icon: FaCheckCircle, color: "#34d399" },
  { label: "Pending Tasks", icon: FaClock, color: "#facc15" },
  { label: "Overdue Tasks", icon: FaExclamationTriangle, color: "#f87171" },
];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const statusMetrics = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Completed", value: summary.completedTasks, color: statusColors.Completed },
      { label: "Pending", value: summary.pendingTasks, color: statusColors.Pending },
      { label: "Overdue", value: summary.overdueTasks, color: statusColors.Overdue },
    ];
  }, [summary]);

  const statusTotal = statusMetrics.reduce((sum, metric) => sum + metric.value, 0) || 1;

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
      const x = padding + (innerWidth * index) / Math.max(months.length - 1, 1);
      const y = padding + innerHeight - (innerHeight * (item.total || 0)) / maxValue;
      return `${x},${y}`;
    });

    return { months, points, maxValue, width, height, padding, innerWidth, innerHeight };
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
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Good Evening, Admin 👋</p>
          <h1>Monitor client growth, task performance, and overdue work in one view.</h1>
        </div>
        <div className="intro-actions">
          <button className="btn btn-outline">+ Add Client</button>
          <button className="btn btn-primary">+ Create Task</button>
          <button className="btn btn-ghost">Upload Document</button>
        </div>
      </section>

      {loading ? (
        <div className="page-card">
          <p>Loading dashboard data…</p>
        </div>
      ) : error ? (
        <div className="page-card alert danger">{error}</div>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            {metricCards.map((card) => {
              const Icon = card.icon;
              const stat = stats.find((item) => item.label === card.label);
              return (
                <article key={card.label} className="overview-card metric-card">
                  <span className="overview-card-icon" style={{ background: card.color }}>
                    <Icon />
                  </span>
                  <div>
                        <p className="overview-card-label">{card.label}</p>
                        <h2>{stat?.value ?? 0}</h2>
                        <div className="metric-extra">
                          <span className="metric-pill-small">+12%</span>
                          <svg className="mini-spark" viewBox="0 0 40 12" preserveAspectRatio="none">
                            <polyline points="0,8 8,6 16,4 24,5 32,3 40,6" fill="none" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="metric-subtext">0% this month</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="dashboard-chart-grid">
            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">Task Activity Overview</p>
                  <h2>Tasks added in the last 6 months</h2>
                </div>
                <span className="metric-pill">Monthly</span>
              </div>

              {monthlyTrendValues.months.length === 0 ? (
                <p>No chart data available.</p>
              ) : (
                <div className="chart-wrapper">
                  <svg viewBox={`0 0 ${monthlyTrendValues.width} ${monthlyTrendValues.height}`} className="chart-svg">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = monthlyTrendValues.padding + monthlyTrendValues.innerHeight * ratio;
                      return (
                        <line key={ratio} x1={monthlyTrendValues.padding} x2={monthlyTrendValues.width - monthlyTrendValues.padding} y1={y} y2={y} stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="4 4" />
                      );
                    })}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={monthlyTrendValues.points.join(" ")}
                    />
                    <polygon
                      fill="url(#trendGradient)"
                      points={`${monthlyTrendValues.points.join(" ")} ${monthlyTrendValues.width - monthlyTrendValues.padding},${monthlyTrendValues.height - monthlyTrendValues.padding} ${monthlyTrendValues.padding},${monthlyTrendValues.height - monthlyTrendValues.padding}`}
                    />
                    {monthlyTrendValues.points.map((point, index) => {
                      const [x, y] = point.split(",").map(Number);
                      return <circle key={index} cx={x} cy={y} r="5" fill="#3b82f6" />;
                    })}
                  </svg>

                  <div className="chart-axis-labels">
                    {monthlyTrendValues.months.map((month) => (
                      <span key={month.month}>{month.month}</span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <div className="status-panel">
              <article className="chart-card status-summary-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">Task Status Breakdown</p>
                    <h2>Total Tasks</h2>
                  </div>
                </div>
                <div className="status-donut-wrapper">
                  <svg viewBox="0 0 220 220" className="status-donut">
                    <circle cx="110" cy="110" r="70" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="28" />
                    {donutSegments.map((segment) => (
                      <circle
                        key={segment.label}
                        cx="110"
                        cy="110"
                        r="70"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="28"
                        strokeDasharray={`${segment.dash} ${2 * Math.PI * 70 - segment.dash}`}
                        strokeDashoffset={segment.offset}
                        strokeLinecap="round"
                        transform="rotate(-90 110 110)"
                      />
                    ))}
                  </svg>
                  <div className="status-donut-center">
                    <span>{summary.totalTasks}</span>
                    <small>Total Tasks</small>
                  </div>
                </div>
                <div className="status-list">
                  {donutSegments.map((metric) => (
                    <div key={metric.label} className="status-item">
                      <span className="status-dot" style={{ background: metric.color }} />
                      <div className="status-item-label">
                        <strong>{metric.label}</strong>
                        <span>{metric.percent}%</span>
                      </div>
                      <span>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="chart-card progress-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">Progress Overview</p>
                    <h2>Task completion</h2>
                  </div>
                </div>
                <div className="progress-item">
                  <div className="progress-title">
                    <span>Completed</span>
                    <strong>{summary.completedTasks}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill completed" style={{ width: `${Math.round((summary.completedTasks / statusTotal) * 100)}%` }} />
                  </div>
                  <span className="progress-value">{Math.round((summary.completedTasks / statusTotal) * 100)}%</span>
                </div>
                <div className="progress-item">
                  <div className="progress-title">
                    <span>Pending</span>
                    <strong>{summary.pendingTasks}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill pending" style={{ width: `${Math.round((summary.pendingTasks / statusTotal) * 100)}%` }} />
                  </div>
                  <span className="progress-value">{Math.round((summary.pendingTasks / statusTotal) * 100)}%</span>
                </div>
                <div className="progress-item">
                  <div className="progress-title">
                    <span>Overdue</span>
                    <strong>{summary.overdueTasks}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill overdue" style={{ width: `${Math.round((summary.overdueTasks / statusTotal) * 100)}%` }} />
                  </div>
                  <span className="progress-value">{Math.round((summary.overdueTasks / statusTotal) * 100)}%</span>
                </div>
              </article>
              <article className="chart-card upcoming-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">Upcoming Deadlines</p>
                    <h2>Upcoming Deadlines</h2>
                  </div>
                </div>
                <ul className="upcoming-list">
                  {(summary?.upcomingDeadlines || [
                    { title: "GST Filing", dateLabel: "Tomorrow", date: null },
                    { title: "Income Tax Return", dateLabel: "Jun 5, 2026", date: null },
                    { title: "Audit Submission", dateLabel: "Jun 10, 2026", date: null },
                  ]).map((d, i) => (
                    <li key={i} className="upcoming-item">
                      <span className="dot-indicator" />
                      <div className="upcoming-content">
                        <strong>{d.title}</strong>
                        <div className="detail-label">{d.date ? new Date(d.date).toLocaleDateString() : d.dateLabel}</div>
                      </div>
                      <span className="upcoming-date">{d.dateLabel}</span>
                    </li>
                  ))}
                </ul>
                <a className="view-all">View all deadlines →</a>
              </article>

              <article className="chart-card quick-summary-card">
                <div className="chart-card-header">
                  <div>
                    <p className="eyebrow">Quick Summary</p>
                    <h2>Quick Summary</h2>
                  </div>
                </div>
                <div className="quick-grid">
                  <div className="quick-row"><span className="label">Total Clients</span><strong>{summary?.totalClients ?? 0}</strong></div>
                  <div className="quick-row"><span className="label">Active Employees</span><strong>{summary?.totalEmployees ?? 0}</strong></div>
                  <div className="quick-row"><span className="label">Open Tasks</span><strong>{summary?.totalTasks ?? 0}</strong></div>
                  <div className="quick-row"><span className="label">Completed This Month</span><strong>{summary?.completedTasks ?? 0}</strong></div>
                </div>
              </article>
            </div>
          </section>

          <section className="page-card">
            <div className="page-header">
              <div>
                <p className="eyebrow">Recent activities</p>
                <h2>Latest system events</h2>
                <p>Track recent client onboarding, document uploads, and task updates in one place.</p>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <p>No recent activity available.</p>
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
                          <strong>{activity.action}</strong>
                          <div className="detail-label">{activity.title}</div>
                        </td>
                        <td>{activity.subject || "—"}</td>
                        <td>{activity.actor || "—"}</td>
                        <td>{activity.status}</td>
                        <td>{activity.formattedDate}</td>
                      </tr>
                    ))}
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
