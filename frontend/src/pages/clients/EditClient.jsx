import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getClientById,
  updateClient,
} from "../../services/clientService.js";

import "../../styles/edit-client.css";

const serviceOptions = [
  "GST Filing",
  "Income Tax Return",
  "TDS Filing",
  "ROC Compliance",
  "Audit",
  "Bookkeeping",
  "Payroll",
];

const EditClient = () => {
  const { clientId } = useParams();

  const navigate = useNavigate();

  const [client, setClient] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data =
          await getClientById(clientId);

        setClient({
          ...data,
          customServices: "",
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setClient((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleServiceToggle = (
    service
  ) => {
    setClient((current) => {
      const alreadySelected =
        current.assignedServices?.includes(
          service
        );

      return {
        ...current,
        assignedServices:
          alreadySelected
            ? current.assignedServices.filter(
                (item) =>
                  item !== service
              )
            : [
                ...current.assignedServices,
                service,
              ],
      };
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    setSaving(true);

    try {
      const customServicesArray =
        client.customServices
          .split(",")
          .map((service) =>
            service.trim()
          )
          .filter(Boolean);

      await updateClient(clientId, {
        ...client,
        assignedServices: [
          ...client.assignedServices,
          ...customServicesArray,
        ],
      });

      toast.success(
        "Client updated successfully."
      );

      navigate(
        `/dashboard/clients/${clientId}`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-content edit-client-page">
        <section className="page-header edit-client-page__header">
          <div>
            <span className="eyebrow">Clients</span>
            <h1>Edit client</h1>
            <p>
              Update client profile, services, and compliance information.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="page-card edit-client-state">
            <div className="edit-client-spinner" />
            <h3>Loading client data…</h3>
            <p>Fetching the latest profile details.</p>
          </div>
        ) : error ? (
          <div className="alert danger edit-client-alert">
            {error}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="page-card edit-client-form"
          >
            <div className="form-section">
              <div className="section-head">
                <h2>Client details</h2>
                <p>Core identity and account classification.</p>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="clientName">Client name</label>
                  <input
                    id="clientName"
                    name="clientName"
                    value={client.clientName || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="clientType">Client type</label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={client.clientType || "Business"}
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
                    value={client.status || "Active"}
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
                    value={client.assignedManager || ""}
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
                    value={client.pan || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="gstin">GSTIN</label>
                  <input
                    id="gstin"
                    name="gstin"
                    value={client.gstin || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="tan">TAN</label>
                  <input
                    id="tan"
                    name="tan"
                    value={client.tan || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-head">
                <h2>Contact details</h2>
                <p>Primary communication and location information.</p>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={client.email || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="mobile">Mobile</label>
                  <input
                    id="mobile"
                    name="mobile"
                    value={client.mobile || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field field--full">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={client.address || ""}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-head">
                <h2>Services</h2>
                <p>Select standard services and add custom service names.</p>
              </div>

              <div className="services-grid">
                {serviceOptions.map((service) => {
                  const checked =
                    client.assignedServices?.includes(service);

                  return (
                    <label
                      key={service}
                      className={`service-checkbox ${
                        checked ? "service-checkbox--active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          handleServiceToggle(service)
                        }
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
                  value={client.customServices || ""}
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
                <p>Private remarks for the team.</p>
              </div>

              <div className="field">
                <label htmlFor="notes">Internal Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={client.notes || ""}
                  onChange={handleChange}
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
                onClick={() =>
                  navigate(`/dashboard/clients/${clientId}`)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditClient;