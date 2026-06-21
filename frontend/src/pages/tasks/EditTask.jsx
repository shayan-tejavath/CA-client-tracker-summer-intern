import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  CalendarRange,
  Lock,
  PencilLine,
  Users,
  FileText,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { getServices } from "../../services/serviceService.js";
import { getTaskById, updateTask } from "../../services/taskService.js";

import "../../styles/createTask.css";

const statusOptions = ["Pending", "In Progress", "Completed", "Overdue"];

const EditTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEmployee = user?.role === "Employee";

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientData, employeeData, serviceData, taskData] = await Promise.all([
          getClients(),
          getEmployees(),
          getServices(),
          getTaskById(taskId),
        ]);

        setClients(Array.isArray(clientData) ? clientData : clientData?.clients || []);
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);

        setTask({
          title: taskData.title || "",
          client: taskData.client?._id || "",
          service: taskData.service?._id || "",
          assignedTo: taskData.assignedTo?._id || "",
          status: taskData.status || "Pending",
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split("T")[0] : "",
          description: taskData.description || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load task details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTask((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = isEmployee ? { status: task.status } : task;

      await updateTask(taskId, payload);
      toast.success("Task updated successfully.");
      navigate(`/dashboard/tasks/${taskId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update task.");
      toast.error(err.response?.data?.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="create-task-page">
        <section className="create-task-hero">
          <div className="create-task-hero-copy">
            <div className="create-task-eyebrow">Tasks</div>
            <h1 className="create-task-title">Edit task</h1>
            <p className="create-task-subtitle">
              Update assignment, due date, and status in a clean enterprise layout.
            </p>
          </div>

          <div className="create-task-hero-chip">
            <PencilLine size={16} />
            Task editing
          </div>
        </section>

        <section className="create-task-grid">
          <div className="create-task-main-card">
            <div className="create-task-card-header">
              <div>
                <h2 className="create-task-card-title">Task details</h2>
                <p className="create-task-card-text">
                  Adjust the task information below. Employees can only update status.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="create-task-loading-state">
                <div className="create-task-loading-title">Loading task details…</div>
                <div className="create-task-loading-text">
                  Fetching clients, services, employees, and current task data.
                </div>
                <div className="create-task-skeleton-grid">
                  <div className="create-task-skeleton-block" />
                  <div className="create-task-skeleton-block" />
                  <div className="create-task-skeleton-block" />
                  <div className="create-task-skeleton-block" />
                </div>
              </div>
            ) : error ? (
              <div className="create-task-alert" role="alert">
                {error}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="create-task-form">
                {isEmployee && (
                  <div className="create-task-lock-banner">
                    <Lock size={16} />
                    Employees may only update task status from this page.
                  </div>
                )}

                <div className="create-task-form-grid">
                  <div className="create-task-field create-task-field--full">
                    <label htmlFor="title">Task title</label>
                    <input
                      id="title"
                      name="title"
                      value={task.title}
                      onChange={handleChange}
                      placeholder="Task title"
                      required
                      disabled={isEmployee}
                      className="create-task-input"
                    />
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="client">Client</label>
                    <select
                      id="client"
                      name="client"
                      value={task.client}
                      onChange={handleChange}
                      required
                      disabled={isEmployee}
                      className="create-task-select"
                    >
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="service">Service</label>
                    <select
                      id="service"
                      name="service"
                      value={task.service}
                      onChange={handleChange}
                      required
                      disabled={isEmployee}
                      className="create-task-select"
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {`${service.serviceCategory} — ${service.subService}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="assignedTo">Assign employee</label>
                    <select
                      id="assignedTo"
                      name="assignedTo"
                      value={task.assignedTo}
                      onChange={handleChange}
                      required
                      disabled={isEmployee}
                      className="create-task-select"
                    >
                      <option value="">Choose employee</option>
                      {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={task.status}
                      onChange={handleChange}
                      className="create-task-select"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="create-task-field">
                    <label htmlFor="dueDate">Due date</label>
                    <input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={task.dueDate}
                      onChange={handleChange}
                      required
                      disabled={isEmployee}
                      className="create-task-input"
                    />
                  </div>

                  <div className="create-task-field create-task-field--full">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={task.description}
                      onChange={handleChange}
                      placeholder="Task description"
                      rows="5"
                      disabled={isEmployee}
                      className="create-task-textarea"
                    />
                  </div>
                </div>

                <div className="create-task-form-actions">
                  <button
                    type="button"
                    className="create-task-btn create-task-btn--secondary"
                    onClick={() => navigate(`/dashboard/tasks/${taskId}`)}
                    disabled={saving}
                  >
                    <ArrowLeft size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-task-btn create-task-btn--primary"
                    disabled={saving}
                  >
                    <CheckCircle2 size={16} />
                    {saving ? "Saving..." : "Update task"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="create-task-side-card">
            <div className="create-task-side-top">
              <div className="create-task-side-icon">
                <CalendarRange size={18} />
              </div>
              <div>
                <h3 className="create-task-side-title">Editing checklist</h3>
                <p className="create-task-side-text">
                  Keep the task structured and make only the necessary changes.
                </p>
              </div>
            </div>

            <div className="create-task-side-list">
              <div className="create-task-side-item">
                <Users size={16} />
                Check whether the assignee should be changed.
              </div>
              <div className="create-task-side-item">
                <ClipboardList size={16} />
                Confirm the task still belongs to the right client and service.
              </div>
              <div className="create-task-side-item">
                <FileText size={16} />
                Keep the description concise and execution-focused.
              </div>
              <div className="create-task-side-item">
                <CheckCircle2 size={16} />
                Update status carefully if you are working as an employee.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default EditTask;