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
        setError(err.response?.data?.message || "Unable to load client details.");
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Clients</p>
            <h1>Client details</h1>
            <p>Review the full client profile, service assignment, and contact data.</p>
          </div>
          <div className="page-tools">
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/clients")}>Back to list</button>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading client profile…</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="client-details-grid">
            <div className="detail-card">
              <p className="detail-label">Name</p>
              <p>{client.clientName}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Email</p>
              <p>{client.email || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">Mobile</p>
              <p>{client.mobile || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">PAN</p>
              <p>{client.pan || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">GSTIN</p>
              <p>{client.gstin || "—"}</p>
            </div>
            <div className="detail-card">
              <p className="detail-label">TAN</p>
              <p>{client.tan || "—"}</p>
            </div>
            <div className="detail-card wide-card">
              <p className="detail-label">Services</p>
              <p>{client.assignedServices?.join(", ") || "—"}</p>
            </div>
            <div className="detail-card wide-card">
              <p className="detail-label">Address</p>
              <p>{client.address || "—"}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="page-actions">
            <Link className="button primary" to={`/dashboard/clients/${clientId}/edit`}>Edit client</Link>
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/clients")}>Return to list</button>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ClientDetails;
