import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import { deleteTask, getTasks } from "../../services/taskService.js";
import { getEmployees } from "../../services/employeeService.js";

const statusOptions = ["Pending", "In Progress", "Completed", "Overdue"];

// UI Helper: Map task status/priority to brand colors
const getBadgeColor = (value) => {
  const normalized = (value || "").toLowerCase();
  if (["completed", "low"].includes(normalized)) return "#10B981"; // Emerald
  if (["pending", "medium"].includes(normalized)) return "#FBBF24"; // Amber
  if (["overdue", "high"].includes(normalized)) return "#EF4444"; // Red
  if (["in progress"].includes(normalized)) return "#06B6D4"; // Cyan
  return "#A855F7"; // Default Purple
};

const TasksList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const canCreateTask = ["SuperAdmin", "Partner", "Manager"].includes(user?.role);
  const canManageTasks = canCreateTask;

  const taskStats = useMemo(() => {
    const counts = {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "Pending").length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      completed: tasks.filter((task) => task.status === "Completed").length,
      overdue: tasks.filter((task) => task.status === "Overdue").length,
    };

    return [
      {
        key: "total",
        label: "Total Tasks",
        value: counts.total,
        icon: <HiOutlineClipboardList />,
        accent: "#7C3AED", // Purple
      },
      {
        key: "pending",
        label: "Pending",
        value: counts.pending,
        icon: <HiOutlineClock />,
        accent: "#FBBF24", // Amber
      },
      {
        key: "inProgress",
        label: "In Progress",
        value: counts.inProgress,
        icon: <HiOutlineRefresh />,
        accent: "#06B6D4", // Cyan
      },
      {
        key: "completed",
        label: "Completed",
        value: counts.completed,
        icon: <HiOutlineCheckCircle />,
        accent: "#10B981", // Emerald
      },
      {
        key: "overdue",
        label: "Overdue",
        value: counts.overdue,
        icon: <HiOutlineExclamationCircle />,
        accent: "#EF4444", // Red
      },
    ];
  }, [tasks]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [taskData, employeeData] = await Promise.all([
          getTasks(),
          getEmployees(),
        ]);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setEmployees(Array.isArray(employeeData) ? employeeData : []);

        // Extract unique clients from tasks
        const clientsMap = new Map();

        (Array.isArray(taskData) ? taskData : []).forEach((task) => {
          if (task.client && task.client._id) {
            if (!clientsMap.has(task.client._id)) {
              clientsMap.set(task.client._id, task.client);
            }
          }
        });

        setClients(Array.from(clientsMap.values()));
      } catch (err) {
        console.error("[TasksList] loadData failed", err);
        setError(err.response?.data?.message || err.message || "Unable to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter && task.status !== statusFilter) {
        return false;
      }
      if (employeeFilter && task.assignedTo?._id !== employeeFilter) {
        return false;
      }
      if (clientFilter && task.client?._id !== clientFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }

      const clientName = task.client?.clientName || "";
      const serviceLabel = `${task.service?.serviceCategory || ""} ${task.service?.subService || ""}`.trim();
      return [task.title, clientName, serviceLabel, task.assignedTo?.name, task.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [tasks, clientFilter, employeeFilter, search, statusFilter]);

  const handleDelete = async (taskId) => {
    const confirmed = window.confirm("Delete this task? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteTask(taskId);
      setTasks((current) => current.filter((task) => task._id !== taskId));
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to delete task.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ ANIMATIONS & BASE ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-tasks-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── GLASS SURFACES ── */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── HEADERS ── */
        .qca-header-row {
          display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #A855F7; text-transform: uppercase;
          background: rgba(168, 85, 247, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(168, 85, 247, 0.2);
          margin-bottom: 12px;
        }

        .qca-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 8px 0; }
        .qca-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── BUTTONS ── */
        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 20px; height: 42px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: none; text-decoration: none;
        }
        
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .qca-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.5); }
        
        .qca-btn-outline {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.15); color: #fff;
        }
        .qca-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); }

        .qca-btn-micro { height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
        .qca-btn-danger { background: transparent; color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
        .qca-btn-danger:hover { background: rgba(239,68,68,0.15); color: #fff; border-color: #EF4444; }

        /* ── METRICS GRID ── */
        .qca-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;
          margin-top: 32px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.1s;
        }
        .qca-metric-card {
          padding: 24px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, border-color 0.3s;
        }
        .qca-metric-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); background: rgba(255, 255, 255, 0.04); }
        
        .qca-metric-icon {
          width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 16px; color: #fff;
        }
        .qca-metric-card p { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .qca-metric-card h2 { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0; line-height: 1; }

        /* ── TOOLBAR / FILTERS ── */
        .qca-toolbar-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;
          margin: 32px 0 24px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.2s;
        }
        .qca-filter-item { display: flex; flex-direction: column; gap: 8px; }
        .qca-filter-item label { font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.6); }

        .qca-input, .qca-select {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem;
          font-family: inherit; transition: all 0.3s; outline: none;
        }
        .qca-input::placeholder { color: rgba(255,255,255,0.3); }
        .qca-input:hover, .qca-select:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .qca-input:focus, .qca-select:focus {
          border-color: #7C3AED; background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }
        
        .qca-select {
          appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 14px center; background-size: 14px; padding-right: 36px;
        }
        .qca-select option { background: #120a23; color: #fff; }

        /* ── DATA TABLE ── */
        .qca-table-wrapper {
          width: 100%; overflow-x: auto;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.3s;
        }
        .qca-table { width: 100%; border-collapse: collapse; text-align: left; }
        .qca-table th {
          padding: 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qca-table td {
          padding: 18px 16px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle;
        }
        .qca-table tbody tr { transition: background 0.2s; }
        .qca-table tbody tr:hover td { background: rgba(255, 255, 255, 0.03); }

        .qca-cell-main {
          color: #fff; font-weight: 600; font-size: 0.95rem; border: none; background: transparent;
          cursor: pointer; padding: 0; text-align: left; transition: color 0.2s; font-family: inherit;
        }
        .qca-cell-main:hover { color: #A855F7; text-decoration: underline; text-underline-offset: 2px; }
        
        .qca-cell-sub { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); display: block; margin-top: 2px; }

        /* Badges */
        .qca-badge {
          display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px;
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .qca-table-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── EMPTY & ALERT STATES ── */
        .qca-empty-state {
          padding: 60px 20px; text-align: center; background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;
          color: rgba(255,255,255,0.5); font-size: 0.95rem; margin-top: 16px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.3s;
        }
        
        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center; font-weight: 500;
        }

        @media (max-width: 768px) {
          .qca-header-row { flex-direction: column; gap: 16px; }
          .qca-surface { padding: 24px; }
          .qca-toolbar-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="qca-tasks-shell">
        <section className="qca-surface">
          
          {/* HEADER */}
          <div className="qca-header-row">
            <div>
              <span className="qca-eyebrow">Tasks</span>
              <h1 className="qca-title">Task Inbox</h1>
              <p className="qca-subtitle">Filter and manage your team’s open work, due dates, and assignments.</p>
            </div>
            {canCreateTask && (
              <div>
                <button type="button" className="qca-btn qca-btn-primary" onClick={() => navigate("/dashboard/tasks/add")}>
                  + Create Task
                </button>
              </div>
            )}
          </div>

          {/* STATS GRID */}
          <div className="qca-metrics-grid">
            {taskStats.map((item) => (
              <div key={item.key} className="qca-metric-card">
                <div className="qca-metric-icon" style={{ background: `linear-gradient(135deg, ${item.accent}, ${item.accent}80)` }}>
                  {item.icon}
                </div>
                <p>{item.label}</p>
                <h2 style={{ color: item.accent }}>{item.value}</h2>
              </div>
            ))}
          </div>

          {/* FILTERS TOOLBAR */}
          <div className="qca-toolbar-grid">
            <div className="qca-filter-item">
              <label>Search tasks</label>
              <input
                type="search"
                className="qca-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, client, or assignee..."
              />
            </div>
            <div className="qca-filter-item">
              <label>Status</label>
              <select className="qca-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="qca-filter-item">
              <label>Assigned employee</label>
              <select className="qca-select" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>{employee.name}</option>
                ))}
              </select>
            </div>
            <div className="qca-filter-item">
              <label>Client</label>
              <select className="qca-select" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.clientName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LOADING / ERROR / TABLE */}
          {loading ? (
            <div className="qca-empty-state" style={{ border: "none" }}>Loading task database...</div>
          ) : error ? (
            <div className="qca-alert-danger">{error}</div>
          ) : (
            <div className="qca-table-wrapper">
              <table className="qca-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Client / Service</th>
                    <th>Assigned to</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="qca-empty-state" style={{ margin: 0, padding: "32px 20px" }}>
                          No tasks match the current filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const statusColor = getBadgeColor(task.status);
                      const priorityColor = getBadgeColor(task.priority);
                      
                      return (
                        <tr key={task._id}>
                          {/* TASK TITLE */}
                          <td>
                            <button 
                              type="button" 
                              className="qca-cell-main" 
                              onClick={() => navigate(`/dashboard/tasks/${task._id}`)}
                            >
                              {task.title}
                            </button>
                          </td>

                          {/* CLIENT / SERVICE (Stacked) */}
                          <td>
                            <span style={{ color: "#fff", fontWeight: 600 }}>{task.client?.clientName || "—"}</span>
                            <span className="qca-cell-sub">
                              {task.service ? `${task.service.serviceCategory} — ${task.service.subService}` : "No service linked"}
                            </span>
                          </td>

                          {/* ASSIGNEE */}
                          <td>{task.assignedTo?.name || "—"}</td>

                          {/* STATUS */}
                          <td>
                            <span className="qca-badge" style={{ borderColor: `${statusColor}50`, color: statusColor, background: `${statusColor}15` }}>
                              {task.status}
                            </span>
                          </td>

                          {/* PRIORITY */}
                          <td>
                            <span className="qca-badge" style={{ borderColor: `${priorityColor}50`, color: priorityColor, background: `${priorityColor}15` }}>
                              {task.priority || "—"}
                            </span>
                          </td>

                          {/* DUE DATE */}
                          <td style={{ color: "rgba(255,255,255,0.5)" }}>
                            {task.dueDate ? formatDate(task.dueDate) : "—"}
                          </td>

                          {/* ACTIONS */}
                          <td>
                            <div className="qca-table-actions" style={{ justifyContent: "flex-end" }}>
                              <Link className="qca-btn qca-btn-micro qca-btn-outline" to={`/dashboard/tasks/${task._id}`}>View</Link>
                              <Link className="qca-btn qca-btn-micro qca-btn-outline" to={`/dashboard/tasks/${task._id}/edit`}>Edit</Link>
                              {canManageTasks && (
                                <button 
                                  type="button" 
                                  className="qca-btn qca-btn-micro qca-btn-danger" 
                                  onClick={() => handleDelete(task._id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TasksList;