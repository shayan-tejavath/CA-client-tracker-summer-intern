import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getReportsAnalytics } from "../../services/reportService.js";

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

// Upgraded to QwikCA Premium Dashboard Palette
const COLORS = [
  "#7C3AED", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#10B981", // Emerald
  "#EC4899", // Pink
];

// Reusable styling objects for Recharts to ensure dark-mode compliance
const chartStyles = {
  tooltip: {
    backgroundColor: "rgba(18, 10, 35, 0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    color: "#fff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  tooltipItem: { color: "#fff", fontWeight: 600 },
  axisTick: { fill: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: 500 },
  grid: "rgba(255, 255, 255, 0.04)",
  legend: { paddingTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }
};

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await getReportsAnalytics();
        setData(response);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Loading analytics intelligence...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#FCA5A5", padding: "16px", borderRadius: "12px", textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const overview = data?.overview || {};

  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ BASE & ANIMATIONS ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-reports-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── SURFACES & HEADERS ── */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .qca-header-block {
          display: flex; flex-direction: column; gap: 8px;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #06B6D4; text-transform: uppercase;
          background: rgba(6, 182, 212, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(6, 182, 212, 0.2);
          margin-bottom: 8px;
        }

        .qca-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
        .qca-subtitle { font-size: 1rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── METRICS GRID ── */
        .qca-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.1s;
        }

        .qca-metric-card {
          padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, background 0.3s, border-color 0.3s;
          position: relative;
        }
        .qca-metric-card:hover {
          transform: translateY(-4px); background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        
        .qca-metric-label { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin-bottom: 8px; }
        .qca-metric-value { font-size: 2.4rem; font-weight: 800; color: #fff; margin: 0; line-height: 1; }

        /* ── CHARTS GRID ── */
        .qca-charts-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.2s;
        }

        .qca-chart-header { margin-bottom: 24px; }
        .qca-chart-header h2 { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 4px; }
        .qca-chart-header p { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); margin: 0; }

        /* Recharts Override Magic */
        .recharts-default-legend { margin-top: 16px !important; }
        .recharts-legend-item-text { color: rgba(255, 255, 255, 0.7) !important; font-size: 13px; font-weight: 500; }
        
        @media (max-width: 1024px) {
          .qca-charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="qca-reports-shell">
        
        {/* Page Header */}
        <section className="qca-surface" style={{ paddingBottom: "24px" }}>
          <div className="qca-header-block">
            <span className="qca-eyebrow">Reports & Analytics</span>
            <h1 className="qca-title">Business Analytics</h1>
            <p className="qca-subtitle">Monitor tasks, clients, employees, and growth analytics.</p>
          </div>
        </section>

        {/* KPI CARDS */}
        <div className="qca-metrics-grid">
          <div className="qca-metric-card">
            <span className="qca-metric-label">Clients</span>
            <h2 className="qca-metric-value">{overview.totalClients}</h2>
          </div>
          <div className="qca-metric-card">
            <span className="qca-metric-label">Tasks</span>
            <h2 className="qca-metric-value">{overview.totalTasks}</h2>
          </div>
          <div className="qca-metric-card">
            <span className="qca-metric-label">Completed</span>
            <h2 className="qca-metric-value" style={{ color: "#10B981" }}>{overview.completedTasks}</h2>
          </div>
          <div className="qca-metric-card">
            <span className="qca-metric-label">Pending</span>
            <h2 className="qca-metric-value" style={{ color: "#FBBF24" }}>{overview.pendingTasks}</h2>
          </div>
          <div className="qca-metric-card">
            <span className="qca-metric-label">Employees</span>
            <h2 className="qca-metric-value" style={{ color: "#06B6D4" }}>{overview.totalEmployees}</h2>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="qca-charts-grid">
          
          {/* TASK STATUS (PIE) */}
          <article className="qca-surface" style={{ padding: "24px" }}>
            <div className="qca-chart-header">
              <h2>Task Status</h2>
              <p>Current distribution of task progression.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.taskStatusData}
                  dataKey="total"
                  nameKey="_id"
                  outerRadius={100}
                  innerRadius={60} // Added inner radius for a modern "donut" look
                  stroke="rgba(18, 10, 35, 0.85)" // Matches background to create gaps
                  strokeWidth={4}
                  label={{ fill: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600 }}
                >
                  {data.taskStatusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
                <Legend wrapperStyle={chartStyles.legend} />
              </PieChart>
            </ResponsiveContainer>
          </article>

          {/* PRIORITY (BAR) */}
          <article className="qca-surface" style={{ padding: "24px", animationDelay: "0.25s" }}>
            <div className="qca-chart-header">
              <h2>Task Priority</h2>
              <p>Workload sorted by urgency levels.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
                <XAxis dataKey="_id" tick={chartStyles.axisTick} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={chartStyles.axisTick} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
                <Legend wrapperStyle={chartStyles.legend} />
                <Bar dataKey="total" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          {/* CLIENT GROWTH (LINE) */}
          <article className="qca-surface" style={{ padding: "24px", animationDelay: "0.3s" }}>
            <div className="qca-chart-header">
              <h2>Client Growth</h2>
              <p>Historical acquisition over time.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.clientGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
                <XAxis dataKey="_id" tick={chartStyles.axisTick} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={chartStyles.axisTick} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }} contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
                <Legend wrapperStyle={chartStyles.legend} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#06B6D4" 
                  strokeWidth={4} 
                  dot={{ fill: "#06B6D4", strokeWidth: 2, r: 4, stroke: "rgba(18, 10, 35, 0.85)" }} 
                  activeDot={{ r: 8, fill: "#fff", stroke: "#06B6D4" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </article>

          {/* MONTHLY TASKS (BAR) */}
          <article className="qca-surface" style={{ padding: "24px", animationDelay: "0.35s" }}>
            <div className="qca-chart-header">
              <h2>Monthly Tasks</h2>
              <p>Volume of tasks generated per month.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyTasks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
                <XAxis dataKey="_id" tick={chartStyles.axisTick} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={chartStyles.axisTick} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
                <Legend wrapperStyle={chartStyles.legend} />
                <Bar dataKey="total" fill="#F97316" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </article>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;