import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout.jsx";
import { getReportsAnalytics } from "../../../services/reportService.js";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

import "../../../styles/Reports.css";

const REPORT_TABS = [
  { to: "/dashboard/reports", label: "Overview", end: true },
  { to: "/dashboard/reports/tasks", label: "Task Reports" },
  { to: "/dashboard/reports/services", label: "Service Reports" },
  { to: "/dashboard/reports/clients", label: "Client Reports" },
  { to: "/dashboard/reports/employees", label: "Employee Timelog" },
  { to: "/dashboard/reports/export", label: "Export Center" },
];

const PIE_COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#64748B"];
const BAR_COLORS = {
  priority: "#2563EB",
  monthly: "#D97706",
  growth: "#16A34A",
};

const AXIS_TICK = {
  fill: "#64748B",
  fontSize: 12,
  fontWeight: 500,
};

const GRID_STROKE = "#E2E8F0";
const TOOLTIP_STROKE = "#2563EB";

const getSafeNumber = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const ReportsTabs = () => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      {REPORT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          style={({ isActive }) => ({
            padding: "10px 14px",
            borderRadius: "999px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            border: `1px solid ${isActive ? "#2563EB" : "#CBD5E1"}`,
            background: isActive ? "#2563EB" : "#FFFFFF",
            color: isActive ? "#FFFFFF" : "#334155",
            boxShadow: isActive ? "0 8px 20px rgba(37, 99, 235, 0.16)" : "none",
            transition: "all 0.2s ease",
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};

const AnalyticsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="reports-tooltip">
      {label ? <div className="reports-tooltip-label">{label}</div> : null}

      <div className="reports-tooltip-list">
        {payload.map((item) => (
          <div className="reports-tooltip-item" key={`${item.dataKey}-${item.name}`}>
            <span
              className="reports-tooltip-dot"
              style={{ backgroundColor: item.color || item.stroke || TOOLTIP_STROKE }}
            />
            <span className="reports-tooltip-name">{item.name || item.dataKey}</span>
            <span className="reports-tooltip-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsLegend = ({ payload }) => {
  if (!payload?.length) return null;

  return (
    <div className="reports-legend">
      {payload.map((item) => (
        <div className="reports-legend-item" key={`${item.value}-${item.dataKey}`}>
          <span
            className="reports-legend-dot"
            style={{ backgroundColor: item.color || TOOLTIP_STROKE }}
          />
          <span className="reports-legend-label">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const ReportsOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await getReportsAnalytics();
        setData(response);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const overview = data || {};

  const metricCards = useMemo(
    () => [
      {
        label: "Clients",
        value: getSafeNumber(overview.totalClients),
        trend: "Total active clients",
      },
      {
        label: "Tasks",
        value: getSafeNumber(overview.totalTasks),
        trend: "All tracked tasks",
      },
      {
        label: "Completed",
        value: getSafeNumber(overview.completedTasks),
        trend: "Finished work",
        variant: "success",
      },
      {
        label: "Pending",
        value: getSafeNumber(overview.pendingTasks),
        trend: "Needs attention",
        variant: "warning",
      },
      {
        label: "Employees",
        value: getSafeNumber(overview.totalEmployees),
        trend: "Team members",
        variant: "info",
      },
    ],
    [overview]
  );

  const taskStatusData = Array.isArray(data?.taskStatusData) ? data.taskStatusData : [];
  const priorityData = Array.isArray(data?.taskPriorityData) ? data.taskPriorityData : [];
  const clientGrowth = Array.isArray(data?.clientGrowthData) ? data.clientGrowthData : [];
  const monthlyTasks = Array.isArray(data?.monthlyTasksData) ? data.monthlyTasksData : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="reports-loading">
          <div className="reports-loading-card">
            <div className="reports-loading-title">Loading reports</div>
            <div className="reports-loading-subtitle">Preparing analytics overview…</div>
            <div className="reports-skeleton-grid">
              <div className="reports-skeleton-card" />
              <div className="reports-skeleton-card" />
              <div className="reports-skeleton-card" />
              <div className="reports-skeleton-card" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="reports-page">
          <ReportsTabs />
          <div className="reports-error-card" role="alert">
            <div className="reports-error-title">Could not load reports</div>
            <div className="reports-error-text">{error}</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="reports-page">
        <ReportsTabs />

        <section className="reports-hero">
          <div className="reports-hero-topline">Reports &amp; Analytics</div>
          <div className="reports-hero-row">
            <div>
              <h1 className="reports-title">Business Analytics</h1>
              <p className="reports-subtitle">
                Monitor tasks, clients, employees, and growth analytics in one place.
              </p>
            </div>

            <div className="reports-hero-chip">
              <span className="reports-hero-chip-dot" />
              Live dashboard
            </div>
          </div>
        </section>

        <section className="reports-metrics-grid" aria-label="Key metrics">
          {metricCards.map((card) => (
            <article key={card.label} className="reports-metric-card">
              <div className="reports-metric-label">{card.label}</div>
              <div
                className={`reports-metric-value ${
                  card.variant ? `reports-metric-value--${card.variant}` : ""
                }`}
              >
                {card.value}
              </div>
              <div className="reports-metric-trend">{card.trend}</div>
            </article>
          ))}
        </section>

        <section className="reports-grid">
          <article className="reports-card">
            <div className="reports-card-header">
              <div>
                <h2 className="reports-card-title">Task Status</h2>
                <p className="reports-card-text">Current distribution of task progression.</p>
              </div>
            </div>

            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    innerRadius={70}
                    stroke="#F8FAFC"
                    strokeWidth={3}
                    paddingAngle={2}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell
                        key={`task-status-${entry.name || index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Legend content={<AnalyticsLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="reports-card">
            <div className="reports-card-header">
              <div>
                <h2 className="reports-card-title">Task Priority</h2>
                <p className="reports-card-text">Workload sorted by urgency levels.</p>
              </div>
            </div>

            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="priority"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "#F8FAFC" }} />
                  <Legend content={<AnalyticsLegend />} />
                  <Bar
                    dataKey="count"
                    name="Tasks"
                    fill={BAR_COLORS.priority}
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="reports-card">
            <div className="reports-card-header">
              <div>
                <h2 className="reports-card-title">Client Growth</h2>
                <p className="reports-card-text">Historical acquisition over time.</p>
              </div>
            </div>

            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={clientGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 2 }} />
                  <Legend content={<AnalyticsLegend />} />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    name="Clients"
                    stroke={BAR_COLORS.growth}
                    strokeWidth={3}
                    dot={{ r: 4, fill: BAR_COLORS.growth, stroke: "#FFFFFF", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#FFFFFF", stroke: BAR_COLORS.growth, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="reports-card">
            <div className="reports-card-header">
              <div>
                <h2 className="reports-card-title">Monthly Tasks</h2>
                <p className="reports-card-text">Volume of tasks generated per month.</p>
              </div>
            </div>

            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyTasks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "#F8FAFC" }} />
                  <Legend content={<AnalyticsLegend />} />
                  <Bar
                    dataKey="tasks"
                    name="Tasks"
                    fill={BAR_COLORS.monthly}
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ReportsOverview;