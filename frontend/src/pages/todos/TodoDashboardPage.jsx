import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  PencilLine,
  X,
  CalendarDays,
  UserRound,
  CircleDot,
  Check,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getEmployees } from "../../services/employeeService.js";
import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleTodoStatus,
  updateTodo,
} from "../../services/todoService.js";
import "../../styles/todo.css";

const STATUS_FILTERS = ["All", "Pending", "Hold", "In Progress", "Completed"];
const TABS = ["Today", "Upcoming", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB");
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const blankForm = {
  title: "",
  details: "",
  hasDueDate: true,
  dueDate: "",
  assignedTo: "",
  status: "Pending",
  priority: "Medium",
};

const StatusBadge = ({ status }) => (
  <span className={`todo-status todo-status--${String(status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
    {status || "Pending"}
  </span>
);

const TodoDashboardPage = () => {
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    statusCounts: {
      Pending: 0,
      Hold: 0,
      "In Progress": 0,
      Completed: 0,
    },
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("Today");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [form, setForm] = useState(blankForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todoData, employeeData] = await Promise.all([getTodos(), getEmployees()]);

      setTodos(Array.isArray(todoData?.todos) ? todoData.todos : []);
      setSummary(todoData?.summary || summary);

      const employeeList = Array.isArray(employeeData)
        ? employeeData
        : employeeData?.employees || employeeData?.data || [];
      setEmployees(employeeList);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load To-Do data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTodos = useMemo(() => {
    const q = search.trim().toLowerCase();

    return todos.filter((todo) => {
      if (activeTab === "Today") {
        const due = toDateInput(todo.dueDate);
        const today = toDateInput(new Date());
        if (due !== today) return false;
      }

      if (activeTab === "Upcoming") {
        const due = todo.dueDate ? new Date(todo.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!due || due <= today || todo.status === "Completed") return false;
      }

      if (activeTab === "Completed" && todo.status !== "Completed") {
        return false;
      }

      if (statusFilter !== "All" && todo.status !== statusFilter) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        todo.title,
        todo.details,
        todo.status,
        todo.priority,
        todo.assignedTo?.name,
        todo.assignedTo?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [activeTab, search, statusFilter, todos]);

  const openCreateModal = () => {
    setEditingTodo(null);
    setForm({
      ...blankForm,
      hasDueDate: true,
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setForm({
      title: todo.title || "",
      details: todo.details || "",
      hasDueDate: Boolean(todo.dueDate),
      dueDate: todo.dueDate ? toDateInput(todo.dueDate) : "",
      assignedTo: todo.assignedTo?._id || "",
      status: todo.status || "Pending",
      priority: todo.priority || "Medium",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTodo(null);
    setForm(blankForm);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!String(form.title || "").trim()) {
      toast.error("To-Do title is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        details: form.details.trim(),
        dueDate: form.hasDueDate && form.dueDate ? form.dueDate : null,
        assignedTo: form.assignedTo || null,
        status: form.status,
        priority: form.priority,
      };

      if (editingTodo?._id) {
        await updateTodo(editingTodo._id, payload);
        toast.success("To-Do updated successfully.");
      } else {
        await createTodo(payload);
        toast.success("To-Do created successfully.");
      }

      closeModal();
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save To-Do.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (todoId) => {
    const confirmDelete = window.confirm("Delete this To-Do?");
    if (!confirmDelete) return;

    try {
      await deleteTodo(todoId);
      toast.success("To-Do deleted successfully.");
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete To-Do.");
    }
  };

  const handleToggle = async (todoId) => {
    try {
      await toggleTodoStatus(todoId);
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update status.");
    }
  };

  const assignedName = (todo) => todo.assignedTo?.name || todo.assignedTo?.email || "Unassigned";

  return (
    <DashboardLayout>
      <div className="todo-page">
        <section className="todo-hero">
          <div>
            <div className="todo-eyebrow">To-Do</div>
            <h1 className="todo-title">Task board</h1>
            <p className="todo-subtitle">
              Track today, upcoming, and completed items with a clean team workflow.
            </p>
          </div>

          <div className="todo-hero-actions">
            <button type="button" className="todo-secondary-button" onClick={loadData}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button type="button" className="todo-primary-button" onClick={openCreateModal}>
              <Plus size={16} />
              New To-Do
            </button>
          </div>
        </section>

        <section className="todo-grid">
          <div className="todo-main-card">
            <div className="todo-card-header">
              <div>
                <h2>To-Do list</h2>
                <p>Manage your daily items and team assignments.</p>
              </div>

              <div className="todo-search-shell">
                <Search size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, details, user"
                />
              </div>
            </div>

            <div className="todo-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? "todo-tab active" : "todo-tab"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span>
                    {tab === "Today"
                      ? summary.todayCount
                      : tab === "Upcoming"
                        ? summary.upcomingCount
                        : summary.completedCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="todo-status-filters">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={statusFilter === status ? "todo-status-filter active" : "todo-status-filter"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="todo-empty-state">Loading To-Do items...</div>
            ) : filteredTodos.length === 0 ? (
              <div className="todo-empty-state">
                <ListTodo size={22} />
                <p>No To-Do items found.</p>
                <button type="button" className="todo-primary-button" onClick={openCreateModal}>
                  <Plus size={16} />
                  Create first To-Do
                </button>
              </div>
            ) : (
              <div className="todo-list">
                {filteredTodos.map((todo) => (
                  <article className="todo-item" key={todo._id}>
                    <div className="todo-item-left">
                      <button
                        type="button"
                        className="todo-check"
                        onClick={() => handleToggle(todo._id)}
                        aria-label="Toggle complete"
                        title="Mark complete"
                      >
                        {todo.status === "Completed" ? <CheckCircle2 size={18} /> : <CircleDot size={18} />}
                      </button>

                      <div className="todo-item-body">
                        <div className="todo-item-topline">
                          <h3>{todo.title}</h3>
                          <StatusBadge status={todo.status} />
                        </div>
                        <p>{todo.details || "No details added."}</p>

                        <div className="todo-item-meta">
                          <span>
                            <CalendarDays size={14} />
                            {todo.dueDate ? formatDate(todo.dueDate) : "No due date"}
                          </span>
                          <span>
                            <UserRound size={14} />
                            {assignedName(todo)}
                          </span>
                          <span>
                            <Clock3 size={14} />
                            {todo.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="todo-item-actions">
                      <button
                        type="button"
                        className="todo-icon-button"
                        onClick={() => openEditModal(todo)}
                        aria-label="Edit to-do"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        className="todo-icon-button danger"
                        onClick={() => handleDelete(todo._id)}
                        aria-label="Delete to-do"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="todo-side-card">
            <div className="todo-side-header">
              <h3>Summary</h3>
              <p>Quick status overview</p>
            </div>

            <div className="todo-summary-grid">
              <div className="todo-summary-card">
                <strong>{summary.total}</strong>
                <span>Total</span>
              </div>
              <div className="todo-summary-card">
                <strong>{summary.todayCount}</strong>
                <span>Today</span>
              </div>
              <div className="todo-summary-card">
                <strong>{summary.upcomingCount}</strong>
                <span>Upcoming</span>
              </div>
              <div className="todo-summary-card">
                <strong>{summary.completedCount}</strong>
                <span>Completed</span>
              </div>
            </div>

            <div className="todo-progress-list">
              {Object.entries(summary.statusCounts || {}).map(([label, count]) => {
                const width = summary.total ? Math.round((count / summary.total) * 100) : 0;
                return (
                  <div className="todo-progress-item" key={label}>
                    <div className="todo-progress-top">
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="todo-progress-bar">
                      <div className="todo-progress-fill" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        {modalOpen && (
          <div className="todo-modal-backdrop" onClick={closeModal} role="presentation">
            <form
              className="todo-modal"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSave}
            >
              <div className="todo-modal-header">
                <h2>{editingTodo ? "Edit To-Do" : "New To-Do"}</h2>
                <button type="button" className="todo-icon-button" onClick={closeModal} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="todo-modal-body">
                <label className="todo-field">
                  <span>To-Do *</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter to-do title"
                    required
                  />
                </label>

                <label className="todo-field">
                  <span>Details</span>
                  <textarea
                    value={form.details}
                    onChange={(e) => handleChange("details", e.target.value)}
                    placeholder="Add notes or details"
                    rows={4}
                  />
                </label>

                <label className="todo-checkline">
                  <input
                    type="checkbox"
                    checked={form.hasDueDate}
                    onChange={(e) => handleChange("hasDueDate", e.target.checked)}
                  />
                  <span>Set due date</span>
                </label>

                {form.hasDueDate && (
                  <label className="todo-field">
                    <span>Due date</span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleChange("dueDate", e.target.value)}
                    />
                  </label>
                )}

                <label className="todo-field">
                  <span>Assign to user</span>
                  <select
                    value={form.assignedTo}
                    onChange={(e) => handleChange("assignedTo", e.target.value)}
                  >
                    <option value="">Select user</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name || employee.email}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="todo-two-col">
                  <label className="todo-field">
                    <span>Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Hold">Hold</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>

                  <label className="todo-field">
                    <span>Priority</span>
                    <select
                      value={form.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="todo-modal-actions">
                <button type="button" className="todo-secondary-button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="todo-primary-button" disabled={saving}>
                  <Check size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TodoDashboardPage;