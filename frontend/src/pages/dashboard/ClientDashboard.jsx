import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { getTasks } from "../../services/taskService.js";
import { getDocuments } from "../../services/documentService.js";
import { getNotifications } from "../../services/notificationService.js";

// UI Helper: Map task status/priority to brand colors
const getBadgeColor = (value) => {
  const normalized = (value || "").toLowerCase();
  if (["completed", "resolved", "done"].includes(normalized)) return "#10B981"; // Emerald
  if (["pending", "in progress", "medium"].includes(normalized)) return "#FBBF24"; // Amber
  if (["overdue", "high", "urgent", "error"].includes(normalized)) return "#EF4444"; // Red
  if (["low", "new", "info"].includes(normalized)) return "#3B82F6"; // Blue
  return "#A855F7"; // Default Purple
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
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ ANIMATIONS & BASE ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-client-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── GLASS SURFACES ── */
        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── HEADERS ── */
        .qca-header-block {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 24px;
        }
        .qca-header-block.no-border { border-bottom: none; padding-bottom: 0; }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #06B6D4; text-transform: uppercase;
          background: rgba(6, 182, 212, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .qca-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
        .qca-subtitle { font-size: 1rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── METRICS GRID ── */
        .qca-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.1s;
        }

        .qca-metric-card {
          padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, background 0.3s, border-color 0.3s;
          position: relative; overflow: hidden;
        }
        .qca-metric-card:hover {
          transform: translateY(-4px); background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        
        .qca-metric-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .qca-metric-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #fff;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
        }

        .qca-metric-card p { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin-bottom: 4px; }
        .qca-metric-card h2 { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0; line-height: 1; }
        .qca-metric-subtext { font-size: 0.8rem; color: rgba(255, 255, 255, 0.35); font-weight: 500; margin-top: 8px; display: block; }

        /* ── LAYOUT GRIDS ── */
        .qca-split-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }

        /* ── SERVICES TAGS ── */
        .qca-services-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
        .qca-service-tag {
          background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.2);
          color: #D8B4FE; padding: 10px 16px; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
          transition: all 0.2s;
        }
        .qca-service-tag:hover { background: rgba(124, 58, 237, 0.15); transform: translateY(-2px); }

        /* ── DATA TABLES ── */
        .qca-table-wrapper { width: 100%; overflow-x: auto; margin-top: 16px; }
        .qca-table { width: 100%; border-collapse: collapse; text-align: left; }
        .qca-table th {
          padding: 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qca-table td {
          padding: 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle;
        }
        .qca-table tbody tr { transition: background 0.2s; }
        .qca-table tbody tr:hover td { background: rgba(255, 255, 255, 0.03); }

        .qca-badge {
          display: inline-flex; align-items: center; padding: 4px 10px;
          border-radius: 6px; font-size: 0.75rem; font-weight: 700;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* ── NOTIFICATIONS FEED ── */
        .qca-feed { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .qca-feed-item {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          padding: 16px; border-radius: 12px; transition: all 0.2s;
          display: flex; flex-direction: column; gap: 6px; position: relative;
        }
        .qca-feed-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
        .qca-feed-item strong { color: #fff; font-size: 0.95rem; font-weight: 600; display: block; padding-right: 24px; }
        .qca-feed-item p { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin: 0; line-height: 1.5; }
        .qca-feed-item small { color: rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 500; margin-top: 4px; }
        
        .qca-unread-dot {
          position: absolute; top: 20px; right: 16px; width: 8px; height: 8px;
          background: #F97316; border-radius: 50%; box-shadow: 0 0 8px #F97316;
        }

        /* ── EMPTY STATES ── */
        .qca-empty-state {
          padding: 40px; text-align: center; background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;
          color: rgba(255,255,255,0.4); font-size: 0.95rem; margin-top: 16px;
        }
        
        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center; font-weight: 500;
        }

        @media (max-width: 1024px) {
          .qca-split-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .qca-surface { padding: 24px; }
          .qca-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="qca-client-shell">
        
        {/* Page Header */}
        <div className="qca-header-block no-border">
          <span className="qca-eyebrow">Client Dashboard</span>
          <h1 className="qca-title">Welcome back, {client?.clientName || "Valued Client"}</h1>
          <p className="qca-subtitle">View your services, tasks, documents, and notifications in one place.</p>
        </div>

        {loading ? (
          <div className="qca-surface" style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
            <p>Loading your dashboard intelligence…</p>
          </div>
        ) : error ? (
          <div className="qca-alert-danger">{error}</div>
        ) : (
          <>
            {/* Top Metrics Grid */}
            <section className="qca-metrics-grid">
              <article className="qca-metric-card" style={{ animationDelay: "0.1s" }}>
                <div className="qca-metric-header">
                  <div className="qca-metric-icon" style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>S</div>
                </div>
                <div>
                  <p>My Services</p>
                  <h2>{assignedServices.length}</h2>
                  <span className="qca-metric-subtext">Assigned to your account</span>
                </div>
              </article>

              <article className="qca-metric-card" style={{ animationDelay: "0.15s" }}>
                <div className="qca-metric-header">
                  <div className="qca-metric-icon" style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)" }}>T</div>
                </div>
                <div>
                  <p>My Tasks</p>
                  <h2>{tasks.length}</h2>
                  <span className="qca-metric-subtext">Tasks pending your review</span>
                </div>
              </article>

              <article className="qca-metric-card" style={{ animationDelay: "0.2s" }}>
                <div className="qca-metric-header">
                  <div className="qca-metric-icon" style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}>D</div>
                </div>
                <div>
                  <p>My Documents</p>
                  <h2>{documents.length}</h2>
                  <span className="qca-metric-subtext">Shared secure files</span>
                </div>
              </article>

              <article className="qca-metric-card" style={{ animationDelay: "0.25s" }}>
                <div className="qca-metric-header">
                  <div className="qca-metric-icon" style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)" }}>N</div>
                </div>
                <div>
                  <p>Notifications</p>
                  <h2>{notifications.length}</h2>
                  <span className="qca-metric-subtext" style={{ color: unreadNotifications > 0 ? "#FBBF24" : "inherit" }}>
                    {unreadNotifications} unread alerts
                  </span>
                </div>
              </article>
            </section>

            {/* Split Section: Services & Notifications */}
            <section className="qca-split-grid">
              <article className="qca-surface" style={{ animationDelay: "0.3s" }}>
                <div className="qca-header-block no-border" style={{ marginBottom: "0" }}>
                  <h2 className="qca-title" style={{ fontSize: "1.4rem" }}>My Services</h2>
                  <p className="qca-subtitle" style={{ fontSize: "0.9rem" }}>Active agreements on your account.</p>
                </div>
                {assignedServices.length === 0 ? (
                  <div className="qca-empty-state">No services are assigned to your account yet.</div>
                ) : (
                  <div className="qca-services-grid">
                    {assignedServices.map((service, index) => (
                      <div key={`${service}-${index}`} className="qca-service-tag">
                        {service}
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="qca-surface" style={{ animationDelay: "0.35s" }}>
                <div className="qca-header-block no-border" style={{ marginBottom: "0" }}>
                  <h2 className="qca-title" style={{ fontSize: "1.4rem" }}>Recent Notifications</h2>
                  <p className="qca-subtitle" style={{ fontSize: "0.9rem" }}>Your newest account alerts.</p>
                </div>
                {recentNotifications.length === 0 ? (
                  <div className="qca-empty-state">No notifications yet.</div>
                ) : (
                  <div className="qca-feed">
                    {recentNotifications.map((notification) => (
                      <div key={notification._id} className="qca-feed-item">
                        {notification.read === false && <span className="qca-unread-dot" />}
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            {/* Tasks Table */}
            <section className="qca-surface" style={{ animationDelay: "0.4s" }}>
              <div className="qca-header-block no-border">
                <h2 className="qca-title" style={{ fontSize: "1.6rem" }}>Active Tasks</h2>
                <p className="qca-subtitle">Latest action items requiring your attention.</p>
              </div>
              {recentTasks.length === 0 ? (
                <div className="qca-empty-state">No tasks available at this time.</div>
              ) : (
                <div className="qca-table-wrapper">
                  <table className="qca-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task) => {
                        const statusColor = getBadgeColor(task.status);
                        const priorityColor = getBadgeColor(task.priority);
                        return (
                          <tr key={task._id}>
                            <td><strong style={{ color: "#fff", fontWeight: 600 }}>{task.title}</strong></td>
                            <td>
                              <span className="qca-badge" style={{ borderColor: `${statusColor}50`, color: statusColor }}>
                                {task.status}
                              </span>
                            </td>
                            <td>
                              <span className="qca-badge" style={{ borderColor: `${priorityColor}50`, color: priorityColor }}>
                                {task.priority}
                              </span>
                            </td>
                            <td style={{ color: "rgba(255,255,255,0.5)" }}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Documents Table */}
            <section className="qca-surface" style={{ animationDelay: "0.45s" }}>
              <div className="qca-header-block no-border">
                <h2 className="qca-title" style={{ fontSize: "1.6rem" }}>Recent Documents</h2>
                <p className="qca-subtitle">Secure files recently shared with your account.</p>
              </div>
              {recentDocuments.length === 0 ? (
                <div className="qca-empty-state">No documents are available.</div>
              ) : (
                <div className="qca-table-wrapper">
                  <table className="qca-table">
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
                            <strong style={{ color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                              <svg width="16" height="16" fill="none" stroke="#7C3AED" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                              </svg>
                              {document.originalFileName || document.fileName}
                            </strong>
                          </td>
                          <td>
                            <span className="qca-badge" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                              {document.category || "General"}
                            </span>
                          </td>
                          <td style={{ color: "rgba(255,255,255,0.5)" }}>
                            {new Date(document.createdAt).toLocaleDateString()}
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