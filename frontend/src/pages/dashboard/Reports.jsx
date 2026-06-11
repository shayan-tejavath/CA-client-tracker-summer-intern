import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getReportsAnalytics,
} from "../../services/reportService.js";

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

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const Reports = () => {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadReports =
      async () => {
        try {
          const response =
            await getReportsAnalytics();

          setData(response);
        } catch (err) {
          setError(
            err.response?.data
              ?.message ||
              "Failed to load reports."
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
        <div className="page-card">
          Loading reports...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="page-card alert danger">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const overview =
    data?.overview || {};

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Reports & Analytics
            </p>

            <h1>
              Business Analytics
            </h1>

            <p>
              Monitor tasks,
              clients, employees,
              and growth analytics.
            </p>
          </div>
        </div>

        {/* KPI CARDS */}

        <div className="stats-grid">
          <div className="stats-card">
            <p className="stats-card-label">
              Clients
            </p>

            <h2 className="stats-card-value">
              {
                overview.totalClients
              }
            </h2>
          </div>

          <div className="stats-card">
            <p className="stats-card-label">
              Tasks
            </p>

            <h2 className="stats-card-value">
              {overview.totalTasks}
            </h2>
          </div>

          <div className="stats-card">
            <p className="stats-card-label">
              Completed
            </p>

            <h2 className="stats-card-value">
              {
                overview.completedTasks
              }
            </h2>
          </div>

          <div className="stats-card">
            <p className="stats-card-label">
              Pending
            </p>

            <h2 className="stats-card-value">
              {
                overview.pendingTasks
              }
            </h2>
          </div>

          <div className="stats-card">
            <p className="stats-card-label">
              Employees
            </p>

            <h2 className="stats-card-value">
              {
                overview.totalEmployees
              }
            </h2>
          </div>
        </div>

        {/* CHARTS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "24px",
            marginTop: "30px",
          }}
        >
          {/* TASK STATUS */}

          <div className="chart-card">
            <h2>
              Task Status
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={
                    data.taskStatusData
                  }
                  dataKey="total"
                  nameKey="_id"
                  outerRadius={100}
                  label
                >
                  {data.taskStatusData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* PRIORITY */}

          <div className="chart-card">
            <h2>
              Task Priority
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={
                  data.priorityData
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="_id" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="total"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CLIENT GROWTH */}

          <div className="chart-card">
            <h2>
              Client Growth
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={
                  data.clientGrowth
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="_id" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* MONTHLY TASKS */}

          <div className="chart-card">
            <h2>
              Monthly Tasks
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={
                  data.monthlyTasks
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="_id" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="total"
                  fill="#f59e0b"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default Reports;