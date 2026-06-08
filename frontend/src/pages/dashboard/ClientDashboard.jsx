import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { getTasks } from "../../services/taskService.js";
import { getDocuments } from "../../services/documentService.js";
import { getNotifications } from "../../services/notificationService.js";

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
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Client Dashboard</p>
            <h1>Welcome back, {client?.clientName || "Valued Client"}</h1>
            <p>View your services, tasks, documents, and notifications in one place.</p>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="page-card">
          <p>Loading your client dashboard…</p>
        </section>
      ) : error ? (
        <section className="page-card alert danger">
          {error}
        </section>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            <article className="overview-card metric-card">
              <span className="overview-card-icon" style={{ background: "#6366f1" }}>
                S
              </span>
              <div>
                <p className="overview-card-label">My Services</p>
                <h2>{assignedServices.length}</h2>
                <span className="metric-subtext">Assigned to your account</span>
              </div>
            </article>

            <article className="overview-card metric-card">
              <span className="overview-card-icon" style={{ background: "#facc15" }}>
                T
              </span>
              <div>
                <p className="overview-card-label">My Tasks</p>
                <h2>{tasks.length}</h2>
                <span className="metric-subtext">Tasks assigned to you</span>
              </div>
            </article>

            <article className="overview-card metric-card">
              <span className="overview-card-icon" style={{ background: "#34d399" }}>
                D
              </span>
              <div>
                <p className="overview-card-label">My Documents</p>
                <h2>{documents.length}</h2>
                <span className="metric-subtext">Documents shared with you</span>
              </div>
            </article>

            <article className="overview-card metric-card">
              <span className="overview-card-icon" style={{ background: "#f87171" }}>
                N
              </span>
              <div>
                <p className="overview-card-label">Notifications</p>
                <h2>{notifications.length}</h2>
                <span className="metric-subtext">{unreadNotifications} unread</span>
              </div>
            </article>
          </section>

          <section className="page-card">
            <div className="page-card-header">
              <h2>My Services</h2>
              <p>Services currently assigned to your account.</p>
            </div>
            {assignedServices.length === 0 ? (
              <div className="alert">No services are assigned to your account yet.</div>
            ) : (
              <ul className="dashboard-list">
                {assignedServices.map((service, index) => (
                  <li key={`${service}-${index}`} className="dashboard-list-item">
                    {service}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-card">
            <div className="page-card-header">
              <h2>My Tasks</h2>
              <p>Latest tasks created for your account.</p>
            </div>
            {recentTasks.length === 0 ? (
              <div className="alert">No tasks available at this time.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((task) => (
                      <tr key={task._id}>
                        <td>{task.title}</td>
                        <td>{task.status}</td>
                        <td>{task.priority}</td>
                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="page-card">
            <div className="page-card-header">
              <h2>My Documents</h2>
              <p>Recent documents shared with your account.</p>
            </div>
            {recentDocuments.length === 0 ? (
              <div className="alert">No documents are available.</div>
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
                        <td>{document.originalFileName || document.fileName}</td>
                        <td>{document.category || "General"}</td>
                        <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="page-card">
            <div className="page-card-header">
              <h2>Notifications</h2>
              <p>Your newest account notifications.</p>
            </div>
            {recentNotifications.length === 0 ? (
              <div className="alert">No notifications yet.</div>
            ) : (
              <ul className="dashboard-list">
                {recentNotifications.map((notification) => (
                  <li key={notification._id} className="dashboard-list-item">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

export default ClientDashboard;
