import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createClient } from "../../services/clientService.js";

const initialState = {
  clientName: "",
  pan: "",
  gstin: "",
  mobile: "",
  email: "",
  address: "",
  assignedServices: "",
};

const validateClient = (data) => {
  if (!data.clientName.trim()) return "Client name is required.";
  if (!data.pan.trim()) return "PAN is required.";
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(data.pan.trim())) return "PAN must be a valid format.";
  if (!data.gstin.trim()) return "GSTIN is required.";
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(data.gstin.trim())) return "GSTIN must be a valid format.";
  if (!data.mobile.trim()) return "Mobile number is required.";
  if (!/^[0-9]{10,15}$/.test(data.mobile.trim())) return "Mobile number must contain 10 to 15 digits.";
  if (!data.email.trim()) return "Email is required.";
  if (!/.+@.+\..+/.test(data.email.trim())) return "Email must be valid.";
  if (!data.address.trim()) return "Address is required.";
  return null;
};

const AddClient = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClient((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateClient(client);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await createClient({
        ...client,
        assignedServices: client.assignedServices
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),
      });
      toast.success("Client added successfully.");
      navigate("/dashboard/clients", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add client. Please try again.");
      toast.error(err.response?.data?.message || "Unable to add client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Clients</p>
            <h1>Add client</h1>
            <p>Create a new client record with contact details and service assignments.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
              <label>
            Client name
            <input name="clientName" value={client.clientName} onChange={handleChange} placeholder="Client name" required />
          </label>
          <label>
            PAN
            <input name="pan" value={client.pan} onChange={handleChange} placeholder="ABCDE1234F" required />
          </label>
          <label>
            GSTIN
            <input name="gstin" value={client.gstin} onChange={handleChange} placeholder="22ABCDE1234F2Z5" required />
          </label>
          <label>
            TAN
            <input name="tan" value={client.tan} onChange={handleChange} placeholder="ABCD12345E" />
          </label>
          <label>
            Email
            <input name="email" type="email" value={client.email} onChange={handleChange} placeholder="client@example.com" required />
          </label>
          <label>
            Mobile
            <input name="mobile" value={client.mobile} onChange={handleChange} placeholder="Phone number" required />
          </label>
          <label>
            Assigned services
            <input
              name="assignedServices"
              value={client.assignedServices}
              onChange={handleChange}
              placeholder="Comma-separated services"
            />
          </label>
          <label>
            Address
            <textarea
              name="address"
              value={client.address}
              onChange={handleChange}
              placeholder="Address"
              rows="4"
              required
            />
          </label>
          {error && <div className="alert danger">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Saving..." : "Save client"}
            </button>
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/clients")}>Cancel</button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AddClient;
