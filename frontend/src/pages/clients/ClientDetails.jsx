import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClientById } from "../../services/clientService.js";

const ClientDetails = () => {
  const { clientId } = useParams();

  const navigate = useNavigate();

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
      <section className="page-card">
        <div className="client-profile-header">
          <div className="client-profile-left">
            <div className="client-avatar">
              {client?.clientName?.charAt(0) || "C"}
            </div>

            <div>
              <p className="eyebrow">Client Profile</p>

              <h1>
                {loading
                  ? "Loading..."
                  : client?.clientName}
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

                  <span>
                    {client?.clientType || "Business"}
                  </span>

                  <span>
                    Created{" "}
                    {new Date(
                      client?.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="page-tools">
            <Link
              className="button primary"
              to={`/dashboard/clients/${clientId}/edit`}
            >
              Edit Client
            </Link>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate("/dashboard/clients")
              }
            >
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="alert">
            Loading client profile...
          </div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="client-profile-layout">
            {/* LEFT SECTION */}

            <div className="client-main-section">
              {/* CONTACT INFO */}

              <div className="client-section-card">
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

                  <div className="info-item wide">
                    <span>Address</span>
                    <strong>{client.address || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* COMPLIANCE */}

              <div className="client-section-card">
                <div className="section-header">
                  <h2>Compliance Information</h2>
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
              </div>

              {/* SERVICES */}

              <div className="client-section-card">
                <div className="section-header">
                  <h2>Assigned Services</h2>
                </div>

                <div className="service-tags">
                  {client.assignedServices?.length > 0 ? (
                    client.assignedServices.map(
                      (service, index) => (
                        <span
                          key={index}
                          className="service-tag"
                        >
                          {service}
                        </span>
                      )
                    )
                  ) : (
                    <p>No services assigned.</p>
                  )}
                </div>
              </div>

              {/* NOTES */}

              <div className="client-section-card">
                <div className="section-header">
                  <h2>Internal Notes</h2>
                </div>

                <div className="notes-box">
                  {client.notes ||
                    "No internal notes added yet."}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}

            <div className="client-sidebar">
              <div className="client-section-card">
                <div className="section-header">
                  <h2>Assigned Manager</h2>
                </div>

                <div className="manager-card">
                  <div className="manager-avatar">
                    A
                  </div>

                  <div>
                    <strong>
                      {client.assignedManager ||
                        "Not Assigned"}
                    </strong>

                    <p>Client Relationship Manager</p>
                  </div>
                </div>
              </div>

              <div className="client-section-card">
                <div className="section-header">
                  <h2>Activity Timeline</h2>
                </div>

                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>

                    <div>
                      <strong>
                        Client profile created
                      </strong>

                      <p>
                        {new Date(
                          client.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot"></div>

                    <div>
                      <strong>
                        Services assigned
                      </strong>

                      <p>
                        Client onboarding completed
                      </p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot"></div>

                    <div>
                      <strong>
                        Compliance verification
                      </strong>

                      <p>
                        PAN & GSTIN validated
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ClientDetails;
