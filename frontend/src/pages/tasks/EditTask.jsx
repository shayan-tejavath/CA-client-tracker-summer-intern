import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getClients } from "../../services/clientService.js";
import { getEmployees } from "../../services/employeeService.js";
import { getServices } from "../../services/serviceService.js";
import { getTaskById, updateTask } from "../../services/taskService.js";

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
        setServices(serviceData);
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
      const payload = isEmployee
        ? { status: task.status }
        : task;

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
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tasks</p>
            <h1>Edit task</h1>
            <p>Update assignment, due date, and status for this task.</p>
          </div>
          <div className="page-tools">
            <button type="button" className="button secondary" onClick={() => navigate(`/dashboard/tasks/${taskId}`)}>Back to task</button>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading task details…</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Task title
              <input name="title" value={task.title} onChange={handleChange} placeholder="Task title" required disabled={isEmployee} />
            </label>
            <label>
              Client
              <select name="client" value={task.client} onChange={handleChange} required disabled={isEmployee}>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.clientName}</option>
                ))}
              </select>
            </label>
            <label>
              Service
              <select name="service" value={task.service} onChange={handleChange} required disabled={isEmployee}>
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>{`${service.serviceCategory} — ${service.subService}`}</option>
                ))}
              </select>
            </label>
            <label>
              Assign employee
              <select name="assignedTo" value={task.assignedTo} onChange={handleChange} required disabled={isEmployee}>
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
              Due date
              <input name="dueDate" type="date" value={task.dueDate} onChange={handleChange} required disabled={isEmployee} />
            </label>
            <label>
              Description
              <textarea name="description" value={task.description} onChange={handleChange} placeholder="Task description" rows="4" disabled={isEmployee} />
            </label>
            {isEmployee && (
              <div className="alert info">
                Employees may only update task status from this page.
              </div>
            )}
            {error && <div className="alert danger">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="button primary" disabled={saving}>
                {saving ? "Saving..." : "Update task"}
              </button>
              <button type="button" className="button secondary" onClick={() => navigate(`/dashboard/tasks/${taskId}`)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
};

export default EditTask;
