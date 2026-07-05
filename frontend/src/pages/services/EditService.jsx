import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getServiceById, updateService, getWorkflowTemplates, createWorkflowTemplate } from "../../services/serviceService.js";

const SERVICE_CATEGORIES = ["GST", "Income Tax", "TDS", "ROC", "Audit", "Payroll", "PF & ESI", "Registration", "Certification", "Advisory"];

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
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSteps, setNewTemplateSteps] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadService = async () => {
      try {
        const data = await getServiceById(id);
        setService(data);
        setSelectedTemplateId(data.workflowTemplate || "");
        try {
          const tpl = await getWorkflowTemplates(id);
          setTemplates(Array.isArray(tpl) ? tpl : []);
        } catch (err) {
          // ignore template load errors for now
        }
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
      const payload = { ...service, workflowTemplateId: selectedTemplateId || null };
      await updateService(id, payload);
      toast.success("Service updated successfully.");
      navigate("/dashboard/services");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setNewTemplateName("");
    setNewTemplateSteps([""]);
    setShowCreateModal(true);
  };

  const addNewStep = () => setNewTemplateSteps((s) => [...s, ""]);
  const updateNewStep = (index, value) => setNewTemplateSteps((s) => s.map((v, i) => (i === index ? value : v)));
  const removeNewStep = (index) => setNewTemplateSteps((s) => s.filter((_, i) => i !== index));

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim();
    const steps = newTemplateSteps.map((t) => ({ title: String(t || "").trim(), order: 1 })).filter((t) => t.title);
    if (!name) return setError("Template name is required");
    if (!steps.length) return setError("At least one step is required");

    try {
      const created = await createWorkflowTemplate(id, { name, steps, isActive: true });
      setTemplates((cur) => [created, ...cur]);
      setSelectedTemplateId(created._id);
      setShowCreateModal(false);
      toast.success("Workflow template created and selected.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create template.");
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

            <label>
              Workflow template
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={selectedTemplateId || ""}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">No template</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                <button type="button" className="button secondary" onClick={openCreateModal}>
                  Create template
                </button>
              </div>
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

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create workflow template</h2>
              <button type="button" className="close-button" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <label>
                Name
                <input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
              </label>

              <div style={{ marginTop: 10 }}>
                <strong>Steps</strong>
                {newTemplateSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input value={step} onChange={(e) => updateNewStep(idx, e.target.value)} placeholder={`Step ${idx + 1}`} />
                    <button type="button" className="button secondary small" onClick={() => removeNewStep(idx)}>Remove</button>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="button secondary" onClick={addNewStep}>Add step</button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="button" className="button primary" onClick={handleCreateTemplate}>Create & select</button>
                <button type="button" className="button secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EditService;
