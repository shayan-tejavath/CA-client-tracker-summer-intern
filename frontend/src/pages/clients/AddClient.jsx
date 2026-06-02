import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createClient } from "../../services/clientService.js";

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
  if (!data.clientName.trim())
    return "Client name is required.";

  if (!data.pan.trim())
    return "PAN is required.";

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
      data.pan.trim()
    )
  ) {
    return "PAN must be a valid format.";
  }

  if (!data.gstin.trim())
    return "GSTIN is required.";

  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
      data.gstin.trim()
    )
  ) {
    return "GSTIN must be a valid format.";
  }

  if (!data.mobile.trim())
    return "Mobile number is required.";

  if (
    !/^[0-9]{10,15}$/.test(
      data.mobile.trim()
    )
  ) {
    return "Mobile number must contain 10 to 15 digits.";
  }

  if (!data.email.trim())
    return "Email is required.";

  if (!/.+@.+\..+/.test(data.email.trim())) {
    return "Email must be valid.";
  }

  if (!data.address.trim())
    return "Address is required.";

  return null;
};

const AddClient = () => {
  const navigate = useNavigate();

  const [client, setClient] =
    useState(initialState);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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
        current.assignedServices.includes(
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

    const validationError =
      validateClient(client);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const customServicesArray =
        client.customServices
          .split(",")
          .map((service) =>
            service.trim()
          )
          .filter(Boolean);

      await createClient({
        ...client,
        assignedServices: [
          ...client.assignedServices,
          ...customServicesArray,
        ],
      });

      toast.success(
        "Client added successfully."
      );

      navigate(
        "/dashboard/clients",
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add client. Please try again."
      );

      toast.error(
        err.response?.data?.message ||
          "Unable to add client. Please try again."
      );
    } finally {
      setLoading(false);
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

            <h1>Add client</h1>

            <p>
              Create a complete client
              profile with compliance and
              service information.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-stack"
        >
          {/* BASIC INFO */}
          <label>
            Client name
            <input
              name="clientName"
              value={client.clientName}
              onChange={handleChange}
              placeholder="Client name"
              required
            />
          </label>

          <label>
            Client type
            <select
              name="clientType"
              value={client.clientType}
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
              value={client.status}
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

          {/* BUSINESS IDENTIFIERS */}
          <label>
            PAN
            <input
              name="pan"
              value={client.pan}
              onChange={handleChange}
              placeholder="ABCDE1234F"
              required
            />
          </label>

          <label>
            GSTIN
            <input
              name="gstin"
              value={client.gstin}
              onChange={handleChange}
              placeholder="22ABCDE1234F2Z5"
              required
            />
          </label>

          <label>
            TAN
            <input
              name="tan"
              value={client.tan}
              onChange={handleChange}
              placeholder="ABCD12345E"
            />
          </label>

          {/* CONTACT INFO */}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={client.email}
              onChange={handleChange}
              placeholder="client@example.com"
              required
            />
          </label>

          <label>
            Mobile
            <input
              name="mobile"
              value={client.mobile}
              onChange={handleChange}
              placeholder="Phone number"
              required
            />
          </label>

          <label>
            Assigned manager
            <input
              name="assignedManager"
              value={
                client.assignedManager
              }
              onChange={handleChange}
              placeholder="Manager name"
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
                      checked={client.assignedServices.includes(
                        service
                      )}
                      onChange={() =>
                        handleServiceToggle(
                          service
                        )
                      }
                    />

                    <span>{service}</span>
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
                client.customServices
              }
              onChange={handleChange}
              placeholder="Startup Registration, FEMA Consulting"
            />
          </label>

          {/* ADDRESS */}
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

          {/* NOTES */}
          <label>
            Internal Notes
            <textarea
              name="notes"
              value={client.notes}
              onChange={handleChange}
              placeholder="Internal notes about this client"
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
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save client"}
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                navigate(
                  "/dashboard/clients"
                )
              }
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AddClient;