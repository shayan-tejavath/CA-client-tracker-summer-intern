import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClientById, updateClient } from "../../services/clientService.js";

const EditClient = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClient((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateClient(clientId, {
        ...client,
        assignedServices: client.assignedServices
          ?.split(",")
          .map((service) => service.trim())
          .filter(Boolean),
      });
      toast.success("Client updated successfully.");
      navigate(`/dashboard/clients/${clientId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Clients</p>
            <h1>Edit client</h1>
            <p>Update contact information, service settings, and client notes.</p>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading client data…</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Client name
              <input name="clientName" value={client.clientName || ""} onChange={handleChange} placeholder="Client name" required />
            </label>
            <label>
              PAN
              <input name="pan" value={client.pan || ""} onChange={handleChange} placeholder="ABCDE1234F" required />
            </label>
            <label>
              GSTIN
              <input name="gstin" value={client.gstin || ""} onChange={handleChange} placeholder="22ABCDE1234F2Z5" required />
            </label>
            <label>
              TAN
              <input name="tan" value={client.tan || ""} onChange={handleChange} placeholder="ABCD12345E" />
            </label>
            <label>
              Email
              <input name="email" type="email" value={client.email || ""} onChange={handleChange} placeholder="client@example.com" required />
            </label>
            <label>
              Mobile
              <input name="mobile" value={client.mobile || ""} onChange={handleChange} placeholder="Phone number" required />
            </label>
            <label>
              Assigned services
              <input
                name="assignedServices"
                value={client.assignedServices?.join(", ") || ""}
                onChange={handleChange}
                placeholder="Comma-separated services"
              />
            </label>
            <label>
              Address
              <textarea name="address" value={client.address || ""} onChange={handleChange} placeholder="Billing address" rows="4" />
            </label>
            {error && <div className="alert danger">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="button primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="button secondary" onClick={() => navigate(`/dashboard/clients/${clientId}`)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
};

export default EditClient;
