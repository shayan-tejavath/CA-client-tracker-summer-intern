import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createTask } from "../../services/taskService.js";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { getServices } from "../../services/serviceService.js";

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
        setClients(clientData || []);
        setEmployees(employeeData || []);
        setServices(serviceData || []);
      } catch (err) {
        console.error("[CreateTask] Error loading resources:", err);
        setError(err.response?.data?.message || "Unable to load resources.");
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
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tasks</p>
            <h1>Create task</h1>
            <p>Assign a new task to an employee with a due date and client context.</p>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading form options…</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Task title
              <input name="title" value={task.title} onChange={handleChange} placeholder="Write a task title" required />
            </label>
            <label>
              Client
              <select name="client" value={task.client} onChange={handleChange} required>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.clientName}</option>
                ))}
              </select>
            </label>
            <label>
              Service
              <select name="service" value={task.service} onChange={handleChange} required>
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>{`${service.serviceCategory} — ${service.subService}`}</option>
                ))}
              </select>
            </label>
            <label>
              Assign employee
              <select name="assignedTo" value={task.assignedTo} onChange={handleChange} required>
                <option value="">Choose employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>{employee.name}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={task.status} onChange={handleChange}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select name="priority" value={task.priority} onChange={handleChange}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" value={task.dueDate} onChange={handleChange} required />
            </label>
            <label>
              Description
              <textarea name="description" value={task.description} onChange={handleChange} placeholder="Optional task details" rows="4" />
            </label>
            {error && <div className="alert danger">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="button primary" disabled={saving}>
                {saving ? "Creating..." : "Create task"}
              </button>
              <button type="button" className="button secondary" onClick={() => navigate("/dashboard/tasks")}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
};

export default CreateTask;
