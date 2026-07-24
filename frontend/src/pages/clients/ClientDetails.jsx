import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { usePermission } from "../../hooks/usePermission.js";
import { getClientById } from "../../services/clientService.js";
import quotationService from "../../services/quotationService.js";
import { getServices, getWorkflowTemplates } from "../../services/serviceService.js";
import { getTasks } from "../../services/taskService.js";
import { sendMessage as sendMessengerMessage } from "../../services/notificationService.js";
import "./client-details.css";

const tabs = [
  "Details",
  "Services",
  "Tasks",
  "Documents",
  "Ledger",
  "Docs In-Out Register",
  "Passwords",
  "Expenses",
  "DSC",
  "Quotations",
  "Messaging",
];

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = usePermission();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [templatesMap, setTemplatesMap] = useState(new Map());
  const [tasks, setTasks] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageForm, setMessageForm] = useState({ channel: "EMAIL", to: "", body: "" });
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    clientPortal: true,
    documentSharing: false,
    autoReminders: true,
    financeApproval: false,
  });

  useEffect(() => {
    if (client?.email || client?.mobile) {
      setMessageForm((prev) => ({
        ...prev,
        to: prev.to || client.email || client.mobile || "",
      }));
    }
  }, [client?.email, client?.mobile]);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        setError("");

        const [clientData, serviceData, taskData, quotationResponse] = await Promise.all([
          getClientById(clientId),
          getServices(),
          getTasks(),
          quotationService.getQuotations({ clientId, limit: 50 }),
        ]);

        setClient(clientData);
        setServices(Array.isArray(serviceData) ? serviceData : serviceData?.services || []);
        setTasks(
          Array.isArray(taskData)
            ? taskData.filter((task) => String(task.client?._id || task.client) === String(clientId))
            : []
        );
        setQuotations(
          Array.isArray(quotationResponse?.data)
            ? quotationResponse.data
            : Array.isArray(quotationResponse)
              ? quotationResponse
              : Array.isArray(quotationResponse?.quotations)
                ? quotationResponse.quotations
                : []
        );
        // load workflow templates for assigned services
        try {
          const assignedServiceIds = (Array.isArray(clientData.assignedServices)
            ? clientData.assignedServices.map((s) => (s && s._id ? String(s._id) : String(s)))
            : []);

          const map = new Map();
          await Promise.all(
            assignedServiceIds.map(async (svcId) => {
              if (!svcId) return;
              try {
                const tpl = await getWorkflowTemplates(svcId);
                const arr = Array.isArray(tpl) ? tpl : [];
                // prefer service-specific template selection: pick first active
                const chosen = arr.find((t) => t.isActive) || arr[0] || null;
                if (chosen) map.set(String(svcId), chosen);
              } catch (e) {
                // ignore
              }
            })
          );
          setTemplatesMap(map);
        } catch (e) {
          // ignore template load errors
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load client details.");
      } finally {
        setLoading(false);
        setQuotationsLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const serviceLookup = useMemo(() => {
    const map = new Map();

    services.forEach((service) => {
      if (!service?._id) return;
      map.set(String(service._id), service);
    });

    return map;
  }, [services]);

  const resolvedAssignedServices = useMemo(() => {
    if (!client) return [];

    const rawServices = Array.isArray(client.assignedServices)
      ? client.assignedServices
      : Array.isArray(client.services)
        ? client.services
        : [];

    return rawServices
      .map((item) => {
        if (!item) return null;

        if (typeof item === "object") {
          const id = item._id || "";
          const label =
            item.subService ||
            item.name ||
            item.serviceCategory ||
            item.label ||
            id;

          return {
            id: String(id || label),
            label,
            category: item.serviceCategory || "",
            frequency: item.frequency || "",
            description: item.description || "",
          };
        }

        const raw = String(item);
        const matched =
          serviceLookup.get(raw) ||
          services.find((service) => {
            const labels = [
              service.subService,
              service.name,
              service.serviceCategory,
            ]
              .filter(Boolean)
              .map((value) => String(value).toLowerCase());

            return labels.includes(raw.toLowerCase());
          });

        return {
          id: raw,
          label:
            matched?.subService ||
            matched?.name ||
            matched?.serviceCategory ||
            raw,
          category: matched?.serviceCategory || "",
          frequency: matched?.frequency || "",
          description: matched?.description || "",
        };
      })
      .filter(Boolean);
  }, [client, serviceLookup, services]);

  const getTaskCount = (type) => {
    if (!client) return 0;
    return tasks.filter((task) => task.status === type).length;
  };

  const groupedTasks = useMemo(() => {
    const grouped = new Map();

    tasks.forEach((task) => {
      const serviceId = task.service?._id || task.service;
      const serviceName =
        task.service?.subService ||
        task.service?.serviceCategory ||
        task.service?.name ||
        "General Service";
      const groupKey = serviceId ? String(serviceId) : serviceName;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          serviceId: serviceId ? String(serviceId) : null,
          serviceName,
          tasks: [],
        });
      }

      grouped.get(groupKey).tasks.push(task);
    });

    return Array.from(grouped.values())
      .map((group) => {
        const totalCount = group.tasks.length;
        const completedCount = group.tasks.filter((task) => String(task.status || "").toLowerCase() === "completed").length;
        const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          ...group,
          totalCount,
          completedCount,
          progressPercent,
          tasks: group.tasks.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)),
        };
      })
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [tasks]);

  const getTaskStatusClass = (status) => {
    const normalizedStatus = String(status || "Pending").toLowerCase();
    if (normalizedStatus.includes("complete")) return "task-pill--success";
    if (normalizedStatus.includes("progress")) return "task-pill--info";
    if (normalizedStatus.includes("overdue")) return "task-pill--danger";
    return "task-pill--neutral";
  };

  const getDocumentCount = () => {
    if (!client) return 0;
    if (Array.isArray(client.documents)) return client.documents.length;
    return client.documentCount ?? 0;
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMessageChange = (event) => {
    const { name, value } = event.target;
    setMessageForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendClientMessage = async (event) => {
    event.preventDefault();

    if (!messageForm.to || !messageForm.body) {
      toast.error("Please provide a recipient and message body.");
      return;
    }

    try {
      setMessageSubmitting(true);
      await sendMessengerMessage({
        channel: messageForm.channel,
        to: messageForm.to,
        subject: `Message for ${client?.clientName || "client"}`,
        body: messageForm.body,
        metadata: {
          source: "ca-client-tracker",
          clientId,
        },
      });
      toast.success("Message queued successfully.");
      setMessageForm((prev) => ({ ...prev, body: "" }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Message delivery failed.");
    } finally {
      setMessageSubmitting(false);
    }
  };

  const renderSummaryCards = () => (
    <div className="stats-grid">
      <div className="summary-card">
        <p className="summary-card__label">Pending Tasks</p>
        <p className="summary-card__value">{getTaskCount("Pending")}</p>
      </div>
      <div className="summary-card">
        <p className="summary-card__label">In Progress</p>
        <p className="summary-card__value">{getTaskCount("In Progress")}</p>
      </div>
      <div className="summary-card">
        <p className="summary-card__label">Completed</p>
        <p className="summary-card__value">{getTaskCount("Completed")}</p>
      </div>
      <div className="summary-card">
        <p className="summary-card__label">Documents</p>
        <p className="summary-card__value">{getDocumentCount()}</p>
      </div>
    </div>
  );

  const renderHeroHeader = () => (
    <div className="client-hero-card">
      <div className="client-hero-left">
        <div className="client-avatar-large">
          {client.profileImage ? (
            <img src={client.profileImage} alt={client.clientName} />
          ) : (
            <span>{client.clientName?.charAt(0).toUpperCase() || "C"}</span>
          )}
        </div>

        <div className="client-hero-details">
          <div className="client-hero-title-row">
            <h1 className="client-hero-name">{client.clientName || "—"}</h1>
            <span className={`status-badge status-${client.status?.toLowerCase() || "pending"}`}>
              {client.status || "Pending"}
            </span>
          </div>
          <p className="client-hero-subtitle">File No: {client.clientCode || "N/A"}</p>
          <div className="client-hero-tags">
            <span className="client-badge">{client.clientType || "Business"}</span>
            {client.assignedManager && <span className="client-badge secondary">{client.assignedManager}</span>}
            <span className="client-badge secondary">{resolvedAssignedServices.length} Service(s)</span>
          </div>
        </div>
      </div>

      <div className="client-hero-meta-grid">
        <div className="hero-field">
          <p className="hero-field__label">Client Type</p>
          <p className="hero-field__value">{client.clientType || "Business"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">Assigned Manager</p>
          <p className="hero-field__value">{client.assignedManager || "Not assigned"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">Industry Type</p>
          <p className="hero-field__value">{client.industryType || "—"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">PAN</p>
          <p className="hero-field__value">{client.pan || "—"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">GSTIN</p>
          <p className="hero-field__value">{client.gstin || "—"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">Email</p>
          <p className="hero-field__value">{client.email || "—"}</p>
        </div>
        <div className="hero-field">
          <p className="hero-field__label">Mobile</p>
          <p className="hero-field__value">{client.mobile || "—"}</p>
        </div>
      </div>
    </div>
  );

  const renderRecentActivity = () => (
    <div className="recent-activity-card panel-card">
      <div className="section-header">
        <h2>Recent Activity</h2>
        <a href="#" className="recent-activity-link">
          View all
        </a>
      </div>
      <div className="recent-activity-list">
        {[
          { title: "Client profile updated", subtitle: "Manager", date: "18 Jun 2026 05:45 PM" },
          { title: "Document uploaded", subtitle: "Manager", date: "18 Jun 2026 05:40 PM" },
          { title: "Service assigned", subtitle: "Manager", date: "17 Jun 2026 11:20 AM" },
          { title: "Client created", subtitle: "Manager", date: "17 Jun 2026 10:15 AM" },
        ].map((item) => (
          <div key={item.title + item.date} className="recent-activity-item">
            <div>
              <p className="recent-activity-title">{item.title}</p>
              <p className="recent-activity-meta">{item.subtitle}</p>
            </div>
            <p className="recent-activity-date">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClientInfo = () => (
    <div className="client-info-blocks">
      <div className="panel-card client-info-panel">
        <div className="section-header">
          <h2>Client Information</h2>
        </div>
        <div className="client-info-grid">
          {[
            { label: "Client Name", value: client.clientName },
            { label: "File Number", value: client.clientCode },
            { label: "Client Type", value: client.clientType },
            { label: "Industry Type", value: client.industryType },
            { label: "Assigned Manager", value: client.assignedManager },
            { label: "Status", value: client.status },
          ].map((item) => (
            <div key={item.label} className="info-item">
              <span>{item.label}</span>
              <strong>{item.value || "—"}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card contact-info-panel">
        <div className="section-header">
          <h2>Contact Information</h2>
        </div>
        <div className="client-info-grid">
          <div className="info-item">
            <span>Email</span>
            <strong>{client.email || "—"}</strong>
          </div>
          <div className="info-item">
            <span>Mobile</span>
            <strong>{client.mobile || "—"}</strong>
          </div>
          <div className="info-item">
            <span>Address</span>
            <strong>{client.addressLine1 || client.address || "—"}</strong>
          </div>
          <div className="info-item">
            <span>City</span>
            <strong>{client.city || "—"}</strong>
          </div>
          <div className="info-item">
            <span>State</span>
            <strong>{client.state || "—"}</strong>
          </div>
          <div className="info-item">
            <span>Notes</span>
            <strong>{client.notes || "—"}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="panel-card">
      <h2>Settings</h2>
      <div className="toggle-list">
        {[
          {
            key: "clientPortal",
            label: "Client Portal Access",
            hint: "Allow this client to log in and view status updates.",
          },
          {
            key: "documentSharing",
            label: "Document Sharing",
            hint: "Enable secure document exchange for this client.",
          },
          {
            key: "autoReminders",
            label: "Auto Reminders",
            hint: "Send automated reminders for due tasks and returns.",
          },
          {
            key: "financeApproval",
            label: "Finance Approval",
            hint: "Require approval for ledger and expense updates.",
          },
        ].map((option) => (
          <div key={option.key} className="toggle-row">
            <div className="toggle-details">
              <p className="toggle-row__label">{option.label}</p>
              <p className="toggle-row__hint">{option.hint}</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={() => toggleSetting(option.key)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const handleDeleteQuotation = async (quotationId) => {
    if (!quotationId) return;
    const confirmed = window.confirm("Are you sure you want to delete this quotation?");
    if (!confirmed) return;

    try {
      await quotationService.deleteQuotation(quotationId);
      setQuotations((current) => current.filter((quotation) => quotation._id !== quotationId));
      toast.info("Quotation removed from the client list.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to delete quotation.");
    }
  };

  const handleViewQuotation = (quotation) => {
    if (!quotation?._id) return;
    navigate(`/dashboard/quotations/${quotation._id}`);
  };

  const handleDownloadQuotation = async (quotation) => {
    if (!quotation?._id) return;

    try {
      const blob = await quotationService.downloadQuotationPdf(quotation._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quotation.quotationNumber || "quotation"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Quotation PDF downloaded.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download quotation PDF.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Details":
        return (
          <>
            <div className="client-summary-grid">
              <div className="summary-panel panel-card">
                <h2>Summary</h2>
                {renderSummaryCards()}
              </div>
              {renderRecentActivity()}
            </div>
            {renderClientInfo()}
            {renderSettings()}
          </>
        );

      case "Services":
        return (
          <div className="panel-card">
            <div className="section-header">
              <h2>Services</h2>
              <span className="badge badge-info">
                {resolvedAssignedServices.length} assigned
              </span>
            </div>

            {resolvedAssignedServices.length > 0 ? (
              <div className="services-grid" style={{ marginTop: 16 }}>
                {resolvedAssignedServices.map((service) => (
                  <div key={service.id} className="service-item service-item--active">
                    <div className="service-meta">
                      <strong>{service.label}</strong>
                      <div className="service-frequency">{service.category || "—"}</div>
                      {service.frequency && (
                        <div className="service-frequency">{service.frequency}</div>
                      )}
                      {service.description && (
                        <p style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-300">No services assigned yet.</p>
            )}
          </div>
        );

      case "Tasks":
        return (
          <div className="panel-card">
            <div className="section-header">
              <h2>Tasks</h2>
              <span className="badge badge-info">{tasks.length} task(s)</span>
            </div>

            {tasks.length > 0 ? (
              <div className="client-task-groups">
                {groupedTasks.map((group) => (
                  <div key={group.serviceId || group.serviceName} className="client-task-group">
                    <div className="client-task-group__header">
                      <div>
                        <h3>{group.serviceName}</h3>
                          <p>
                            {group.totalCount} task(s) • {group.completedCount} completed
                          </p>
                          {group.serviceId && templatesMap.get(group.serviceId) && (
                            <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
                              <strong>Workflow steps:</strong>{' '}
                              {(templatesMap.get(group.serviceId).taskDefinitions || []).map((s) => s.title).join(' → ')}
                            </p>
                          )}
                      </div>
                      <div className="client-task-progress" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 14 }} aria-hidden>
                          {(() => {
                            const total = group.totalCount || 0;
                            const completed = group.completedCount || 0;
                            const blocks = 5;
                            const filled = total === 0 ? 0 : Math.round((completed / total) * blocks);
                            const empty = Math.max(0, blocks - filled);
                            return (
                              Array.from({ length: filled }).map((_, i) => (
                                <span key={`f-${i}`} style={{ color: 'var(--primary)', marginRight: 4 }}>█</span>
                              ))
                            ).concat(
                              Array.from({ length: empty }).map((_, i) => (
                                <span key={`e-${i}`} style={{ color: 'var(--muted)', marginRight: 4 }}>░</span>
                              ))
                            );
                          })()}
                        </div>

                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {group.completedCount} of {group.totalCount} task(s) completed
                        </div>
                      </div>
                    </div>

                    <div className="client-task-list">
                      {group.tasks.map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          className="client-task-row"
                          onClick={() => navigate(`/dashboard/tasks/${task._id}`)}
                        >
                          <div className="client-task-row__main">
                            <div className="client-task-row__title">
                              <strong>{task.title || "Untitled task"}</strong>
                              <span className={`task-pill ${getTaskStatusClass(task.status)}`}>
                                {task.status || "Pending"}
                              </span>
                            </div>
                            <div className="client-task-row__meta">
                              <div className="client-task-metric">
                                <span className="client-task-metric__label">Due Date</span>
                                <span>{formatDate(task.dueDate)}</span>
                              </div>
                              <div className="client-task-metric">
                                <span className="client-task-metric__label">Assigned Employee</span>
                                <span>{task.assignedTo?.name || "Unassigned"}</span>
                              </div>
                              <div className="client-task-metric">
                                <span className="client-task-metric__label">Priority</span>
                                <span>{task.priority || "Medium"}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-300" style={{ marginTop: 16 }}>
                No tasks generated for this client yet.
              </p>
            )}
          </div>
        );

      case "Documents":
        return (
          <div className="panel-card">
            <h2>Documents</h2>
            <p className="text-slate-300">Client documents and uploads live here.</p>
          </div>
        );

      case "Ledger":
        return (
          <div className="panel-card">
            <h2>Ledger</h2>
            <p className="text-slate-300">Ledger entries and transaction history.</p>
          </div>
        );

      case "Docs In-Out Register":
        return (
          <div className="panel-card">
            <h2>Docs In-Out Register</h2>
            <p className="text-slate-300">Track inbound and outbound documents here.</p>
          </div>
        );

      case "Passwords":
        return (
          <div className="panel-card">
            <h2>Passwords</h2>
            <p className="text-slate-300">Secure credentials and login details.</p>
          </div>
        );

      case "Expenses":
        return (
          <div className="panel-card">
            <h2>Expenses</h2>
            <p className="text-slate-300">Expense records and approvals.</p>
          </div>
        );

      case "DSC":
        return (
          <div className="panel-card">
            <h2>DSC</h2>
            <p className="text-slate-300">Digital signature certificate status.</p>
          </div>
        );

      case "Quotations":
        return (
          <div className="panel-card">
            <div className="section-header">
              <h2>Quotations</h2>
              <button
                type="button"
                className="button primary"
                onClick={() => navigate("/dashboard/quotations/new", { state: { clientContext: client } })}
              >
                New Quotation
              </button>
            </div>

            {quotationsLoading ? (
              <p className="text-slate-300" style={{ marginTop: 16 }}>Loading quotations...</p>
            ) : quotations.length === 0 ? (
              <div style={{ marginTop: 16 }}>
                <p className="text-slate-300">No quotations created for this client yet.</p>
              </div>
            ) : (
              <div className="quotation-table-wrapper" style={{ marginTop: 16 }}>
                <table className="quotation-table">
                  <thead>
                    <tr>
                      <th>Quotation No.</th>
                      <th>Date</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quotation) => (
                      <tr key={quotation._id}>
                        <td>{quotation.quotationNumber || "—"}</td>
                        <td>{formatDate(quotation.quotationDate)}</td>
                        <td>{quotation.totalAmount ? `₹${Number(quotation.totalAmount).toLocaleString("en-IN")}` : "₹0"}</td>
                        <td>{quotation.status || "Draft"}</td>
                        <td className="quotation-actions-cell">
                          <button type="button" className="button secondary" onClick={() => handleViewQuotation(quotation)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => navigate("/dashboard/quotations/new", { state: { quotationToEdit: quotation, clientContext: client } })}
                          >
                            Edit
                          </button>
                          <button type="button" className="button secondary" onClick={() => handleDownloadQuotation(quotation)}>
                            Download PDF
                          </button>
                          <button type="button" className="button danger" onClick={() => handleDeleteQuotation(quotation._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "Messaging":
        return (
          <div className="panel-card">
            <div className="section-header">
              <h2>Messaging</h2>
              <span className="badge badge-info">Messenger delivery</span>
            </div>
            <p className="text-slate-300" style={{ marginBottom: 16 }}>
              Send an outbound message to this client through the existing Messenger backend integration.
            </p>
            <form className="message-composer" onSubmit={handleSendClientMessage}>
              <label className="message-composer__field">
                <span>Channel</span>
                <select name="channel" value={messageForm.channel} onChange={handleMessageChange}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </label>
              <label className="message-composer__field">
                <span>Recipient</span>
                <input name="to" value={messageForm.to} onChange={handleMessageChange} placeholder="Email or mobile" />
              </label>
              <label className="message-composer__field">
                <span>Message</span>
                <textarea name="body" rows={5} value={messageForm.body} onChange={handleMessageChange} placeholder="Write your message" />
              </label>
              <button type="submit" className="button primary" disabled={messageSubmitting}>
                {messageSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  const handleOpenMessaging = () => {
    if (!client) return;

    const payload = {
      _id: client._id,
      name: client.name,
      email: client.email,
      mobile: client.mobile,
      phone: client.phone,
    };

    navigate("/dashboard/messages", { state: { client: payload } });
  };

  return (
    <DashboardLayout>
      <section className="client-details-page">
        <div className="client-header">
          <div className="client-header__copy">
            <p className="eyebrow">Clients</p>
            <h1 className="client-header__title">Client Details</h1>
            <p className="client-header__subtitle">
              Review client profile, performance, documents, and approvals in a CRM dashboard layout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="button secondary"
              onClick={handleOpenMessaging}
              disabled={!client}
            >
              Send Message
            </button>
            {hasRole(["SuperAdmin", "Partner"]) && (
              <Link className="button primary" to={`/dashboard/clients/${clientId}/edit`}>
                Edit Client
              </Link>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate("/dashboard/clients")}
            >
              Back to Clients
            </button>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading client details...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="client-layout">
            {renderHeroHeader()}

            <div className="client-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`client-tab-button ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="client-panel">{renderTabContent()}</div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ClientDetails;