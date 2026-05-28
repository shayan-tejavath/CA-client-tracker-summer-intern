import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

const statusColors = {
  Completed: "#34d399",
  Pending: "#facc15",
  Overdue: "#f87171",
};

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

    return { months, values, points, maxValue, width, height, padding, innerWidth, innerHeight };
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
          <span className="eyebrow">Analytics</span>
          <h1>Practice dashboard</h1>
          <p>Monitor client growth, task performance, and overdue work in one view.</p>
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
            {stats.map((card) => (
              <article key={card.label} className="overview-card">
                <p className="overview-card-label">{card.label}</p>
                <h2>{card.value}</h2>
              </article>
            ))}
          </section>

          <section className="dashboard-chart-grid">
            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">Trend</p>
                  <h2>Tasks added in the last 6 months</h2>
                </div>
                <span className="metric-pill">Monthly task trend</span>
              </div>

              {monthlyTrendValues.months.length === 0 ? (
                <p>No chart data available.</p>
              ) : (
                <div className="chart-wrapper">
                  <svg viewBox={`0 0 ${monthlyTrendValues.width} ${monthlyTrendValues.height}`} className="chart-svg">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = monthlyTrendValues.padding + monthlyTrendValues.innerHeight * ratio;
                      return (
                        <line key={ratio} x1={monthlyTrendValues.padding} x2={monthlyTrendValues.width - monthlyTrendValues.padding} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                      );
                    })}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
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
                      return <circle key={index} cx={x} cy={y} r="5" fill="#2563eb" />;
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

            <article className="chart-card">
              <div className="chart-card-header">
                <div>
                  <p className="eyebrow">Progress</p>
                  <h2>Task status breakdown</h2>
                </div>
              </div>
              <div className="status-bars">
                {statusMetrics.map((metric) => {
                  const percent = Math.round((metric.value / statusTotal) * 100);
                  return (
                    <div key={metric.label} className="status-bar-row">
                      <div className="status-bar-title">
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                      <div className="status-bar-track">
                        <div className="status-bar-fill" style={{ width: `${percent}%`, background: metric.color }} />
                      </div>
                      <span className="status-bar-percent">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </article>
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
