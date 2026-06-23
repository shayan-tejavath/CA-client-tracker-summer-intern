import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  CalendarRange,
  Users,
  FileText,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createTask } from "../../services/taskService.js";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { getServices } from "../../services/serviceService.js";

import "../../styles/createTask.css";

const statusOptions = ["Pending", "In Progress", "Completed", "Overdue"];
const priorityOptions = ["Low", "Medium", "High", "Critical"];

const CreateTask = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [task, setTask] = useState({
    title: "",
    client: "",
    service: "",
    assignedTo: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResources = async () => {
      try {
        const [clientData, employeeData, serviceData] = await Promise.all([
          getClients(),
          getEmployees(),
          getServices(),
        ]);
        console.log("[CreateTask] Loaded data:", { clientData, employeeData, serviceData });

        setClients(Array.isArray(clientData) ? clientData : clientData?.clients || []);
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);
      } catch (err) {
        console.error("[CreateTask] Error loading resources:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load resources."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTask((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await createTask(task);
      toast.success("Task created successfully.");
      navigate("/dashboard/tasks", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create task.");
      toast.error(err.response?.data?.message || "Unable to create task.");
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
            <h1 className="create-task-title">Create task</h1>
            <p className="create-task-subtitle">
              Assign a new task to an employee with clear client context, due date, and priority.
            </p>
          </div>

          <div className="create-task-hero-chip">
            <ClipboardList size={16} />
            Task intake
          </div>
        </section>

        <section className="create-task-grid">
          <div className="create-task-main-card">
            <div className="create-task-card-header">
              <div>
                <h2 className="create-task-card-title">Task details</h2>
                <p className="create-task-card-text">
                  Fill in the task fields and create a structured work item for your team.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="create-task-loading-state">
                <div className="create-task-loading-title">Preparing task form…</div>
                <div className="create-task-loading-text">
                  Loading clients, employees, and services.
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
                <div className="create-task-form-grid">
                  <div className="create-task-field create-task-field--full">
                    <label htmlFor="title">Task title</label>
                    <input
                      id="title"
                      name="title"
                      value={task.title}
                      onChange={handleChange}
                      placeholder="Write a task title"
                      required
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
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={task.priority}
                      onChange={handleChange}
                      className="create-task-select"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="create-task-field create-task-field--full">
                    <label htmlFor="dueDate">Due date</label>
                    <input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={task.dueDate}
                      onChange={handleChange}
                      required
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
                      placeholder="Optional task details"
                      rows="5"
                      className="create-task-textarea"
                    />
                  </div>
                </div>

                <div className="create-task-form-actions">
                  <button
                    type="button"
                    className="create-task-btn create-task-btn--secondary"
                    onClick={() => navigate("/dashboard/tasks")}
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
                    {saving ? (
                      <>
                        <CheckCircle2 size={16} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Create task
                      </>
                    )}
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
                <h3 className="create-task-side-title">Creation checklist</h3>
                <p className="create-task-side-text">
                  Keep the task clear, actionable, and easy for the assignee to complete.
                </p>
              </div>
            </div>

            <div className="create-task-side-list">
              <div className="create-task-side-item">
                <Users size={16} />
                Assign the correct employee for ownership.
              </div>
              <div className="create-task-side-item">
                <ClipboardList size={16} />
                Link the task to a client and service.
              </div>
              <div className="create-task-side-item">
                <FileText size={16} />
                Add a precise description for better execution.
              </div>
              <div className="create-task-side-item">
                <CheckCircle2 size={16} />
                Use the right status and priority from the start.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default CreateTask;