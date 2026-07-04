import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { usePermission } from "../../hooks/usePermission.js";
import { getClientById } from "../../services/clientService.js";
import { getServices } from "../../services/serviceService.js";
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
];

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = usePermission();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState("Details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    clientPortal: true,
    documentSharing: false,
    autoReminders: true,
    financeApproval: false,
  });

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        setError("");

        const [clientData, serviceData] = await Promise.all([
          getClientById(clientId),
          getServices(),
        ]);

        setClient(clientData);
        setServices(Array.isArray(serviceData) ? serviceData : serviceData?.services || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load client details.");
      } finally {
        setLoading(false);
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
    if (Array.isArray(client.tasks)) {
      return client.tasks.filter((task) => task.status === type).length;
    }
    if (type === "Pending") return client.pendingTaskCount ?? 0;
    if (type === "In Progress") return client.inProgressTaskCount ?? 0;
    if (type === "Completed") return client.completedTaskCount ?? 0;
    return 0;
  };

  const getDocumentCount = () => {
    if (!client) return 0;
    if (Array.isArray(client.documents)) return client.documents.length;
    return client.documentCount ?? 0;
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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
            <h2>Tasks</h2>
            <p className="text-slate-300">Task breakdown and progress will appear here.</p>
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
            <h2>Quotations</h2>
            <p className="text-slate-300">Create and manage client quotations.</p>
          </div>
        );

      default:
        return null;
    }
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