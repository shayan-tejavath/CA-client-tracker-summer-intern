import { useEffect, useMemo, useState } from "react";
import { FaBell, FaFileAlt, FaTasks, FaBriefcase } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { getTasks } from "../../services/taskService.js";
import { getDocuments } from "../../services/documentService.js";
import { getNotifications } from "../../services/notificationService.js";

const getBadgeColor = (value) => {
  const normalized = (value || "").toLowerCase();
  if (["completed", "resolved", "done"].includes(normalized)) return "success";
  if (["pending", "in progress", "medium"].includes(normalized)) return "warning";
  if (["overdue", "high", "urgent", "error"].includes(normalized)) return "danger";
  if (["low", "new", "info"].includes(normalized)) return "info";
  return "default";
};

const ClientDashboard = () => {
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClientDashboard = async () => {
      try {
        const [clientResult, tasksResult, documentsResult, notificationResult] = await Promise.all([
          getClients(),
          getTasks(),
          getDocuments(false),
          getNotifications(),
        ]);

        setClient(clientResult.clients?.[0] ?? null);
        setTasks(Array.isArray(tasksResult) ? tasksResult : []);
        setDocuments(Array.isArray(documentsResult.documents) ? documentsResult.documents : []);
        setNotifications(Array.isArray(notificationResult) ? notificationResult : []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadClientDashboard();
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.read === false).length,
    [notifications]
  );

  const recentTasks = useMemo(() => tasks.slice(0, 4), [tasks]);
  const recentDocuments = useMemo(() => documents.slice(0, 4), [documents]);
  const recentNotifications = useMemo(() => notifications.slice(0, 4), [notifications]);
  const assignedServices = client?.assignedServices ?? [];

  return (
    <DashboardLayout>
      <div className="page-content client-dashboard">
        <section className="page-header client-dashboard__header">
          <div>
            <span className="eyebrow">Client Dashboard</span>
            <h1>Welcome back, {client?.clientName || "Valued Client"}</h1>
            <p>View your services, tasks, documents, and notifications in one place.</p>
          </div>
        </section>

        {loading ? (
          <div className="page-card client-state">
            <div className="client-spinner" />
            <h3>Loading your dashboard intelligence…</h3>
            <p>Preparing your latest tasks, files, and alerts.</p>
          </div>
        ) : error ? (
          <div className="alert danger client-alert">
            <FaBell className="alert-icon" size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <section className="grid client-metrics-grid">
              <article className="metric-card client-metric-card">
                <div className="metric-header">
                  <div className="metric-icon-wrapper client-icon-blue">
                    <FaBriefcase size={18} />
                  </div>
                  <span className="badge badge-outline">Live</span>
                </div>
                <div>
                  <div className="metric-title">My Services</div>
                  <div className="metric-value">{assignedServices.length}</div>
                  <div className="client-metric-subtext">Assigned to your account</div>
                </div>
              </article>

              <article className="metric-card client-metric-card">
                <div className="metric-header">
                  <div className="metric-icon-wrapper client-icon-cyan">
                    <FaTasks size={18} />
                  </div>
                  <span className="badge badge-outline">Live</span>
                </div>
                <div>
                  <div className="metric-title">My Tasks</div>
                  <div className="metric-value">{tasks.length}</div>
                  <div className="client-metric-subtext">Tasks pending your review</div>
                </div>
              </article>

              <article className="metric-card client-metric-card">
                <div className="metric-header">
                  <div className="metric-icon-wrapper client-icon-green">
                    <FaFileAlt size={18} />
                  </div>
                  <span className="badge badge-outline">Live</span>
                </div>
                <div>
                  <div className="metric-title">My Documents</div>
                  <div className="metric-value">{documents.length}</div>
                  <div className="client-metric-subtext">Shared secure files</div>
                </div>
              </article>

              <article className="metric-card client-metric-card">
                <div className="metric-header">
                  <div className="metric-icon-wrapper client-icon-amber">
                    <FaBell size={18} />
                  </div>
                  <span className="badge badge-outline">Live</span>
                </div>
                <div>
                  <div className="metric-title">Notifications</div>
                  <div className="metric-value">{notifications.length}</div>
                  <div className="client-metric-subtext client-metric-subtext--highlight">
                    {unreadNotifications} unread alerts
                  </div>
                </div>
              </article>
            </section>

            <section className="client-split-grid">
              <article className="page-card client-panel">
                <div className="card-header">
                  <div className="card-title">My Services</div>
                  <div className="card-description">Active agreements on your account.</div>
                </div>

                {assignedServices.length === 0 ? (
                  <div className="empty-inline">No services are assigned to your account yet.</div>
                ) : (
                  <div className="service-tags">
                    {assignedServices.map((service, index) => (
                      <span key={`${service}-${index}`} className="service-tag">
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              <article className="page-card client-panel">
                <div className="card-header">
                  <div className="card-title">Recent Notifications</div>
                  <div className="card-description">Your newest account alerts.</div>
                </div>

                {recentNotifications.length === 0 ? (
                  <div className="empty-inline">No notifications yet.</div>
                ) : (
                  <div className="feed-list">
                    {recentNotifications.map((notification) => (
                      <div key={notification._id} className="feed-item">
                        {!notification.read && <span className="feed-dot" />}
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="page-card client-panel">
              <div className="card-header">
                <div className="card-title">Active Tasks</div>
                <div className="card-description">Latest action items requiring your attention.</div>
              </div>

              {recentTasks.length === 0 ? (
                <div className="empty-inline">No tasks available at this time.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task) => {
                        const statusTone = getBadgeColor(task.status);
                        const priorityTone = getBadgeColor(task.priority);

                        return (
                          <tr key={task._id}>
                            <td>
                              <span className="cell-main">{task.title}</span>
                            </td>
                            <td>
                              <span className={`status-badge status-badge--${statusTone}`}>
                                {task.status}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-badge--${priorityTone}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="date-cell">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="page-card client-panel">
              <div className="card-header">
                <div className="card-title">Recent Documents</div>
                <div className="card-description">Secure files recently shared with your account.</div>
              </div>

              {recentDocuments.length === 0 ? (
                <div className="empty-inline">No documents are available.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Category</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((document) => (
                        <tr key={document._id}>
                          <td>
                            <span className="doc-cell">
                              <span className="doc-icon">PDF</span>
                              <span className="cell-main">
                                {document.originalFileName || document.fileName}
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-outline">
                              {document.category || "General"}
                            </span>
                          </td>
                          <td className="date-cell">
                            {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;