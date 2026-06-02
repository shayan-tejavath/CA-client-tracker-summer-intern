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
      <section className="page-card">

        <div className="page-header">
          <div>
            <p className="eyebrow">
              Clients
            </p>

            <h1>Edit client</h1>

            <p>
              Update client profile,
              services, and compliance
              information.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="alert">
            Loading client data…
          </div>
        ) : error ? (
          <div className="alert danger">
            {error}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="form-stack"
          >

            <label>
              Client name
              <input
                name="clientName"
                value={
                  client.clientName || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Client type
              <select
                name="clientType"
                value={
                  client.clientType ||
                  "Business"
                }
                onChange={handleChange}
              >
                <option value="Individual">
                  Individual
                </option>

                <option value="Business">
                  Business
                </option>

                <option value="Partnership">
                  Partnership
                </option>

                <option value="LLP">
                  LLP
                </option>

                <option value="Private Limited">
                  Private Limited
                </option>
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={
                  client.status ||
                  "Active"
                }
                onChange={handleChange}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Inactive">
                  Inactive
                </option>

                <option value="Archived">
                  Archived
                </option>
              </select>
            </label>

            <label>
              PAN
              <input
                name="pan"
                value={client.pan || ""}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              GSTIN
              <input
                name="gstin"
                value={
                  client.gstin || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              TAN
              <input
                name="tan"
                value={client.tan || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={
                  client.email || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Mobile
              <input
                name="mobile"
                value={
                  client.mobile || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Assigned manager
              <input
                name="assignedManager"
                value={
                  client.assignedManager ||
                  ""
                }
                onChange={handleChange}
              />
            </label>

            {/* SERVICES */}
            <div>
              <p className="detail-label">
                Assigned Services
              </p>

              <div className="services-grid">
                {serviceOptions.map(
                  (service) => (
                    <label
                      key={service}
                      className="service-checkbox"
                    >
                      <input
                        type="checkbox"
                        checked={client.assignedServices?.includes(
                          service
                        )}
                        onChange={() =>
                          handleServiceToggle(
                            service
                          )
                        }
                      />

                      <span>
                        {service}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* CUSTOM SERVICES */}
            <label>
              Custom Services
              <input
                name="customServices"
                value={
                  client.customServices ||
                  ""
                }
                onChange={handleChange}
                placeholder="Startup Registration, FEMA Consulting"
              />
            </label>

            <label>
              Address
              <textarea
                name="address"
                value={
                  client.address || ""
                }
                onChange={handleChange}
                rows="4"
              />
            </label>

            <label>
              Internal Notes
              <textarea
                name="notes"
                value={
                  client.notes || ""
                }
                onChange={handleChange}
                rows="4"
              />
            </label>

            {error && (
              <div className="alert danger">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>

              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  navigate(
                    `/dashboard/clients/${clientId}`
                  )
                }
              >
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