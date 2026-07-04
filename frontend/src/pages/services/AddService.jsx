import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createService } from "../../services/serviceService.js";

const SERVICE_CATEGORIES = ["GST", "Income Tax", "TDS", "ROC", "Audit", "Payroll", "PF & ESI", "Registration", "Certification", "Advisory"];

const initialState = {
  serviceCategory: SERVICE_CATEGORIES[0],
  subService: "",
  frequency: "Monthly",
  description: "",
};

const validateService = (data) => {
  if (!data.subService.trim()) return "Service name is required.";
  if (!data.serviceCategory.trim()) return "Service category is required.";
  if (!data.frequency.trim()) return "Frequency is required.";
  return null;
};

const AddService = () => {
  const navigate = useNavigate();
  const [service, setService] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setService((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateService(service);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await createService(service);
      toast.success("Service added successfully.");
      navigate("/dashboard/services", { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Unable to add service. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Services</p>
            <h1>Add service</h1>
            <p>Create a new service offering with a clear name, category, and description.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Service name
            <input
              name="subService"
              value={service.subService}
              onChange={handleChange}
              placeholder="e.g. GST Filing"
              required
            />
          </label>

          <label>
            Service category
            <select name="serviceCategory" value={service.serviceCategory} onChange={handleChange} required>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Frequency
            <input
              name="frequency"
              value={service.frequency}
              onChange={handleChange}
              placeholder="Monthly, Quarterly, Yearly"
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={service.description}
              onChange={handleChange}
              placeholder="Write a short description for the service"
              rows="4"
            />
          </label>

          {error && <div className="alert danger">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Saving..." : "Create service"}
            </button>
            <button type="button" className="button secondary" onClick={() => navigate("/dashboard/services")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AddService;
