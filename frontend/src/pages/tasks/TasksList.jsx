import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  ClipboardList,
  Clock3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Eye,
  PencilLine,
  Trash2,
  ChevronDown,
  UserRound,
  Building2,
} from "lucide-react";
import { deleteTask, getTasks } from "../../services/taskService.js";
import { getEmployees } from "../../services/employeeService.js";

import "../../styles/tasksList.css";

const statusOptions = ["Pending", "In Progress", "Completed", "Overdue"];

const getToneClass = (value) => {
  const normalized = (value || "").toLowerCase();

  if (["completed", "low"].includes(normalized)) return "success";
  if (["pending", "medium"].includes(normalized)) return "warning";
  if (["overdue", "high"].includes(normalized)) return "danger";
  if (["in progress"].includes(normalized)) return "info";

  return "neutral";
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
        icon: ClipboardList,
        tone: "primary",
      },
      {
        key: "pending",
        label: "Pending",
        value: counts.pending,
        icon: Clock3,
        tone: "warning",
      },
      {
        key: "inProgress",
        label: "In Progress",
        value: counts.inProgress,
        icon: RefreshCw,
        tone: "info",
      },
      {
        key: "completed",
        label: "Completed",
        value: counts.completed,
        icon: CheckCircle2,
        tone: "success",
      },
      {
        key: "overdue",
        label: "Overdue",
        value: counts.overdue,
        icon: AlertCircle,
        tone: "danger",
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
      if (statusFilter && task.status !== statusFilter) return false;
      if (employeeFilter && task.assignedTo?._id !== employeeFilter) return false;
      if (clientFilter && task.client?._id !== clientFilter) return false;
      if (!normalized) return true;

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
      <div className="tasks-page">
        <section className="tasks-hero">
          <div className="tasks-hero-copy">
            <div className="tasks-eyebrow">Tasks</div>
            <h1 className="tasks-title">Task Inbox</h1>
            <p className="tasks-subtitle">
              Filter and manage your team’s open work, due dates, and assignments in a clean enterprise workflow.
            </p>
          </div>

          {canCreateTask && (
            <button
              type="button"
              className="tasks-primary-action"
              onClick={() => navigate("/dashboard/tasks/add")}
            >
              <Plus size={18} />
              Create Task
            </button>
          )}
        </section>

        <section className="tasks-stats-grid" aria-label="Task summary">
          {taskStats.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.key} className={`tasks-stat-card tasks-stat-card--${item.tone}`}>
                <div className="tasks-stat-top">
                  <div className="tasks-stat-icon">
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <div className="tasks-stat-chip">Live</div>
                </div>
                <div className="tasks-stat-label">{item.label}</div>
                <div className="tasks-stat-value">{item.value}</div>
              </article>
            );
          })}
        </section>

        <section className="tasks-filters-card">
          <div className="tasks-toolbar-header">
            <div>
              <h2 className="tasks-section-title">Filters</h2>
              <p className="tasks-section-text">
                Search, narrow by status, and quickly locate work by client or assignee.
              </p>
            </div>
          </div>

          <div className="tasks-filter-grid">
            <div className="tasks-field tasks-field--search">
              <label htmlFor="task-search">Search tasks</label>
              <div className="tasks-search-shell">
                <Search className="tasks-search-icon" size={18} />
                <input
                  id="task-search"
                  type="search"
                  className="tasks-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, client, or assignee..."
                />
              </div>
            </div>

            <div className="tasks-field">
              <label htmlFor="status-filter">Status</label>
              <div className="tasks-select-shell">
                <select
                  id="status-filter"
                  className="tasks-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="tasks-select-icon" size={16} />
              </div>
            </div>

            <div className="tasks-field">
              <label htmlFor="employee-filter">Assigned employee</label>
              <div className="tasks-select-shell">
                <select
                  id="employee-filter"
                  className="tasks-select"
                  value={employeeFilter}
                  onChange={(event) => setEmployeeFilter(event.target.value)}
                >
                  <option value="">All employees</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="tasks-select-icon" size={16} />
              </div>
            </div>

            <div className="tasks-field">
              <label htmlFor="client-filter">Client</label>
              <div className="tasks-select-shell">
                <select
                  id="client-filter"
                  className="tasks-select"
                  value={clientFilter}
                  onChange={(event) => setClientFilter(event.target.value)}
                >
                  <option value="">All clients</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.clientName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="tasks-select-icon" size={16} />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="tasks-loading-card">
            <div className="tasks-loading-title">Loading tasks…</div>
            <div className="tasks-loading-text">Fetching task, client, and employee data.</div>
            <div className="tasks-loading-grid">
              <div className="tasks-skeleton-card" />
              <div className="tasks-skeleton-card" />
              <div className="tasks-skeleton-card" />
              <div className="tasks-skeleton-card" />
            </div>
          </section>
        ) : error ? (
          <section className="tasks-alert" role="alert">
            {error}
          </section>
        ) : (
          <section className="tasks-table-card">
            <div className="tasks-table-shell">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Client / Service</th>
                    <th>Assigned to</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due date</th>
                    <th className="tasks-actions-head">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="tasks-empty-state">
                          <div className="tasks-empty-icon">
                            <Building2 size={20} />
                          </div>
                          <h3>No tasks match the current filters</h3>
                          <p>
                            Try another status, client, or assignee to surface the work you need.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const statusTone = getToneClass(task.status);
                      const priorityTone = getToneClass(task.priority);

                      return (
                        <tr key={task._id}>
                          <td>
                            <button
                              type="button"
                              className="tasks-link-button"
                              onClick={() => navigate(`/dashboard/tasks/${task._id}`)}
                            >
                              {task.title}
                            </button>
                          </td>

                          <td className="tasks-client-cell">
                            <div className="tasks-client-name">
                              {task.client?.clientName || "—"}
                            </div>
                            <div className="tasks-client-meta">
                              {task.service
                                ? `${task.service.serviceCategory} — ${task.service.subService}`
                                : "No service linked"}
                            </div>
                          </td>

                          <td>
                            <div className="tasks-person-cell">
                              <UserRound size={16} />
                              <span>{task.assignedTo?.name || "—"}</span>
                            </div>
                          </td>

                          <td>
                            <span className={`tasks-pill tasks-pill--${statusTone}`}>
                              {task.status}
                            </span>
                          </td>

                          <td>
                            <span className={`tasks-pill tasks-pill--${priorityTone}`}>
                              {task.priority || "—"}
                            </span>
                          </td>

                          <td className="tasks-date-cell">
                            {task.dueDate ? formatDate(task.dueDate) : "—"}
                          </td>

                          <td>
                            <div className="tasks-row-actions">
                              <Link
                                className="tasks-action tasks-action--outline"
                                to={`/dashboard/tasks/${task._id}`}
                              >
                                <Eye size={16} />
                                View
                              </Link>

                              <Link
                                className="tasks-action tasks-action--outline"
                                to={`/dashboard/tasks/${task._id}/edit`}
                              >
                                <PencilLine size={16} />
                                Edit
                              </Link>

                              {canManageTasks && (
                                <button
                                  type="button"
                                  className="tasks-action tasks-action--danger"
                                  onClick={() => handleDelete(task._id)}
                                >
                                  <Trash2 size={16} />
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
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TasksList;