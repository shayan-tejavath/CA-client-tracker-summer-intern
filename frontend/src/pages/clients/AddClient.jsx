import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createClient } from "../../services/clientService.js";
import "../../styles/add-client.css";

const serviceOptions = [
  "GST Filing",
  "Income Tax Return",
  "TDS Filing",
  "ROC Compliance",
  "Audit",
  "Bookkeeping",
  "Payroll",
];

const initialState = {
  clientName: "",
  pan: "",
  gstin: "",
  tan: "",
  mobile: "",
  email: "",
  address: "",
  clientType: "Business",
  status: "Active",
  assignedManager: "",
  notes: "",
  assignedServices: [],
  customServices: "",
};

const validateClient = (data) => {
  if (!data.clientName.trim()) return "Client name is required.";

  if (!data.pan.trim()) return "PAN is required.";

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(data.pan.trim())) {
    return "PAN must be a valid format.";
  }

  if (!data.gstin.trim()) return "GSTIN is required.";

  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
      data.gstin.trim()
    )
  ) {
    return "GSTIN must be a valid format.";
  }

  if (!data.mobile.trim()) return "Mobile number is required.";

  if (!/^[0-9]{10,15}$/.test(data.mobile.trim())) {
    return "Mobile number must contain 10 to 15 digits.";
  }

  if (!data.email.trim()) return "Email is required.";

  if (!/.+@.+\..+/.test(data.email.trim())) {
    return "Email must be valid.";
  }

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

    setClient((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleServiceToggle = (service) => {
    setClient((current) => {
      const alreadySelected = current.assignedServices.includes(service);

      return {
        ...current,
        assignedServices: alreadySelected
          ? current.assignedServices.filter((item) => item !== service)
          : [...current.assignedServices, service],
      };
    });
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
      const customServicesArray = client.customServices
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean);

      await createClient({
        ...client,
        assignedServices: [...client.assignedServices, ...customServicesArray],
      });

      toast.success("Client added successfully.");

      navigate("/dashboard/clients", {
        replace: true,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to add client. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-content add-client-page">
        <section className="page-header add-client-page__header">
          <div>
            <span className="eyebrow">Clients</span>
            <h1>Add client</h1>
            <p>Create a complete client profile with compliance and service information.</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="page-card add-client-form">
          <div className="form-section">
            <div className="section-head">
              <h2>Client details</h2>
              <p>Basic identity and classification information.</p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  name="clientName"
                  value={client.clientName}
                  onChange={handleChange}
                  placeholder="Client name"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="clientType">Client type</label>
                <select
                  id="clientType"
                  name="clientType"
                  value={client.clientType}
                  onChange={handleChange}
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Private Limited">Private Limited</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={client.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="assignedManager">Assigned manager</label>
                <input
                  id="assignedManager"
                  name="assignedManager"
                  value={client.assignedManager}
                  onChange={handleChange}
                  placeholder="Manager name"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-head">
              <h2>Compliance identifiers</h2>
              <p>Official tax and registration numbers.</p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="pan">PAN</label>
                <input
                  id="pan"
                  name="pan"
                  value={client.pan}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="gstin">GSTIN</label>
                <input
                  id="gstin"
                  name="gstin"
                  value={client.gstin}
                  onChange={handleChange}
                  placeholder="22ABCDE1234F2Z5"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="tan">TAN</label>
                <input
                  id="tan"
                  name="tan"
                  value={client.tan}
                  onChange={handleChange}
                  placeholder="ABCD12345E"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-head">
              <h2>Contact details</h2>
              <p>Primary communication and location details.</p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={client.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="mobile">Mobile</label>
                <input
                  id="mobile"
                  name="mobile"
                  value={client.mobile}
                  onChange={handleChange}
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className="field field--full">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={client.address}
                  onChange={handleChange}
                  placeholder="Address"
                  rows="4"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-head">
              <h2>Services</h2>
              <p>Assign standard services and add custom service names.</p>
            </div>

            <div className="services-grid">
              {serviceOptions.map((service) => {
                const checked = client.assignedServices.includes(service);

                return (
                  <label
                    key={service}
                    className={`service-checkbox ${checked ? "service-checkbox--active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleServiceToggle(service)}
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>

            <div className="field field--spaced">
              <label htmlFor="customServices">Custom Services</label>
              <input
                id="customServices"
                name="customServices"
                value={client.customServices}
                onChange={handleChange}
                placeholder="Startup Registration, FEMA Consulting"
              />
              <p className="field-hint">
                Separate multiple services with commas.
              </p>
            </div>
          </div>

          <div className="form-section">
            <div className="section-head">
              <h2>Internal notes</h2>
              <p>Private remarks for your team.</p>
            </div>

            <div className="field">
              <label htmlFor="notes">Internal Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={client.notes}
                onChange={handleChange}
                placeholder="Internal notes about this client"
                rows="4"
              />
            </div>
          </div>

          {error && (
            <div className="alert danger form-alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate("/dashboard/clients")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save client"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddClient;