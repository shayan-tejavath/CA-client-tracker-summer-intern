import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Users,
  CheckSquare2,
  ListTodo,
  Calendar,
  Paperclip,
  History,
  AlertCircle,
  Zap,
  Circle,
  Trash2,
  Plus,
  FileUp,
  Download,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  getTaskById,
  postTaskComment,
  getSubTasks,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  getTaskDocuments,
  uploadTaskDocument,
  deleteTaskDocument,
  getTaskActivities,
  getTaskDocumentRequests,
  createTaskDocumentRequest,
  updateTaskDocumentRequestStatus,
} from "../../services/taskService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import ChecklistSection from "../../components/tasks/ChecklistSection.jsx";

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

const progressStages = [
  { label: "Created", key: "created" },
  { label: "Assigned", key: "assigned" },
  { label: "In Progress", key: "inProgress" },
  { label: "Under Review", key: "underReview" },
  { label: "Completed", key: "completed" },
];

const getProgressStageIndex = (status) => {
  const normalized = (status || "").toLowerCase();

  if (normalized === "completed") return 4;
  if (normalized === "in progress") return 2;
  if (normalized === "overdue") return 3;
  if (normalized === "pending") return 0;

  return 1;
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
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDescription, setSubtaskDescription] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [subtaskError, setSubtaskError] = useState("");
  const [subtaskSubmitting, setSubtaskSubmitting] = useState(false);
  const [subtaskLoading, setSubtaskLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentError, setDocumentError] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
  const [requestDocumentInput, setRequestDocumentInput] = useState("");
  const [requestedDocuments, setRequestedDocuments] = useState([]);
  const [documentRequestSubmitting, setDocumentRequestSubmitting] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const data = await getTaskById(taskId);
        setTask(data);
        const subtaskData = await getSubTasks(taskId);
        setSubtasks(Array.isArray(subtaskData) ? subtaskData : []);
        const documentsData = await getTaskDocuments(taskId);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
        const requestsData = await getTaskDocumentRequests(taskId);
        setDocumentRequests(Array.isArray(requestsData) ? requestsData : []);
        const activitiesData = await getTaskActivities(taskId);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load task details.");
      } finally {
        setLoading(false);
        setSubtaskLoading(false);
        setDocumentsLoading(false);
        setActivitiesLoading(false);
      }
    };

    setSubtaskLoading(true);
    setSubtaskError("");
    setSubtasks([]);
    setDocuments([]);
    setDocumentsLoading(true);
    setActivities([]);
    setActivitiesLoading(true);
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
  const canEditSubtasks = user?.role !== "Client";
  const canManageDocuments = true;
  const canRequestDocuments = user?.role !== "Client";
  const canUploadRequestedDocuments = true;

  const resetSubtaskForm = () => {
    setSubtaskTitle("");
    setSubtaskDescription("");
    setEditingSubtaskId(null);
  };

  const refreshDocumentsAndRequests = async () => {
    const [documentsData, requestsData] = await Promise.all([
      getTaskDocuments(taskId),
      getTaskDocumentRequests(taskId),
    ]);
    setDocuments(Array.isArray(documentsData) ? documentsData : []);
    setDocumentRequests(Array.isArray(requestsData) ? requestsData : []);
  };

  const handleDocumentRequestSubmit = async (event) => {
    event.preventDefault();
    const trimmed = requestDocumentInput.trim();
    if (!trimmed) return;

    setRequestedDocuments((current) => {
      if (current.includes(trimmed)) return current;
      return [...current, trimmed];
    });
    setRequestDocumentInput("");
  };

  const removeRequestedDocument = (documentName) => {
    setRequestedDocuments((current) => current.filter((item) => item !== documentName));
  };

  const submitDocumentRequest = async () => {
    if (!requestedDocuments.length) {
      setDocumentError("Select at least one required document.");
      return;
    }

    setDocumentRequestSubmitting(true);
    setDocumentError("");

    try {
      await createTaskDocumentRequest(taskId, {
        requiredDocuments: requestedDocuments,
      });
      const requestsData = await getTaskDocumentRequests(taskId);
      setDocumentRequests(Array.isArray(requestsData) ? requestsData : []);
      setRequestedDocuments([]);
      setShowDocumentRequestModal(false);
      setDocumentError("");
    } catch (err) {
      setDocumentError(err.response?.data?.message || "Unable to save document request.");
    } finally {
      setDocumentRequestSubmitting(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setDocumentError("Please choose a file to upload.");
      return;
    }

    setDocumentUploading(true);
    setDocumentError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await uploadTaskDocument(taskId, formData);
      await refreshDocumentsAndRequests();
      setSelectedFile(null);
      setDocumentError("");
      if (event.currentTarget?.querySelector) {
        const fileInput = event.currentTarget.querySelector("input[type='file']");
        if (fileInput) fileInput.value = "";
      }
    } catch (err) {
      setDocumentError(err.response?.data?.message || "Unable to upload document.");
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleSubtaskSubmit = async (event) => {
    event.preventDefault();
    if (!subtaskTitle.trim()) {
      setSubtaskError("Please enter a sub-task title.");
      return;
    }

    setSubtaskSubmitting(true);
    setSubtaskError("");

    try {
      if (editingSubtaskId) {
        await updateSubTask(taskId, editingSubtaskId, {
          title: subtaskTitle.trim(),
          description: subtaskDescription.trim(),
        });
      } else {
        await createSubTask(taskId, {
          title: subtaskTitle.trim(),
          description: subtaskDescription.trim(),
        });
      }

      const refreshed = await getSubTasks(taskId);
      setSubtasks(Array.isArray(refreshed) ? refreshed : []);
      resetSubtaskForm();
    } catch (err) {
      setSubtaskError(err.response?.data?.message || "Unable to save sub-task.");
    } finally {
      setSubtaskSubmitting(false);
    }
  };

  const handleSubtaskToggle = async (subtask) => {
    try {
      const updated = await updateSubTask(taskId, subtask._id, {
        completed: !subtask.completed,
      });
      setSubtasks((current) =>
        current.map((item) => (item._id === subtask._id ? updated : item))
      );
    } catch (err) {
      setSubtaskError(err.response?.data?.message || "Unable to update sub-task.");
    }
  };

  const handleSubtaskEdit = (subtask) => {
    setEditingSubtaskId(subtask._id);
    setSubtaskTitle(subtask.title || "");
    setSubtaskDescription(subtask.description || "");
    setSubtaskError("");
  };

  const handleSubtaskDelete = async (subtaskId) => {
    if (!window.confirm("Remove this sub-task?")) return;

    try {
      await deleteSubTask(taskId, subtaskId);
      setSubtasks((current) => current.filter((item) => item._id !== subtaskId));
      if (editingSubtaskId === subtaskId) {
        resetSubtaskForm();
      }
    } catch (err) {
      setSubtaskError(err.response?.data?.message || "Unable to delete sub-task.");
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await deleteTaskDocument(taskId, documentId);
      setDocuments((current) => current.filter((document) => document._id !== documentId));
    } catch (err) {
      setDocumentError(err.response?.data?.message || "Unable to delete document.");
    }
  };

  return (
    <DashboardLayout>
      <div className="task-details-page">
        {/* HEADER */}
        <section className="task-details-hero">
          <div className="task-details-hero-copy">
            <div className="task-details-eyebrow">Tasks</div>
            <h1 className="task-details-title">Task detail</h1>
            <p className="task-details-subtitle">
              Manage task progress, track deliverables, and collaborate with your team.
            </p>
          </div>

          <div className="task-details-hero-actions">
            <button
              type="button"
              className="task-details-btn task-details-btn--secondary"
              onClick={() => navigate("/dashboard/tasks")}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {task && (
              <Link
                className="task-details-btn task-details-btn--primary"
                to={`/dashboard/tasks/${taskId}/edit`}
              >
                <PencilLine size={16} />
                Edit
              </Link>
            )}
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
            <section className="task-progress-timeline-card" aria-label="Task progress timeline">
              <div className="task-progress-timeline">
                {progressStages.map((stage, index) => {
                  const stageIndex = getProgressStageIndex(task?.status);
                  const isCompleted = index < stageIndex;
                  const isActive = index === stageIndex;

                  return (
                    <div
                      key={stage.key}
                      className={`task-progress-step ${isCompleted ? "task-progress-step--done" : ""} ${isActive ? "task-progress-step--active" : ""}`}
                    >
                      <div className="task-progress-step-indicator">
                        {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                      </div>
                      <div className="task-progress-step-label">{stage.label}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TASK SUMMARY CARD */}
            <article className="task-details-card task-details-card--summary">
              <div className="task-summary-header">
                <div className="task-summary-title-block">
                  <h2 className="task-summary-title">{task.title}</h2>
                  <div className={`task-summary-status task-summary-status--${getStatusTone(task.status)}`}>
                    <StatusIcon size={14} />
                    {task.status}
                  </div>
                </div>
                <div className="task-summary-meta">
                  <div className="task-summary-item">
                    <span className="task-summary-label">Priority</span>
                    <span className="task-summary-value">{task.priority || "Medium"}</span>
                  </div>
                  <div className="task-summary-divider" />
                  <div className="task-summary-item">
                    <span className="task-summary-label">Progress</span>
                    <span className="task-summary-value">{task.progress || "0"}%</span>
                  </div>
                </div>
              </div>
              {task.description && (
                <p className="task-summary-description">{task.description}</p>
              )}
            </article>

            {/* MAIN GRID */}
            <div className="task-details-dashboard-grid">
              {/* LEFT COLUMN */}
              <div className="task-details-dashboard-col">
                {/* TIMELINE */}
                <article className="task-details-card task-details-card--timeline">
                  <div className="task-card-header">
                    <div>
                      <h3 className="task-card-title">Progress Timeline</h3>
                      <p className="task-card-description">Track task milestones</p>
                    </div>
                    <Zap size={20} className="task-card-icon" />
                  </div>
                  <div className="task-timeline">
                    <div className="task-timeline-item">
                      <div className="task-timeline-dot task-timeline-dot--completed" />
                      <div className="task-timeline-content">
                        <div className="task-timeline-title">Task Created</div>
                        <div className="task-timeline-date">{formatDateTime(task.createdAt)}</div>
                      </div>
                    </div>
                    <div className="task-timeline-item">
                      <div className={`task-timeline-dot task-timeline-dot--${task.status === "In Progress" ? "active" : "pending"}`} />
                      <div className="task-timeline-content">
                        <div className="task-timeline-title">Started</div>
                        <div className="task-timeline-date">Awaiting progress update</div>
                      </div>
                    </div>
                    <div className="task-timeline-item">
                      <div className={`task-timeline-dot task-timeline-dot--${task.status === "Completed" ? "completed" : "pending"}`} />
                      <div className="task-timeline-content">
                        <div className="task-timeline-title">Target Completion</div>
                        <div className="task-timeline-date">{formatDate(task.dueDate)}</div>
                      </div>
                    </div>
                  </div>
                </article>


                {/* CHECKLIST */}
                <ChecklistSection 
                  taskId={task._id} 
                  canEdit={user?.role !== "Client"}
                />

                {/* SUB-TASKS */}
                <article className="task-details-card task-details-card--subtasks">
                  <div className="task-card-header">
                    <div>
                      <h3 className="task-card-title">Sub-Tasks</h3>
                      <p className="task-card-description">Break down the work into smaller steps</p>
                    </div>
                    <ListTodo size={20} className="task-card-icon" />
                  </div>

                  {canEditSubtasks && (
                    <form className="task-subtask-form" onSubmit={handleSubtaskSubmit}>
                      <label className="task-form-label" htmlFor="subtaskTitle">
                        {editingSubtaskId ? "Edit sub-task" : "Add sub-task"}
                      </label>
                      <input
                        id="subtaskTitle"
                        type="text"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        placeholder="Enter a sub-task title"
                        className="task-details-input"
                      />
                      <textarea
                        id="subtaskDescription"
                        rows="2"
                        value={subtaskDescription}
                        onChange={(e) => setSubtaskDescription(e.target.value)}
                        placeholder="Optional details"
                        className="task-details-textarea task-details-textarea--compact"
                      />
                      {subtaskError && <p className="task-subtask-error">{subtaskError}</p>}
                      <div className="task-details-form-actions">
                        {editingSubtaskId && (
                          <button
                            type="button"
                            className="task-details-btn task-details-btn--secondary"
                            onClick={resetSubtaskForm}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="task-details-btn task-details-btn--primary"
                          disabled={subtaskSubmitting || !subtaskTitle.trim()}
                        >
                          {subtaskSubmitting ? "Saving..." : editingSubtaskId ? "Save changes" : "Add sub-task"}
                        </button>
                      </div>
                    </form>
                  )}

                  {subtaskLoading ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <ListTodo size={24} />
                      </div>
                      <p className="task-placeholder-text">Loading sub-tasks…</p>
                    </div>
                  ) : subtasks.length === 0 ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <ListTodo size={24} />
                      </div>
                      <p className="task-placeholder-text">No sub-tasks yet</p>
                      <p className="task-placeholder-subtext">Break this work down into a few smaller steps.</p>
                    </div>
                  ) : (
                    <div className="task-subtask-list">
                      {subtasks.map((subtask) => (
                        <div key={subtask._id} className="task-subtask-item">
                          <button
                            type="button"
                            className="task-subtask-toggle"
                            onClick={() => canEditSubtasks && handleSubtaskToggle(subtask)}
                            aria-label={subtask.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {subtask.completed ? (
                              <CheckCircle2 size={18} className="task-subtask-icon task-subtask-icon--done" />
                            ) : (
                              <Circle size={18} className="task-subtask-icon" />
                            )}
                          </button>
                          <div className="task-subtask-content">
                            <div className={`task-subtask-title ${subtask.completed ? "task-subtask-title--done" : ""}`}>
                              {subtask.title}
                            </div>
                            {subtask.description ? (
                              <div className="task-subtask-description">{subtask.description}</div>
                            ) : null}
                          </div>
                          {canEditSubtasks && (
                            <div className="task-subtask-actions">
                              <button
                                type="button"
                                className="task-subtask-action-btn"
                                onClick={() => handleSubtaskEdit(subtask)}
                                aria-label="Edit sub-task"
                              >
                                <PencilLine size={16} />
                              </button>
                              <button
                                type="button"
                                className="task-subtask-action-btn task-subtask-action-btn--danger"
                                onClick={() => handleSubtaskDelete(subtask._id)}
                                aria-label="Delete sub-task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>

              {/* RIGHT COLUMN */}
              <div className="task-details-dashboard-col">
                {/* TASK DETAILS */}
                <article className="task-details-card">
                  <div className="task-card-header">
                    <div>
                      <h3 className="task-card-title">Task Details</h3>
                      <p className="task-card-description">Core information</p>
                    </div>
                    <AlertCircle size={20} className="task-card-icon" />
                  </div>
                  <div className="task-details-list">
                    <div className="task-details-item">
                      <div className="task-details-item-label">
                        <Calendar size={16} />
                        Due Date
                      </div>
                      <div className="task-details-item-value">{formatDate(task.dueDate)}</div>
                    </div>
                    {task.recurrence ? (
                      <div className="task-details-item">
                        <div className="task-details-item-label">
                          <RefreshCw size={16} />
                          Recurrence
                        </div>
                        <div className="task-details-item-value">
                          {task.recurrence} recurring
                          {task.parentTask?.title ? ` • Parent: ${task.parentTask.title}` : ""}
                          {task.childTask?.title ? ` • Next: ${task.childTask.title}` : ""}
                        </div>
                      </div>
                    ) : null}
                    <div className="task-details-item">
                      <div className="task-details-item-label">
                        <UserRound size={16} />
                        Assigned To
                      </div>
                      <div className="task-details-item-value">{task.assignedTo?.name || "—"}</div>
                    </div>
                    <div className="task-details-item">
                      <div className="task-details-item-label">
                        <Users size={16} />
                        Client
                      </div>
                      <div className="task-details-item-value">{task.client?.clientName || "—"}</div>
                    </div>
                    <div className="task-details-item">
                      <div className="task-details-item-label">
                        <FileText size={16} />
                        Service
                      </div>
                      <div className="task-details-item-value">
                        {task.service
                          ? `${task.service.serviceCategory} — ${task.service.subService}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </article>

                {/* DOCUMENTS */}
                <article className="task-details-card task-details-card--documents">
                  <div className="task-card-header">
                    <div>
                      <h3 className="task-card-title">Documents</h3>
                      <p className="task-card-description">Task files and attachments</p>
                    </div>
                    <Paperclip size={20} className="task-card-icon" />
                  </div>

                  {canRequestDocuments && (
                    <>
                      <button
                        type="button"
                        className="task-details-btn task-details-btn--secondary"
                        onClick={() => {
                          setShowDocumentRequestModal((current) => !current);
                          setRequestedDocuments([]);
                          setRequestDocumentInput("");
                        }}
                      >
                        {showDocumentRequestModal ? "Hide request form" : "Request documents"}
                      </button>

                      {showDocumentRequestModal && (
                        <div className="task-document-request-panel">
                          <div className="task-document-request-title">Request client documents</div>
                          <form className="task-document-request-form" onSubmit={handleDocumentRequestSubmit}>
                            <input
                              type="text"
                              value={requestDocumentInput}
                              onChange={(event) => setRequestDocumentInput(event.target.value)}
                              placeholder="Add a required document"
                              className="task-details-input"
                            />
                            <div className="task-details-form-actions">
                              <button type="submit" className="task-details-btn task-details-btn--secondary">
                                Add document
                              </button>
                            </div>
                          </form>

                          {requestedDocuments.length > 0 && (
                            <div className="task-document-request-chips">
                              {requestedDocuments.map((documentName) => (
                                <span key={documentName} className="task-document-request-chip">
                                  {documentName}
                                  <button
                                    type="button"
                                    className="task-document-request-chip-remove"
                                    onClick={() => removeRequestedDocument(documentName)}
                                    aria-label={`Remove ${documentName}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="task-details-form-actions">
                            <button
                              type="button"
                              className="task-details-btn task-details-btn--secondary"
                              onClick={() => {
                                setShowDocumentRequestModal(false);
                                setRequestedDocuments([]);
                                setRequestDocumentInput("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="task-details-btn task-details-btn--primary"
                              onClick={submitDocumentRequest}
                              disabled={documentRequestSubmitting || !requestedDocuments.length}
                            >
                              {documentRequestSubmitting ? "Saving..." : "Save request"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {documentRequests.length > 0 && (
                    <div className="task-document-request-list">
                      {documentRequests.map((request) => (
                        <div key={request._id} className="task-document-request-item">
                          <div className="task-document-request-item-content">
                            <div className="task-document-request-item-title">Requested documents</div>
                            <div className="task-document-request-item-docs">
                              {request.requiredDocuments?.join(", ")}
                            </div>
                            <div className="task-document-request-item-meta">
                              Status: {request.status} • {formatDateTime(request.createdAt)}
                            </div>
                          </div>
                          <span className={`task-document-request-badge task-document-request-badge--${String(request.status || "pending").toLowerCase()}`}>
                            {request.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {canManageDocuments && (
                    <form className="task-document-form" onSubmit={handleDocumentUpload}>
                      <label className="task-form-label" htmlFor="taskDocumentInput">
                        {canUploadRequestedDocuments ? "Upload requested document" : "Upload document"}
                      </label>
                      <input
                        id="taskDocumentInput"
                        type="file"
                        accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.doc,.docx"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                        className="task-details-file-input"
                      />
                      {documentError && <p className="task-subtask-error">{documentError}</p>}
                      <div className="task-details-form-actions">
                        <button
                          type="submit"
                          className="task-details-btn task-details-btn--primary"
                          disabled={documentUploading || !selectedFile}
                        >
                          {documentUploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </form>
                  )}

                  {documentsLoading ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <Paperclip size={24} />
                      </div>
                      <p className="task-placeholder-text">Loading documents…</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <Paperclip size={24} />
                      </div>
                      <p className="task-placeholder-text">No documents attached</p>
                      <p className="task-placeholder-subtext">Upload PDF, Excel, image, or Word files here.</p>
                    </div>
                  ) : (
                    <div className="task-document-list">
                      {documents.map((document) => (
                        <div key={document._id} className="task-document-item">
                          <div className="task-document-info">
                            <div className="task-document-name">{document.originalName || document.fileName}</div>
                            <div className="task-document-meta">
                              {new Date(document.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                          <div className="task-document-actions">
                            <a
                              className="task-document-action"
                              href={document.path}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download size={16} />
                            </a>
                            {canManageDocuments && (
                              <button
                                type="button"
                                className="task-document-action task-document-action--danger"
                                onClick={() => handleDocumentDelete(document._id)}
                                aria-label="Delete document"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                {/* ACTIVITY HISTORY */}
                <article className="task-details-card task-details-card--activity">
                  <div className="task-card-header">
                    <div>
                      <h3 className="task-card-title">Activity</h3>
                      <p className="task-card-description">Recent task changes</p>
                    </div>
                    <History size={20} className="task-card-icon" />
                  </div>

                  {activitiesLoading ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <History size={24} />
                      </div>
                      <p className="task-placeholder-text">Loading activity…</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="task-placeholder-content">
                      <div className="task-placeholder-icon">
                        <History size={24} />
                      </div>
                      <p className="task-placeholder-text">No activity yet</p>
                      <p className="task-placeholder-subtext">Task updates will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="task-activity-list">
                      {activities.map((activity) => (
                        <div key={activity._id} className="task-activity-item">
                          <div className="task-activity-badge">{activity.activity}</div>
                          <div className="task-activity-content">
                            <div className="task-activity-details">{activity.details || "No additional details"}</div>
                            <div className="task-activity-meta">
                              <span>{activity.user?.name || activity.user?.email || "System"}</span>
                              <span>{formatDateTime(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </div>

            {/* COMMENTS SECTION */}
            <section className="task-details-comments-card">
              <div className="task-card-header">
                <div>
                  <h3 className="task-card-title">Discussion</h3>
                  <p className="task-card-description">{taskComments.length} comments</p>
                </div>
                <MessageSquareText size={20} className="task-card-icon" />
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
                <div>
                  <label htmlFor="commentText" className="task-form-label">
                    Add Comment
                  </label>
                  <textarea
                    id="commentText"
                    name="comment"
                    rows="3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts or updates..."
                    className="task-details-textarea"
                  />
                </div>

                <div className="task-details-form-actions">
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

            {/* BOTTOM ACTIONS */}
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