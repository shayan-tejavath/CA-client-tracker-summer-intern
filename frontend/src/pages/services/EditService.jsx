import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getServiceById, updateService } from "../../services/serviceService.js";

const SERVICE_CATEGORIES = ["GST", "Income Tax", "TDS", "ROC", "Audit"];

const validateService = (data) => {
  if (!data.subService.trim()) return "Service name is required.";
  if (!data.serviceCategory.trim()) return "Service category is required.";
  if (!data.frequency.trim()) return "Frequency is required.";
  return null;
};

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadService = async () => {
      try {
        const data = await getServiceById(id);
        setService(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load service details.");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setService((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const validationError = validateService(service);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      await updateService(id, service);
      toast.success("Service updated successfully.");
      navigate("/dashboard/services");
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
            <p className="eyebrow">Services</p>
            <h1>Edit service</h1>
            <p>Update the service name, category, frequency, and description.</p>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading service data…</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Service name
              <input
                name="subService"
                value={service.subService || ""}
                onChange={handleChange}
                placeholder="e.g. GST Filing"
                required
              />
            </label>

            <label>
              Service category
              <select
                name="serviceCategory"
                value={service.serviceCategory || SERVICE_CATEGORIES[0]}
                onChange={handleChange}
                required
              >
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
                value={service.frequency || ""}
                onChange={handleChange}
                placeholder="Monthly, Quarterly, Yearly"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={service.description || ""}
                onChange={handleChange}
                placeholder="Write a short description for the service"
                rows="4"
              />
            </label>

            {error && <div className="alert danger">{error}</div>}

            <div className="form-actions">
              <button type="submit" className="button primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="button secondary" onClick={() => navigate("/dashboard/services")}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
};

export default EditService;
