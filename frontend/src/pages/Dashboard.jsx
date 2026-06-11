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
  Completed: "#10B981", // Enhanced Emerald
  Pending: "#FBBF24",   // Enhanced Amber
  Overdue: "#EF4444",   // Enhanced Red
};

const metricCards = [
  {
    label: "Total Clients",
    icon: FaUsers,
    color: "#7C3AED", // QwikCA Purple
  },
  {
    label: "Total Employees",
    icon: FaUserFriends,
    color: "#06B6D4", // QwikCA Cyan
  },
  {
    label: "Total Tasks",
    icon: FaTasks,
    color: "#3B82F6", // Blue
  },
  {
    label: "Completed Tasks",
    icon: FaCheckCircle,
    color: "#10B981",
  },
  {
    label: "Pending Tasks",
    icon: FaClock,
    color: "#FBBF24",
  },
  {
    label: "Overdue Tasks",
    icon: FaExclamationTriangle,
    color: "#EF4444",
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
    statusMetrics.reduce(
      (sum, metric) => sum + metric.value,
      0
    ) || 1;

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
      innerHeight,
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
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ KEYFRAMES & ANIMATIONS ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes qca-draw-line {
          0% { stroke-dasharray: 0, 2000; }
          100% { stroke-dasharray: 2000, 0; }
        }

        @keyframes qca-fade-area {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes qca-spin-in {
          0% { transform: rotate(-180deg) scale(0.8); opacity: 0; }
          100% { transform: rotate(-90deg) scale(1); opacity: 1; }
        }

        @keyframes qca-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ━━━━━━━━━━━━━━━━━━━━ CORE LAYOUT ━━━━━━━━━━━━━━━━━━━━ */
        .qca-dash-shell {
          display: flex; flex-direction: column; gap: 36px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* Top Intro Section */
        .qca-dash-intro {
          display: flex; align-items: flex-end; justify-content: space-between;
          flex-wrap: wrap; gap: 24px; padding-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.12em;
          color: #A855F7; text-transform: uppercase; margin-bottom: 12px;
          background: rgba(168,85,247,0.1); padding: 4px 12px; border-radius: 100px;
          border: 1px solid rgba(168,85,247,0.2);
        }

        .qca-dash-intro h1 {
          font-size: clamp(2rem, 3.5vw, 2.6rem); font-weight: 800;
          letter-spacing: -0.04em; line-height: 1.15; margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .qca-dash-intro p {
          color: rgba(255,255,255,0.5); font-size: 1.05rem; line-height: 1.6;
        }

        /* Buttons */
        .qca-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 20px; height: 44px; border-radius: 12px;
          font-size: 14px; font-weight: 600; font-family: inherit;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1); cursor: pointer; border: none;
          position: relative; overflow: hidden;
        }
        
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.4);
        }
        .qca-btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%); transition: transform 0.5s ease;
        }
        .qca-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.6); }
        .qca-btn-primary:hover::after { transform: translateX(100%); }

        .qca-btn-outline {
          background: rgba(255,255,255,0.03); color: #fff;
          border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px);
        }
        .qca-btn-outline:hover {
          background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }

        .qca-btn-ghost { background: transparent; color: rgba(255,255,255,0.6); }
        .qca-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }

        /* Glass Surface Base */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
        }

        /* ━━━━━━━━━━━━━━━━━━━━ METRICS GRID ━━━━━━━━━━━━━━━━━━━━ */
        .qca-metrics-container {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;
        }

        .qca-metric-card {
          padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s, box-shadow 0.4s;
          cursor: pointer;
          /* The delay is injected via inline style var(--delay) */
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: calc(var(--delay) * 80ms + 100ms);
        }

        /* Card Hover Effects */
        .qca-metric-card::before {
          content: ''; position: absolute; inset: 0; opacity: 0;
          background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06), transparent 40%);
          transition: opacity 0.4s; pointer-events: none;
        }
        .qca-metric-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: var(--card-color);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          background: rgba(18, 10, 35, 0.7);
        }
        .qca-metric-card:hover::before { opacity: 1; }

        .qca-metric-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        
        .qca-metric-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: #fff;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .qca-metric-card:hover .qca-metric-icon { transform: scale(1.15) rotate(-5deg); }

        .qca-metric-badge {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05);
          padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);
        }

        .qca-metric-body h2 {
          font-size: 2.4rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; margin-bottom: 4px;
        }
        .qca-metric-body p { font-size: 0.95rem; color: rgba(255,255,255,0.5); font-weight: 500; }

        /* ━━━━━━━━━━━━━━━━━━━━ CHARTS SECTION ━━━━━━━━━━━━━━━━━━━━ */
        .qca-charts-grid {
          display: grid; grid-template-columns: 2fr 1fr; gap: 24px;
          animation: qca-stagger-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.4s;
        }

        .qca-chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .qca-chart-header h3 { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .qca-chart-header p { font-size: 0.9rem; color: rgba(255,255,255,0.4); }

        /* Animated Area Chart */
        .qca-line-chart-svg {
          width: 100%; height: auto; max-height: 300px;
          filter: drop-shadow(0 16px 32px rgba(124,58,237,0.15));
        }
        .qca-anim-area {
          animation: qca-fade-area 1.2s cubic-bezier(0.16,1,0.3,1) forwards;
          transform-origin: bottom;
        }
        .qca-anim-line {
          animation: qca-draw-line 1.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        
        .qca-chart-x-axis {
          display: flex; justify-content: space-between; padding: 12px 16px 0;
        }
        .qca-chart-x-axis span { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 600; }

        /* Animated Donut Chart */
        .qca-side-column { display: flex; flex-direction: column; gap: 24px; }
        
        .qca-donut-container {
          position: relative; width: 100%; max-width: 200px; margin: 0 auto 32px;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.4));
        }
        .qca-donut-svg {
          width: 100%; height: 100%;
          animation: qca-spin-in 1s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .qca-donut-segment {
          transition: stroke-width 0.3s ease, filter 0.3s ease;
          cursor: pointer;
        }
        .qca-donut-segment:hover { stroke-width: 32; filter: brightness(1.2); }

        .qca-donut-center {
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .qca-donut-center strong { font-size: 2.4rem; font-weight: 800; line-height: 1; text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .qca-donut-center span { font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .qca-legend-list { display: flex; flex-direction: column; gap: 12px; }
        .qca-legend-item {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.02); padding: 12px 16px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.03); transition: all 0.2s; cursor: pointer;
        }
        .qca-legend-item:hover { background: rgba(255,255,255,0.05); transform: translateX(4px); border-color: rgba(255,255,255,0.1); }
        
        .qca-legend-title { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 600; }
        .qca-legend-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
        .qca-legend-value { font-size: 0.95rem; font-weight: 700; color: rgba(255,255,255,0.8); }

        /* Quick Overview Grid */
        .qca-quick-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .qca-mini-stat {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          padding: 16px; border-radius: 14px; text-align: center; transition: background 0.3s;
        }
        .qca-mini-stat:hover { background: rgba(255,255,255,0.05); }
        .qca-mini-stat span { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-bottom: 4px; font-weight: 500; }
        .qca-mini-stat strong { display: block; font-size: 1.4rem; font-weight: 800; color: #fff; }

        /* ━━━━━━━━━━━━━━━━━━━━ DATA TABLE ━━━━━━━━━━━━━━━━━━━━ */
        .qca-table-section {
          padding: 32px;
          animation: qca-stagger-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.6s;
        }

        .qca-table-wrapper { width: 100%; overflow-x: auto; margin-top: 16px; }
        .qca-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        
        .qca-table th {
          padding: 16px 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        
        .qca-table td {
          padding: 18px 20px; font-size: 0.95rem; color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle;
          transition: all 0.2s ease;
        }
        
        /* Interactive Row Hover */
        .qca-table tbody tr { transition: background 0.2s; position: relative; }
        .qca-table tbody tr:hover td {
          background: rgba(255,255,255,0.03); color: #fff; cursor: pointer;
        }
        .qca-table tbody tr:hover td:first-child {
          box-shadow: inset 3px 0 0 #7C3AED; /* Left border highlight */
        }

        .qca-cell-main { color: #fff; font-weight: 600; display: block; margin-bottom: 4px; }
        .qca-cell-sub { font-size: 0.85rem; color: rgba(255,255,255,0.4); }

        .qca-badge {
          display: inline-flex; align-items: center; padding: 6px 12px;
          border-radius: 100px; font-size: 0.75rem; font-weight: 700;
          background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* ━━━━━━━━━━━━━━━━━━━━ RESPONSIVE ━━━━━━━━━━━━━━━━━━━━ */
        @media (max-width: 1024px) {
          .qca-charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .qca-dash-intro { flex-direction: column; align-items: flex-start; }
          .qca-table-section { padding: 20px; }
        }
      `}</style>

      <div className="qca-dash-shell">
        
        {/* ── INTRO HEADER ── */}
        <section className="qca-dash-intro">
          <div>
            <div className="qca-eyebrow">Dashboard Overview</div>
            <h1>Monitor growth & activity</h1>
            <p>Real-time analytics for clients, tasks, documents, and team productivity.</p>
          </div>

          <div className="qca-actions">
            <button className="qca-btn qca-btn-ghost" onClick={() => navigate("/dashboard/documents/upload")}>
              Upload Document
            </button>
            <button className="qca-btn qca-btn-outline" onClick={() => navigate("/dashboard/clients")}>
              + Add Client
            </button>
            <button className="qca-btn qca-btn-primary" onClick={() => navigate("/dashboard/tasks")}>
              + Create Task
            </button>
          </div>
        </section>

        {loading ? (
          <div className="qca-surface" style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
            <div className="qca-metric-icon" style={{ margin: "0 auto 16px", animation: "qca-shimmer 2s infinite linear" }}>...</div>
            <p>Loading dashboard intelligence...</p>
          </div>
        ) : error ? (
          <div className="qca-surface" style={{ border: "1px solid #EF4444", background: "rgba(239,68,68,0.1)", padding: "24px", color: "#FCA5A5" }}>
            {error}
          </div>
        ) : (
          <>
            {/* ── METRICS GRID ── */}
            <section className="qca-metrics-container">
              {metricCards.map((card, index) => {
                const Icon = card.icon;
                const stat = stats.find((item) => item.label === card.label);

                return (
                  <article 
                    key={card.label} 
                    className="qca-surface qca-metric-card"
                    style={{ 
                      "--delay": index, 
                      "--card-color": card.color 
                    }}
                  >
                    <div className="qca-metric-header">
                      <div className="qca-metric-icon" style={{ background: `linear-gradient(135deg, ${card.color} 0%, rgba(255,255,255,0.1) 100%)` }}>
                        <Icon />
                      </div>
                      <span className="qca-metric-badge">Live</span>
                    </div>
                    <div className="qca-metric-body">
                      <h2>{stat?.value ?? 0}</h2>
                      <p>{card.label}</p>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* ── CHARTS GRID ── */}
            <section className="qca-charts-grid">
              
              {/* Left: Animated Area Chart */}
              <article className="qca-surface" style={{ padding: "32px" }}>
                <div className="qca-chart-header">
                  <div>
                    <h3>Task Activity</h3>
                    <p>Tasks created in the last 6 months</p>
                  </div>
                  <span className="qca-metric-badge" style={{ background: "rgba(124,58,237,0.15)", color: "#C4B5FD", borderColor: "rgba(124,58,237,0.3)" }}>
                    Monthly
                  </span>
                </div>

                {monthlyTrendValues.months.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "40px 0" }}>
                    No chart data available.
                  </p>
                ) : (
                  <div>
                    <svg
                      viewBox={`0 0 ${monthlyTrendValues.width} ${monthlyTrendValues.height}`}
                      className="qca-line-chart-svg"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06B6D4" />
                          <stop offset="50%" stopColor="#7C3AED" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>

                      <polygon
                        className="qca-anim-area"
                        fill="url(#areaGlow)"
                        points={`${monthlyTrendValues.points.join(" ")} ${
                          monthlyTrendValues.width - monthlyTrendValues.padding
                        },${monthlyTrendValues.height - monthlyTrendValues.padding} ${
                          monthlyTrendValues.padding
                        },${monthlyTrendValues.height - monthlyTrendValues.padding}`}
                      />

                      <polyline
                        className="qca-anim-line"
                        fill="none"
                        stroke="url(#lineGlow)"
                        strokeWidth="5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={monthlyTrendValues.points.join(" ")}
                      />
                    </svg>

                    <div className="qca-chart-x-axis">
                      {monthlyTrendValues.months.map((month) => (
                        <span key={month.month}>{month.month}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* Right: Donut Chart & Summary */}
              <div className="qca-side-column">
                
                {/* Donut Block */}
                <article className="qca-surface" style={{ padding: "32px" }}>
                  <div className="qca-chart-header" style={{ marginBottom: "32px" }}>
                    <div>
                      <h3>Task Breakdown</h3>
                      <p>Status overview distribution</p>
                    </div>
                  </div>

                  <div className="qca-donut-container">
                    <svg viewBox="0 0 220 220" className="qca-donut-svg">
                      <circle cx="110" cy="110" r="70" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="26" />
                      {donutSegments.map((segment) => (
                        <circle
                          key={segment.label}
                          className="qca-donut-segment"
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
                    <div className="qca-donut-center">
                      <strong>{summary.totalTasks}</strong>
                      <span>Total Tasks</span>
                    </div>
                  </div>

                  <div className="qca-legend-list">
                    {donutSegments.map((metric) => (
                      <div key={metric.label} className="qca-legend-item">
                        <div className="qca-legend-title" style={{ color: metric.color }}>
                          <span className="qca-legend-dot" style={{ background: metric.color }} />
                          {metric.label}
                        </div>
                        <span className="qca-legend-value">{metric.percent}% ({metric.value})</span>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Quick Stats Block */}
                <article className="qca-surface" style={{ padding: "24px" }}>
                  <div className="qca-chart-header" style={{ marginBottom: "16px" }}>
                    <h3>Quick Overview</h3>
                  </div>
                  <div className="qca-quick-stats">
                    <div className="qca-mini-stat">
                      <span>Clients</span>
                      <strong>{summary.totalClients}</strong>
                    </div>
                    <div className="qca-mini-stat">
                      <span>Employees</span>
                      <strong>{summary.totalEmployees}</strong>
                    </div>
                    <div className="qca-mini-stat">
                      <span>Tasks</span>
                      <strong>{summary.totalTasks}</strong>
                    </div>
                    <div className="qca-mini-stat">
                      <span>Docs</span>
                      <strong>{summary.recentActivities?.length || 0}</strong>
                    </div>
                  </div>
                </article>

              </div>
            </section>

            {/* ── RECENT ACTIVITY TABLE ── */}
            <section className="qca-surface qca-table-section">
              <div className="qca-chart-header">
                <div>
                  <h3>Recent Activities</h3>
                  <p>Latest system events and timeline updates</p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", padding: "20px 0" }}>No recent activity available.</p>
              ) : (
                <div className="qca-table-wrapper">
                  <table className="qca-table">
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
                            <span className="qca-cell-main">{activity.action}</span>
                            <span className="qca-cell-sub">{activity.title}</span>
                          </td>
                          <td>{activity.subject || "—"}</td>
                          <td>{activity.actor || "—"}</td>
                          <td>
                            <span className="qca-badge" style={{
                              borderColor: statusColors[activity.status] || "rgba(255,255,255,0.2)",
                              color: statusColors[activity.status] || "#fff"
                            }}>
                              {activity.status}
                            </span>
                          </td>
                          <td style={{ color: "rgba(255,255,255,0.4)" }}>
                            {activity.formattedDate}
                          </td>
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