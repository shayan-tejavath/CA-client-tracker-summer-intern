import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getTaskById } from "../../services/taskService.js";

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTask = async () => {
      try {
        const data = await getTaskById(taskId);
        setTask(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load task details.");
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

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
            <h1>Task detail</h1>
            <p>See full task context, assignment, due date, and status information.</p>
          </div>
          <div className="page-tools">
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/tasks")}>Back to tasks</button>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading task information…</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="client-details-grid">
            <div className="detail-card wide-card">
              <p className="detail-label">Title</p>
              <p>{task.title}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Status</p>
              <p>{task.status}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Due date</p>
              <p>{formatDate(task.dueDate)}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Assigned to</p>
              <p>{task.assignedTo?.name || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Client</p>
              <p>{task.client?.clientName || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Service</p>
              <p>{task.service ? `${task.service.serviceCategory} — ${task.service.subService}` : "—"}</p>
            </div>
            <div className="detail-card wide-card">
              <p className="detail-label">Description</p>
              <p>{task.description || "No additional description provided."}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="page-actions">
            <Link className="button primary" to={`/dashboard/tasks/${taskId}/edit`}>Edit task</Link>
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/tasks")}>Back to tasks</button>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default TaskDetails;
