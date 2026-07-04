import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Workflow } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  createWorkflowTemplate,
  deleteWorkflowTemplate,
  getServices,
  getWorkflowTemplates,
  updateWorkflowTemplate,
} from "../../services/serviceService.js";

const createEmptyStep = () => ({
  title: "",
  description: "",
  priority: "Medium",
  estimatedDays: "",
});

const WorkflowTemplatesPage = () => {
  const { user } = useAuth();
  const canManage = ["SuperAdmin", "Partner", "Manager"].includes(user?.role);

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [steps, setSteps] = useState([createEmptyStep()]);
  const [editingTemplateId, setEditingTemplateId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await getServices();
        const serviceList = Array.isArray(data) ? data : [];
        setServices(serviceList);

        if (serviceList.length === 0) {
          setSelectedServiceId("");
          setTemplates([]);
          return;
        }

        setSelectedServiceId((current) => {
          if (current && serviceList.some((service) => service._id === current)) {
            return current;
          }

          return serviceList[0]?._id || "";
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load services.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setTemplates([]);
      return;
    }

    const loadTemplates = async () => {
      try {
        const data = await getWorkflowTemplates(selectedServiceId);
        setTemplates(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load workflow templates.");
      }
    };

    loadTemplates();
  }, [selectedServiceId]);

  const resetForm = () => {
    setTemplateName("");
    setSteps([createEmptyStep()]);
    setEditingTemplateId("");
    setIsActive(true);
    setFormError("");
  };

  const handleStepChange = (index, field, value) => {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? { ...step, [field]: value } : step))
    );
  };

  const addStep = () => {
    setSteps((current) => [...current, createEmptyStep()]);
  };

  const removeStep = (index) => {
    setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
  };

  const moveStep = (index, direction) => {
    setSteps((current) => {
      if (index < 0 || index >= current.length) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const nextSteps = [...current];
      const [moved] = nextSteps.splice(index, 1);
      nextSteps.splice(targetIndex, 0, moved);
      return nextSteps;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = templateName.trim();
    const normalizedSteps = steps
      .filter((step) => step.title?.trim())
      .map((step, index) => ({
        title: step.title.trim(),
        description: step.description?.trim() || "",
        priority: step.priority || "Medium",
        estimatedDays: step.estimatedDays === "" ? undefined : Number(step.estimatedDays),
        order: index + 1,
      }));

    if (!trimmedName) {
      setFormError("Template name is required.");
      return;
    }

    if (!normalizedSteps.length) {
      setFormError("Add at least one workflow step.");
      return;
    }

    if (!selectedServiceId) {
      setFormError("Select a service before saving a template.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        name: trimmedName,
        steps: normalizedSteps,
        isActive,
      };

      if (editingTemplateId) {
        const updated = await updateWorkflowTemplate(selectedServiceId, editingTemplateId, payload);
        setTemplates((current) =>
          current.map((template) => (template._id === updated._id ? updated : template))
        );
        toast.success("Workflow template updated.");
      } else {
        const created = await createWorkflowTemplate(selectedServiceId, payload);
        setTemplates((current) => [created, ...current]);
        toast.success("Workflow template created.");
      }

      resetForm();
    } catch (error) {
      setFormError(error.response?.data?.message || "Unable to save workflow template.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplateId(template._id);
    setTemplateName(template.name || "");
    setIsActive(template.isActive !== false);
    setSteps(
      (template.taskDefinitions || []).map((step) => ({
        title: step.title || "",
        description: step.description || "",
        priority: step.priority || "Medium",
        estimatedDays: step.estimatedDays ?? "",
      }))
    );
    setFormError("");
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Delete this workflow template?")) return;

    try {
      await deleteWorkflowTemplate(selectedServiceId, templateId);
      setTemplates((current) => current.filter((template) => template._id !== templateId));
      if (editingTemplateId === templateId) {
        resetForm();
      }
      toast.success("Workflow template deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete workflow template.");
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header" style={{ alignItems: "flex-start" }}>
          <div style={{ maxWidth: 760 }}>
            <p className="eyebrow">Workflow templates</p>
            <h1>Template management</h1>
            <p>
              Create reusable workflow sequences for services, manage their steps, and keep them in a
              consistent order.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading services...</div>
        ) : !canManage ? (
          <div className="alert danger">You do not have access to manage workflow templates.</div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <label style={{ display: "grid", gap: 8, fontWeight: 600 }}>
                Select service
                <select
                  value={selectedServiceId}
                  onChange={(event) => setSelectedServiceId(event.target.value)}
                  disabled={services.length === 0}
                >
                  {services.length === 0 ? (
                    <option value="">No services available</option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.subService || service.serviceCategory || service._id}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            {services.length === 0 ? (
              <div className="alert">Create a service first to start managing workflow templates.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                <div className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Workflow size={18} />
                    <h2 style={{ margin: 0 }}>{editingTemplateId ? "Edit template" : "New template"}</h2>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                    <label style={{ display: "grid", gap: 8 }}>
                      Template name
                      <input
                        type="text"
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        placeholder="e.g. GST Registration Starter"
                      />
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(event) => setIsActive(event.target.checked)}
                      />
                      <span>Active for new assignments</span>
                    </label>

                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>Workflow steps</strong>
                        <button type="button" className="button secondary small" onClick={addStep}>
                          <Plus size={14} />
                          Add step
                        </button>
                      </div>

                      {steps.map((step, index) => (
                        <div key={`${step.title || "step"}-${index}`} className="card" style={{ padding: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <strong>Step {index + 1}</strong>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="button secondary small"
                                onClick={() => moveStep(index, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="button secondary small"
                                onClick={() => moveStep(index, "down")}
                                disabled={index === steps.length - 1}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                className="button danger small"
                                onClick={() => removeStep(index)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <label style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                            Title
                            <input
                              type="text"
                              value={step.title}
                              onChange={(event) => handleStepChange(index, "title", event.target.value)}
                              placeholder="Collect documents"
                            />
                          </label>

                          <label style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                            Description
                            <textarea
                              rows={2}
                              value={step.description}
                              onChange={(event) => handleStepChange(index, "description", event.target.value)}
                              placeholder="Optional instructions"
                            />
                          </label>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <label style={{ display: "grid", gap: 8 }}>
                              Priority
                              <select
                                value={step.priority}
                                onChange={(event) => handleStepChange(index, "priority", event.target.value)}
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </label>

                            <label style={{ display: "grid", gap: 8 }}>
                              Estimated days
                              <input
                                type="number"
                                min="0"
                                value={step.estimatedDays}
                                onChange={(event) => handleStepChange(index, "estimatedDays", event.target.value)}
                                placeholder="0"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    {formError ? <div className="alert danger">{formError}</div> : null}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="submit" className="button primary" disabled={saving}>
                        {saving ? "Saving..." : editingTemplateId ? "Update template" : "Save template"}
                      </button>
                      {editingTemplateId ? (
                        <button type="button" className="button secondary" onClick={resetForm}>
                          Cancel edit
                        </button>
                      ) : null}
                    </div>
                  </form>
                </div>

                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <h2 style={{ margin: 0 }}>Available templates</h2>
                    <span className="badge badge-info">{templates.length}</span>
                  </div>

                  {templates.length === 0 ? (
                    <div className="alert">No workflow templates created for this service yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {templates.map((template) => (
                        <div key={template._id} className="card" style={{ padding: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                            <div>
                              <strong>{template.name}</strong>
                              <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>
                                {(template.taskDefinitions || []).map((step) => step.title).join(" → ") || "No steps"}
                              </div>
                            </div>
                            <span className={`badge ${template.isActive === false ? "" : "badge-info"}`}>
                              {template.isActive === false ? "Inactive" : "Active"}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            <button
                              type="button"
                              className="button secondary small"
                              onClick={() => handleEdit(template)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button danger small"
                              onClick={() => handleDelete(template._id)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default WorkflowTemplatesPage;
