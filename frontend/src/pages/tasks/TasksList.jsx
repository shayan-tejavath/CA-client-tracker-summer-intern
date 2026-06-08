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
        accent: "#38bdf8",
      },
      {
        key: "pending",
        label: "Pending Tasks",
        value: counts.pending,
        icon: <HiOutlineClock />, 
        accent: "#fbbf24",
      },
      {
        key: "inProgress",
        label: "In Progress Tasks",
        value: counts.inProgress,
        icon: <HiOutlineRefresh />, 
        accent: "#93c5fd",
      },
      {
        key: "completed",
        label: "Completed Tasks",
        value: counts.completed,
        icon: <HiOutlineCheckCircle />, 
        accent: "#34d399",
      },
      {
        key: "overdue",
        label: "Overdue Tasks",
        value: counts.overdue,
        icon: <HiOutlineExclamationCircle />, 
        accent: "#fb7185",
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
        setTasks(taskData);
        setEmployees(employeeData);
        
        // Extract unique clients from tasks
        const clientsMap = new Map();
        taskData.forEach((task) => {
          if (task.client && task.client._id) {
            if (!clientsMap.has(task.client._id)) {
              clientsMap.set(task.client._id, task.client);
            }
          }
        });
        setClients(Array.from(clientsMap.values()));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load tasks.");
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
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tasks</p>
            <h1>Task inbox</h1>
            <p>Filter and manage your team’s open work, due dates, and assignments.</p>
          </div>
          {canCreateTask && (
            <div className="page-tools">
              <button type="button" className="button secondary" onClick={() => navigate("/dashboard/tasks/add")}>Create task</button>
            </div>
          )}
        </div>

        <div className="stats-grid">
          {taskStats.map((item) => (
            <div key={item.key} className="stats-card">
              <div className="stats-card-icon" style={{ backgroundColor: item.accent + "20", color: item.accent }}>
                {item.icon}
              </div>
              <p className="stats-card-label">{item.label}</p>
              <h2 className="stats-card-value">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="task-filters">
          <div className="filter-item">
            <label>
              Search tasks
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, client, service or assignee" />
            </label>
          </div>
          <div className="filter-item">
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="filter-item">
            <label>
              Assigned employee
              <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>{employee.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="filter-item">
            <label>
              Client
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.clientName}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading tasks...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due date</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8">No tasks match the current filters.</td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <button type="button" className="link-button" onClick={() => navigate(`/dashboard/tasks/${task._id}`)}>
                          {task.title}
                        </button>
                      </td>
                      <td>{task.client?.clientName || "—"}</td>
                      <td>{task.service ? `${task.service.serviceCategory} — ${task.service.subService}` : "—"}</td>
                      <td>{task.assignedTo?.name || "—"}</td>
                      <td>{task.status}</td>
                      <td>
                        <span className={`priority-badge ${task.priority ? "priority-" + task.priority.toLowerCase() : ""}`}>
                          {task.priority || "—"}
                        </span>
                      </td>
                      <td>{task.dueDate ? formatDate(task.dueDate) : "—"}</td>
                      <td className="actions-cell">
                        <Link className="button secondary small" to={`/dashboard/tasks/${task._id}`}>View</Link>
                        <Link className="button secondary small" to={`/dashboard/tasks/${task._id}/edit`}>Edit</Link>
                        {canManageTasks && (
                          <button type="button" className="button danger small" onClick={() => handleDelete(task._id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default TasksList;
