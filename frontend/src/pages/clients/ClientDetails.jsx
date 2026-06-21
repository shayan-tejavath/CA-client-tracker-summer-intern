import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { usePermission } from "../../hooks/usePermission.js";
import { getClientById } from "../../services/clientService.js";

import "../../styles/client-details.css";

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = usePermission();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data = await getClientById(clientId);
        setClient(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load client details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "active";
      case "Pending":
        return "pending";
      case "Inactive":
        return "inactive";
      default:
        return "active";
    }
  };

  return (
    <DashboardLayout>
      <div className="page-content client-details-page">
        <section className="page-header client-details-header">
          <div className="client-details-header__copy">
            <span className="eyebrow">Client Profile</span>
            <div className="client-details-header__title-row">
              <div className="client-avatar">
                {client?.clientName?.charAt(0) || "C"}
              </div>

              <div>
                <h1>
                  {loading ? "Loading..." : client?.clientName}
                </h1>

                {!loading && !error && (
                  <div className="client-meta-row">
                    <span
                      className={`status-badge ${getStatusClass(
                        client?.status
                      )}`}
                    >
                      {client?.status || "Active"}
                    </span>

                    <span className="meta-pill">
                      {client?.clientType || "Business"}
                    </span>

                    <span className="meta-pill">
                      Created{" "}
                      {client?.createdAt
                        ? new Date(client.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p>
              Client compliance profile, services, contacts, and internal notes.
            </p>
          </div>

          <div className="page-tools">
            {hasRole(["SuperAdmin", "Partner"]) && (
              <Link
                className="button primary"
                to={`/dashboard/clients/${clientId}/edit`}
              >
                Edit Client
              </Link>
            )}

            <button
              type="button"
              className="button secondary"
              onClick={() => navigate("/dashboard/clients")}
            >
              Back
            </button>
          </div>
        </section>

        {loading ? (
          <div className="page-card client-details-state">
            <div className="client-details-spinner" />
            <h3>Loading client profile...</h3>
            <p>Fetching the latest compliance and account details.</p>
          </div>
        ) : error ? (
          <div className="alert danger client-details-alert">{error}</div>
        ) : (
          <div className="client-details-layout">
            <div className="client-main-section">
              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Contact Information</div>
                  <div className="card-description">
                    Primary communication details for this client.
                  </div>
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

                  <div className="info-item info-item--wide">
                    <span>Address</span>
                    <strong>{client.address || "—"}</strong>
                  </div>
                </div>
              </article>

              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Compliance Information</div>
                  <div className="card-description">
                    Tax identifiers and registration details.
                  </div>
                </div>

                <div className="compliance-grid">
                  <div className="compliance-card">
                    <span>PAN</span>
                    <strong>{client.pan || "—"}</strong>
                  </div>

                  <div className="compliance-card">
                    <span>GSTIN</span>
                    <strong>{client.gstin || "—"}</strong>
                  </div>

                  <div className="compliance-card">
                    <span>TAN</span>
                    <strong>{client.tan || "—"}</strong>
                  </div>
                </div>
              </article>

              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Assigned Services</div>
                  <div className="card-description">
                    Services mapped to this client account.
                  </div>
                </div>

                <div className="service-tags">
                  {client.assignedServices?.length > 0 ? (
                    client.assignedServices.map((service, index) => (
                      <span key={index} className="service-tag">
                        {service}
                      </span>
                    ))
                  ) : (
                    <p className="empty-inline">No services assigned.</p>
                  )}
                </div>
              </article>

              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Internal Notes</div>
                  <div className="card-description">
                    Team notes and private observations.
                  </div>
                </div>

                <div className="notes-box">
                  {client.notes || "No internal notes added yet."}
                </div>
              </article>
            </div>

            <aside className="client-sidebar">
              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Assigned Manager</div>
                  <div className="card-description">
                    Relationship owner for this client.
                  </div>
                </div>

                <div className="manager-card">
                  <div className="manager-avatar">
                    {client?.assignedManager?.charAt(0) || "A"}
                  </div>

                  <div>
                    <strong>{client.assignedManager || "Not Assigned"}</strong>
                    <p>Client Relationship Manager</p>
                  </div>
                </div>
              </article>

              <article className="page-card client-section-card">
                <div className="card-header">
                  <div className="card-title">Activity Timeline</div>
                  <div className="card-description">
                    Important account milestones.
                  </div>
                </div>

                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <strong>Client profile created</strong>
                      <p>
                        {client?.createdAt
                          ? new Date(client.createdAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <strong>Services assigned</strong>
                      <p>Client onboarding completed</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <strong>Compliance verification</strong>
                      <p>PAN &amp; GSTIN validated</p>
                    </div>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDetails;