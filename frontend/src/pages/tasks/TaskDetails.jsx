import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getTaskById, postTaskComment } from "../../services/taskService.js";
import { useAuth } from "../../context/AuthContext.jsx";

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await postTaskComment(taskId, { text: commentText.trim() });
      const refreshed = await getTaskById(taskId);
      setTask(refreshed);
      setCommentText("");
    } catch (err) {
      // keep it simple: set error
      setError(err.response?.data?.message || "Unable to post comment.");
    } finally {
      setSubmitting(false);
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
          <>
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
          <div className="detail-card wide-card">
            <p className="detail-label">Comments</p>
            <div className="comments-list">
              {task.comments && task.comments.length === 0 && <p>No comments yet.</p>}
              {task.comments && task.comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <p className="comment-meta"><strong>{c.author?.name || c.author?.email || 'User'}</strong> — <span className="muted">{new Date(c.createdAt).toLocaleString()}</span></p>
                  <p className="comment-text">{c.text}</p>
                </div>
              ))}

              <form onSubmit={handleCommentSubmit} className="form-stack">
                <label>
                  Add comment
                  <textarea name="comment" rows="3" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment" />
                </label>
                <div className="form-actions">
                  <button type="submit" className="button primary" disabled={submitting || !commentText.trim()}>
                    {submitting ? 'Posting...' : 'Post comment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          </>
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
