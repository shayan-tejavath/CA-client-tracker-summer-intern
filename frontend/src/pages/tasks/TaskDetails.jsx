import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getTaskById, postTaskComment } from "../../services/taskService.js";
import { useAuth } from "../../context/AuthContext.jsx";

import "../../styles/taskDetails.css";

const getStatusTone = (status) => {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") return "success";
  if (normalized === "pending") return "warning";
  if (normalized === "in progress") return "info";
  if (normalized === "overdue") return "danger";
  return "neutral";
};

const getStatusIcon = (status) => {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") return CheckCircle2;
  if (normalized === "pending") return Clock3;
  if (normalized === "in progress") return RefreshCw;
  if (normalized === "overdue") return ShieldAlert;
  return FileText;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      setError(err.response?.data?.message || "Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const taskComments = Array.isArray(task?.comments) ? task.comments : [];
  const StatusIcon = getStatusIcon(task?.status);

  return (
    <DashboardLayout>
      <div className="task-details-page">
        <section className="task-details-hero">
          <div className="task-details-hero-copy">
            <div className="task-details-eyebrow">Tasks</div>
            <h1 className="task-details-title">Task detail</h1>
            <p className="task-details-subtitle">
              See the full task context, assignment, due date, status, and discussion history.
            </p>
          </div>

          <div className="task-details-hero-actions">
            <button
              type="button"
              className="task-details-btn task-details-btn--secondary"
              onClick={() => navigate("/dashboard/tasks")}
            >
              <ArrowLeft size={16} />
              Back to tasks
            </button>

            <Link
              className="task-details-btn task-details-btn--primary"
              to={`/dashboard/tasks/${taskId}/edit`}
            >
              <PencilLine size={16} />
              Edit task
            </Link>
          </div>
        </section>

        {loading ? (
          <section className="task-details-loading-card">
            <div className="task-details-loading-title">Loading task information…</div>
            <div className="task-details-loading-text">
              Fetching the latest task context and comments.
            </div>
            <div className="task-details-loading-grid">
              <div className="task-details-skeleton" />
              <div className="task-details-skeleton" />
              <div className="task-details-skeleton" />
              <div className="task-details-skeleton" />
            </div>
          </section>
        ) : error ? (
          <section className="task-details-alert" role="alert">
            {error}
          </section>
        ) : (
          <>
            <section className="task-details-grid">
              <article className="task-details-card task-details-card--wide">
                <div className="task-details-card-head">
                  <div>
                    <div className="task-details-card-kicker">Task title</div>
                    <h2 className="task-details-card-title">{task.title}</h2>
                  </div>

                  <div className={`task-details-status task-details-status--${getStatusTone(task.status)}`}>
                    <StatusIcon size={16} />
                    {task.status}
                  </div>
                </div>
              </article>

              <article className="task-details-card">
                <div className="task-details-card-kicker">Due date</div>
                <div className="task-details-metric">{formatDate(task.dueDate)}</div>
                <div className="task-details-card-note">Scheduled completion timeline</div>
              </article>

              <article className="task-details-card">
                <div className="task-details-card-kicker">Assigned to</div>
                <div className="task-details-person">
                  <UserRound size={16} />
                  <span>{task.assignedTo?.name || "—"}</span>
                </div>
                <div className="task-details-card-note">Current owner</div>
              </article>

              <article className="task-details-card">
                <div className="task-details-card-kicker">Client</div>
                <div className="task-details-person">
                  <Users size={16} />
                  <span>{task.client?.clientName || "—"}</span>
                </div>
                <div className="task-details-card-note">Client account linked to task</div>
              </article>

              <article className="task-details-card">
                <div className="task-details-card-kicker">Service</div>
                <div className="task-details-person">
                  <FileText size={16} />
                  <span>
                    {task.service
                      ? `${task.service.serviceCategory} — ${task.service.subService}`
                      : "—"}
                  </span>
                </div>
                <div className="task-details-card-note">Service mapping</div>
              </article>

              <article className="task-details-card">
                <div className="task-details-card-kicker">Comments</div>
                <div className="task-details-metric">{taskComments.length}</div>
                <div className="task-details-card-note">Discussion entries so far</div>
              </article>

              <article className="task-details-card task-details-card--wide">
                <div className="task-details-section-head">
                  <div>
                    <div className="task-details-card-kicker">Description</div>
                    <h3 className="task-details-section-title">Task context</h3>
                  </div>
                  <CalendarRange size={18} className="task-details-section-icon" />
                </div>
                <p className="task-details-description">
                  {task.description || "No additional description provided."}
                </p>
              </article>
            </section>

            <section className="task-details-comments-card">
              <div className="task-details-section-head task-details-comments-head">
                <div>
                  <div className="task-details-card-kicker">Comments</div>
                  <h3 className="task-details-section-title">Discussion thread</h3>
                </div>
                <MessageSquareText size={18} className="task-details-section-icon" />
              </div>

              <div className="task-details-comments-list">
                {taskComments.length === 0 ? (
                  <div className="task-details-empty-comments">
                    <div className="task-details-empty-icon">
                      <MessageSquareText size={20} />
                    </div>
                    <h4>No comments yet</h4>
                    <p>Start the conversation by adding a comment below.</p>
                  </div>
                ) : (
                  taskComments.map((c) => (
                    <article key={c._id} className="task-details-comment-card">
                      <div className="task-details-comment-avatar">
                        {(c.author?.name || c.author?.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="task-details-comment-content">
                        <div className="task-details-comment-meta">
                          <div className="task-details-comment-author">
                            {c.author?.name || c.author?.email || "User"}
                          </div>
                          <div className="task-details-comment-date">
                            {formatDateTime(c.createdAt)}
                          </div>
                        </div>
                        <p className="task-details-comment-text">{c.text}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="task-details-comment-form">
                <div className="task-details-form-head">
                  <div>
                    <div className="task-details-card-kicker">Add comment</div>
                    <h3 className="task-details-section-title">Write a response</h3>
                  </div>
                </div>

                <div className="task-details-field">
                  <label htmlFor="commentText">Comment</label>
                  <textarea
                    id="commentText"
                    name="comment"
                    rows="4"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment"
                    className="task-details-textarea"
                  />
                </div>

                <div className="task-details-form-actions">
                  <button
                    type="button"
                    className="task-details-btn task-details-btn--secondary"
                    onClick={() => navigate("/dashboard/tasks")}
                  >
                    Back to tasks
                  </button>

                  <button
                    type="submit"
                    className="task-details-btn task-details-btn--primary"
                    disabled={submitting || !commentText.trim()}
                  >
                    {submitting ? "Posting..." : "Post comment"}
                  </button>
                </div>
              </form>
            </section>

            <div className="task-details-bottom-actions">
              <Link
                className="task-details-btn task-details-btn--primary"
                to={`/dashboard/tasks/${taskId}/edit`}
              >
                <PencilLine size={16} />
                Edit task
              </Link>
              <button
                type="button"
                className="task-details-btn task-details-btn--secondary"
                onClick={() => navigate("/dashboard/tasks")}
              >
                <ArrowLeft size={16} />
                Back to tasks
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaskDetails;