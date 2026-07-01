import { useEffect, useMemo, useRef, useState } from "react";
import { FaEllipsisV, FaGripVertical, FaTrashAlt, FaUsers, FaClipboardList, FaTasks, FaFileAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  getServiceById,
  updateService,
  getAvailableClients,
  getAssignedClients,
  assignClientsToService,
  updateServiceAssignment,
  bulkUpdateAssignments,
  removeClientFromService,
  bulkRemoveClientsFromService,
} from "../../services/serviceService.js";

import "./service-details.css";

const tabs = [
  "Settings",
  "Checklist",
  "Subtasks",
  "Custom Fields",
  "Clients",
  "Supporting Files",
];

const defaultServiceSettings = {
  enabled: true,
  recurring: true,
  autoTaskFrequency: "Weekly",
  creationDate: "",
  dueDate: "",
  targetDateFormula: "Invoice date + 7 days",
  taskCreationOptions: {
    createOnServiceAdd: true,
    createOnDueDate: false,
    createOnClientOnboard: false,
  },
  sacCode: "",
  gstPercentage: 18,
  defaultBillingRate: "",
  billableTask: true,
  gstReturnType: "GSTR-1",
  gstIntegration: {
    syncFilingStatus: true,
    fetchReturnStatus: false,
  },
  documentRequirements: {
    panProof: true,
    gstProof: true,
    bankStatement: false,
    invoiceCopy: false,
    customDocs: "",
  },
};

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Settings");

  const [checklist, setChecklist] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [availableClients, setAvailableClients] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClientsToAssign, setSelectedClientsToAssign] = useState({});
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [sortField, setSortField] = useState("clientName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [actionMenuAssignmentId, setActionMenuAssignmentId] = useState(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  const dragIndexRef = useRef(null);

  const refreshAssignments = async (serviceId = service?._id) => {
    if (!serviceId) return;

    setAssignmentError("");
    setAssignmentLoading(true);

    try {
      const data = await getAssignedClients(serviceId, {
        page: 1,
        limit: 1000,
        search: "",
      });
      setAssignments(data.assignments || []);
    } catch (err) {
      setAssignmentError(err.response?.data?.message || "Unable to load assignments.");
    } finally {
      setAssignmentLoading(false);
    }
  };
  const refreshServiceSnapshot = async (serviceId = service?._id) => {
    if (!serviceId) return;

    try {
      const data = await getServiceById(serviceId);
      setService({ ...defaultServiceSettings, ...data });
      setChecklist(data.checklistItems || []);
      setSubtasks(data.subtasks || []);
      setCustomFields(data.customFields || []);
      setSupportingFiles(data.supportingFiles || data.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh service details.");
    }
  };

  const refreshAvailableClients = async (serviceId = service?._id) => {
    if (!serviceId || !showAssignModal) return;

    try {
      const data = await getAvailableClients(serviceId);
      setAvailableClients(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load available clients.");
    }
  };

  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getServiceById(id);
        setService({ ...defaultServiceSettings, ...data });
        setChecklist(data.checklistItems || []);
        setSubtasks(data.subtasks || []);
        setCustomFields(data.customFields || []);
        setSupportingFiles(data.supportingFiles || data.documents || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load service details.");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id]);

  useEffect(() => {
    if (!service?._id) return;
    refreshAssignments(service._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?._id]);

  useEffect(() => {
    if (!service?._id || !showAssignModal) return;
    refreshAvailableClients(service._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?._id, showAssignModal]);

  useEffect(() => {
    const handleClientsImported = () => {
      if (service?._id) {
        refreshAssignments(service._id);
        refreshServiceSnapshot(service._id);
      }
    };

    window.addEventListener("clients-imported", handleClientsImported);
    return () => window.removeEventListener("clients-imported", handleClientsImported);
  }, [service?._id]);
  
  const selectedCount = useMemo(
    () => Object.keys(selectedAssignments).length,
    [selectedAssignments]
  );

  const sortedAssignments = useMemo(() => {
    const normalized = assignmentSearch.trim().toLowerCase();

    const filtered = assignments.filter((assignment) => {
      if (!normalized) return true;

      const client = assignment.clientId;
      return [
        client?.clientName,
        client?.clientCode,
        client?.email,
        assignment.package,
        assignment.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });

    return [...filtered].sort((a, b) => {
      const getValue = (item) => {
        const client = item.clientId;
        switch (sortField) {
          case "fileNumber":
            return client?.clientCode || "";
          case "package":
            return item.package || "Standard";
          case "customPrice":
            return Number(item.customPrice ?? 0);
          default:
            return client?.clientName?.toLowerCase() || "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [assignments, assignmentSearch, sortField, sortDirection]);

  const pagedAssignments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedAssignments.slice(start, start + rowsPerPage);
  }, [sortedAssignments, currentPage]);

  const serviceClientCount = service?.clientCount ?? assignments.length;
  const serviceClientPreview = service?.assignedClientsPreview || [];
  const checklistCount = checklist.length;
  const subtaskCount = subtasks.length;
  const filesCount = supportingFiles.length;
  const createdDate = service?.creationDate
    ? new Date(service.creationDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAssignClients = async () => {
    if (!service?._id) return;

    const selectedIds = Object.keys(selectedClientsToAssign);
    if (!selectedIds.length) {
      toast.info("Select at least one client to assign.");
      return;
    }

    setAssignmentLoading(true);
    try {
      await assignClientsToService(service._id, {
        clientIds: selectedIds,
        package: "Standard",
        customPrice: null,
        assignedUsers: [],
      });

      await refreshAssignments(service._id);
      await refreshServiceSnapshot(service._id);
      setSelectedClientsToAssign({});
      setShowAssignModal(false);
      toast.success(`${selectedIds.length} client(s) assigned to service.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to assign clients.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const toggleAssignmentSelection = (assignmentId) => {
    setSelectedAssignments((current) => {
      const next = { ...current };
      if (next[assignmentId]) {
        delete next[assignmentId];
      } else {
        next[assignmentId] = true;
      }
      return next;
    });
  };

  const toggleSelectAllAssignments = () => {
    const allSelected = pagedAssignments.every((a) => selectedAssignments[a._id]);

    if (allSelected) {
      setSelectedAssignments((current) => {
        const next = { ...current };
        pagedAssignments.forEach((a) => delete next[a._id]);
        return next;
      });
      return;
    }

    setSelectedAssignments((current) => {
      const next = { ...current };
      pagedAssignments.forEach((a) => {
        next[a._id] = true;
      });
      return next;
    });
  };

  const handleRemoveAssignments = async (assignmentIds) => {
    if (!service?._id || !assignmentIds.length) return;

    setAssignmentLoading(true);
    try {
      await bulkRemoveClientsFromService(service._id, assignmentIds);
      await refreshAssignments(service._id);
      await refreshServiceSnapshot(service._id);
      setSelectedAssignments({});
      toast.success(`${assignmentIds.length} client(s) removed from service.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove clients.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    setBulkMenuOpen(false);

    const selectedIds = Object.keys(selectedAssignments);
    if (!selectedIds.length) {
      toast.info("Select at least one client to apply this action.");
      return;
    }

    if (!service?._id) return;

    setAssignmentLoading(true);
    try {
      switch (action) {
        case "activate":
          await bulkUpdateAssignments(service._id, {
            assignmentIds: selectedIds,
            updates: { status: "Active" },
          });
          toast.success("Selected clients activated.");
          break;

        case "deactivate":
          await bulkUpdateAssignments(service._id, {
            assignmentIds: selectedIds,
            updates: { status: "Inactive" },
          });
          toast.success("Selected clients deactivated.");
          break;

        case "remove":
          await handleRemoveAssignments(selectedIds);
          return;

        default:
          toast.info("This bulk action is not fully wired yet.");
      }

      await refreshAssignments(service._id);
      await refreshServiceSnapshot(service._id);
      setSelectedAssignments({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to apply bulk action.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId, updates) => {
    if (!service?._id) return;

    try {
      await updateServiceAssignment(service._id, assignmentId, updates);
      await refreshAssignments(service._id);
      await refreshServiceSnapshot(service._id);
      setEditingPrice(null);
      setEditingPackage(null);
      toast.success("Assignment updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update assignment.");
    }
  };

  const renderClientAvatars = (client) => {
    if (!client) return null;

    return (
      <div className="avatar-stack">
        <div className="user-avatar">
          {client.profileImage ? (
            <img src={client.profileImage} alt={client.clientName || "Client"} />
          ) : (
            <span>{client.clientName?.charAt(0)?.toUpperCase() || "C"}</span>
          )}
        </div>
      </div>
    );
  };

  const updateNestedValue = (section, key, value) => {
    setService((current) => ({
      ...current,
      [section]: {
        ...current?.[section],
        [key]: value,
      },
    }));
  };

  const handleDetailChange = (event) => {
    const { name, value, type, checked } = event.target;
    setService((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setError("");
    setValidationErrors({});
    setSaving(true);

    const errors = {};
    if (!service?.subService?.trim()) errors.subService = "Service name is required.";
    if (!service?.serviceCategory?.trim()) errors.serviceCategory = "Service category is required.";
    if (!service?.frequency?.trim()) errors.frequency = "Frequency is required.";
    if (service.sacCode && !/^[0-9]+$/.test(service.sacCode)) errors.sacCode = "SAC Code must contain only digits.";
    if (Number(service.gstPercentage) < 0 || Number(service.gstPercentage) > 100) errors.gstPercentage = "GST percentage must be between 0 and 100.";
    if (service.defaultBillingRate && Number(service.defaultBillingRate) < 0) errors.defaultBillingRate = "Billing rate cannot be negative.";
    if (service.creationDate && service.dueDate && service.dueDate < service.creationDate) {
      errors.dueDate = "Due date cannot be before the creation date.";
    }
    if (!service.targetDateFormula?.trim()) errors.targetDateFormula = "Target date formula is required.";

    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      await updateService(id, {
        serviceCategory: service.serviceCategory,
        subService: service.subService,
        frequency: service.frequency,
        description: service.description || "",
      });
      toast.success("Service configuration saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save service settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (index) => {
    setChecklist((current) =>
      current.map((item, idx) =>
        idx === index ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist((current) => [
      ...current,
      { label: newChecklistItem.trim(), completed: false },
    ]);
    setNewChecklistItem("");
  };

  const handleDragStart = (event, index) => {
    dragIndexRef.current = index;
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, dropIndex) => {
    event.preventDefault();
    const from = dragIndexRef.current;
    const to = dropIndex;
    if (from == null || from === to) return;

    setChecklist((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

    dragIndexRef.current = null;
  };

  const updateChecklistLabel = (index, value) => {
    setChecklist((current) =>
      current.map((item, idx) => (idx === index ? { ...item, label: value } : item))
    );
  };

  const deleteChecklistItem = (index) => {
    setChecklist((current) => current.filter((_, idx) => idx !== index));
  };

  const toggleSubtask = (index) => {
    setSubtasks((current) =>
      current.map((task, idx) =>
        idx === index ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((current) => [
      ...current,
      { title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields((current) => [
      ...current,
      { label: newFieldLabel.trim(), value: newFieldValue.trim() },
    ]);
    setNewFieldLabel("");
    setNewFieldValue("");
  };

  const removeCustomField = (index) => {
    setCustomFields((current) => current.filter((_, idx) => idx !== index));
  };

  const renderSettingsTab = () => (
    <form className="service-settings-form" onSubmit={handleSaveSettings}>
      <div className="service-settings-layout">
        <div className="service-settings-left">
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Basic details</h2>
                <p className="section-description">
                  Configure the service profile and default automation rules.
                </p>
              </div>
              <div className="status-pill">Practice service configuration</div>
            </div>

            <div className="settings-section">
              <div className="field-grid">
                <label>
                  Service name
                  <input
                    name="subService"
                    value={service.subService || ""}
                    onChange={handleDetailChange}
                    placeholder="GST Filing, ROC Compliance, etc."
                  />
                  {validationErrors.subService && (
                    <p className="input-helper danger">{validationErrors.subService}</p>
                  )}
                </label>

                <label>
                  Service category
                  <select
                    name="serviceCategory"
                    value={service.serviceCategory || ""}
                    onChange={handleDetailChange}
                  >
                    <option value="GST">GST</option>
                    <option value="Income Tax">Income Tax</option>
                    <option value="TDS">TDS</option>
                    <option value="ROC">ROC</option>
                    <option value="Audit">Audit</option>
                    <option value="Payroll">Payroll</option>
                    <option value="PF & ESI">PF & ESI</option>
                    <option value="Registration">Registration</option>
                    <option value="Certification">Certification</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                  {validationErrors.serviceCategory && (
                    <p className="input-helper danger">{validationErrors.serviceCategory}</p>
                  )}
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Recurring service
                  <div className="toggle-row">
                    <span className="toggle-details">
                      <strong>{service.recurring ? "Enabled" : "Disabled"}</strong>
                      <span className="input-helper">
                        Recurring schedules keep this service active for every billing cycle.
                      </span>
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="recurring"
                        checked={service.recurring ?? true}
                        onChange={handleDetailChange}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </label>

                <label>
                  Enable service
                  <div className="toggle-row">
                    <span className="toggle-details">
                      <strong>{service.enabled ? "Active" : "Inactive"}</strong>
                      <span className="input-helper">
                        Toggle service availability across client workflows.
                      </span>
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="enabled"
                        checked={service.enabled ?? true}
                        onChange={handleDetailChange}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <div className="field-grid">
                <label>
                  Auto task creation frequency
                  <select
                    name="autoTaskFrequency"
                    value={service.autoTaskFrequency || "Weekly"}
                    onChange={handleDetailChange}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                  <p className="input-helper">
                    Choose how often the system creates recurring tasks for this service.
                  </p>
                </label>

                <label>
                  Target date formula
                  <input
                    name="targetDateFormula"
                    value={service.targetDateFormula || ""}
                    onChange={handleDetailChange}
                    placeholder="e.g. Invoice date + 7 days"
                  />
                  {validationErrors.targetDateFormula && (
                    <p className="input-helper danger">{validationErrors.targetDateFormula}</p>
                  )}
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Creation date
                  <input
                    type="date"
                    name="creationDate"
                    value={service.creationDate || ""}
                    onChange={handleDetailChange}
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    name="dueDate"
                    value={service.dueDate || ""}
                    onChange={handleDetailChange}
                  />
                  {validationErrors.dueDate && (
                    <p className="input-helper danger">{validationErrors.dueDate}</p>
                  )}
                </label>
              </div>
            </div>

            <div className="settings-section">
              <div className="section-subtitle">Task creation options</div>
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={service.taskCreationOptions?.createOnServiceAdd ?? true}
                    onChange={(event) =>
                      updateNestedValue("taskCreationOptions", "createOnServiceAdd", event.target.checked)
                    }
                  />
                  <span>Create task when service is assigned</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={service.taskCreationOptions?.createOnDueDate ?? false}
                    onChange={(event) =>
                      updateNestedValue("taskCreationOptions", "createOnDueDate", event.target.checked)
                    }
                  />
                  <span>Create task on due date trigger</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={service.taskCreationOptions?.createOnClientOnboard ?? false}
                    onChange={(event) =>
                      updateNestedValue("taskCreationOptions", "createOnClientOnboard", event.target.checked)
                    }
                  />
                  <span>Create onboarding task for new clients</span>
                </label>
              </div>
            </div>

            <div className="form-actions settings-actions">
              <button type="submit" className="button primary" disabled={saving}>
                {saving ? "Saving..." : "Save settings"}
              </button>
              <button type="button" className="button secondary" onClick={() => setActiveTab("Clients")}>
                Manage clients
              </button>
            </div>

            {error && <div className="alert danger">{error}</div>}
          </div>
        </div>

        <div className="service-settings-right">
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Billing settings</h2>
                <p className="section-description">
                  Control how this service bills clients and whether tasks generate billable hours.
                </p>
              </div>
            </div>

            <div className="field-grid">
              <label>
                SAC code
                <input
                  name="sacCode"
                  value={service.sacCode || ""}
                  onChange={handleDetailChange}
                  placeholder="e.g. 998212"
                />
                {validationErrors.sacCode && (
                  <p className="input-helper danger">{validationErrors.sacCode}</p>
                )}
              </label>

              <label>
                GST percentage
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  name="gstPercentage"
                  value={service.gstPercentage || 0}
                  onChange={(event) =>
                    handleDetailChange({
                      target: { name: "gstPercentage", value: Number(event.target.value) },
                    })
                  }
                />
                {validationErrors.gstPercentage && (
                  <p className="input-helper danger">{validationErrors.gstPercentage}</p>
                )}
              </label>
            </div>

            <div className="field-grid">
              <label>
                Default billing rate
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="defaultBillingRate"
                  value={service.defaultBillingRate || ""}
                  onChange={handleDetailChange}
                  placeholder="e.g. 1500"
                />
                {validationErrors.defaultBillingRate && (
                  <p className="input-helper danger">{validationErrors.defaultBillingRate}</p>
                )}
              </label>

              <label>
                Billable task
                <div className="toggle-row">
                  <span className="toggle-details">
                    <strong>{service.billableTask ? "Yes" : "No"}</strong>
                    <span className="input-helper">
                      Mark tasks created for this service as billable by default.
                    </span>
                  </span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="billableTask"
                      checked={service.billableTask ?? true}
                      onChange={handleDetailChange}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </label>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>GST API configuration</h2>
                <p className="section-description">
                  Connect this service to GST return workflows and filing status updates.
                </p>
              </div>
            </div>

            <div className="field-grid">
              <label>
                GST return type
                <select
                  name="gstReturnType"
                  value={service.gstReturnType || "GSTR-1"}
                  onChange={handleDetailChange}
                >
                  <option value="GSTR-1">GSTR-1</option>
                  <option value="GSTR-3B">GSTR-3B</option>
                  <option value="GSTR-4">GSTR-4</option>
                  <option value="GSTR-9">GSTR-9</option>
                </select>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={service.gstIntegration?.syncFilingStatus ?? true}
                  onChange={(event) =>
                    updateNestedValue("gstIntegration", "syncFilingStatus", event.target.checked)
                  }
                />
                <span>Sync filing status from GST API</span>
              </label>
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={service.gstIntegration?.fetchReturnStatus ?? false}
                onChange={(event) =>
                  updateNestedValue("gstIntegration", "fetchReturnStatus", event.target.checked)
                }
              />
              <span>Fetch GST return status automatically</span>
            </label>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Document collection request</h2>
                <p className="section-description">
                  Select required documents that clients must upload for this service.
                </p>
              </div>
            </div>

            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={service.documentRequirements?.panProof ?? true}
                  onChange={(event) =>
                    updateNestedValue("documentRequirements", "panProof", event.target.checked)
                  }
                />
                <span>PAN proof</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={service.documentRequirements?.gstProof ?? true}
                  onChange={(event) =>
                    updateNestedValue("documentRequirements", "gstProof", event.target.checked)
                  }
                />
                <span>GSTIN proof</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={service.documentRequirements?.bankStatement ?? false}
                  onChange={(event) =>
                    updateNestedValue("documentRequirements", "bankStatement", event.target.checked)
                  }
                />
                <span>Bank statement</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={service.documentRequirements?.invoiceCopy ?? false}
                  onChange={(event) =>
                    updateNestedValue("documentRequirements", "invoiceCopy", event.target.checked)
                  }
                />
                <span>Invoice copy</span>
              </label>
            </div>

            <label className="settings-textarea">
              Custom required documents
              <textarea
                value={service.documentRequirements?.customDocs || ""}
                onChange={(event) =>
                  updateNestedValue("documentRequirements", "customDocs", event.target.value)
                }
                rows="4"
                placeholder="e.g. Rent agreement, Salary slips, GST challan"
              />
              <p className="input-helper">
                Add any additional document requirements that are specific to this service.
              </p>
            </label>
          </div>
        </div>
      </div>
    </form>
  );

  const renderChecklistTab = () => (
    <div className="service-panel-grid">
      <div className="service-panel-card checklist-card">
        <div className="panel-row" style={{ alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={newChecklistItem}
              onChange={(event) => setNewChecklistItem(event.target.value)}
              placeholder="Add new checklist step"
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="button primary" onClick={addChecklistItem}>
              Add
            </button>
            <button type="button" className="button secondary" onClick={() => toast.info("Checklist state is local in this version.")}>
              Save
            </button>
          </div>
        </div>

        {checklist.length === 0 ? (
          <p className="text-muted">No checklist steps yet. Add the first step above.</p>
        ) : (
          <div className="checklist-list">
            {checklist.map((item, index) => (
              <div
                key={index}
                className="checklist-row"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="drag-handle" title="Drag to reorder">
                  <FaGripVertical />
                </div>

                <div className="checklist-input-wrap">
                  <input
                    type="text"
                    className={`checklist-input ${item.completed ? "completed" : ""}`}
                    value={item.label || ""}
                    onChange={(e) => updateChecklistLabel(index, e.target.value)}
                    placeholder={`Step ${index + 1} description`}
                  />
                </div>

                <div className="checklist-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => toggleChecklistItem(index)}
                    title="Toggle complete"
                  >
                    {item.completed ? "✓" : "○"}
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => deleteChecklistItem(index)}
                    title="Delete step"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSubtasksTab = () => (
    <div className="service-panel-grid">
      <div className="service-panel-card">
        <div className="panel-row">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(event) => setNewSubtaskTitle(event.target.value)}
            placeholder="Add a new subtask"
          />
          <button type="button" className="button primary" onClick={addSubtask}>
            Add
          </button>
        </div>

        {subtasks.length === 0 ? (
          <p className="text-muted">No subtasks created yet.</p>
        ) : (
          <div className="service-list">
            {subtasks.map((task, index) => (
              <div key={index} className="service-list-item">
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={() => toggleSubtask(index)}
                  />
                  <span className={task.completed ? "completed" : ""}>{task.title}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomFieldsTab = () => (
    <div className="service-panel-grid">
      <div className="service-panel-card">
        <div className="panel-row">
          <input
            type="text"
            value={newFieldLabel}
            onChange={(event) => setNewFieldLabel(event.target.value)}
            placeholder="Field label"
          />
          <input
            type="text"
            value={newFieldValue}
            onChange={(event) => setNewFieldValue(event.target.value)}
            placeholder="Field value"
          />
          <button type="button" className="button primary" onClick={addCustomField}>
            Add field
          </button>
        </div>

        {customFields.length === 0 ? (
          <p className="text-muted">No custom fields defined.</p>
        ) : (
          <div className="custom-fields-grid">
            {customFields.map((field, index) => (
              <div key={index} className="custom-field-card">
                <div>
                  <p className="field-label">{field.label}</p>
                  <p className="field-value">{field.value || "—"}</p>
                </div>
                <button
                  type="button"
                  className="button danger small"
                  onClick={() => removeCustomField(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderClientsTab = () => (
    <>
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Clients to Service</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {availableClients.length === 0 ? (
                <p className="text-muted">All clients are already assigned to this service.</p>
              ) : (
                <>
                  <div className="modal-search">
                    <input
                      type="search"
                      placeholder="Search clients..."
                      value={assignmentSearch}
                      onChange={(e) => setAssignmentSearch(e.target.value)}
                    />
                  </div>

                  <div className="modal-clients-list">
                    {availableClients
                      .filter((client) => {
                        const normalized = assignmentSearch.trim().toLowerCase();
                        return (
                          !normalized ||
                          client.clientName?.toLowerCase().includes(normalized) ||
                          client.clientCode?.toLowerCase().includes(normalized) ||
                          client.email?.toLowerCase().includes(normalized)
                        );
                      })
                      .map((client) => (
                        <label key={client._id} className="modal-client-item">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedClientsToAssign[client._id])}
                            onChange={(e) => {
                              setSelectedClientsToAssign((current) => {
                                const next = { ...current };
                                if (e.target.checked) {
                                  next[client._id] = true;
                                } else {
                                  delete next[client._id];
                                }
                                return next;
                              });
                            }}
                          />
                          <div className="client-info">
                            <p className="client-name">{client.clientName}</p>
                            <p className="client-meta">
                              {client.clientCode} • {client.email}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleAssignClients}
                disabled={!Object.keys(selectedClientsToAssign).length || assignmentLoading}
              >
                {assignmentLoading ? "Assigning..." : "Assign Clients"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="service-panel-card service-clients-card">
        <div className="clients-table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-field">
              <label className="search-label" htmlFor="assignment-search">
                Search clients
              </label>
              <input
                id="assignment-search"
                type="search"
                className="search-input"
                placeholder="Search client name, file number, package"
                value={assignmentSearch}
                onChange={(event) => {
                  setAssignmentSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              type="button"
              className="button primary"
              onClick={() => {
                setShowAssignModal(true);
                setSelectedClientsToAssign({});
                setAssignmentSearch("");
              }}
            >
              Assign to Clients
            </button>
          </div>

          <div className="table-toolbar-right">
            <div className="bulk-action-wrapper">
              <button
                type="button"
                className="button secondary"
                onClick={() => setBulkMenuOpen((open) => !open)}
                disabled={!selectedCount}
              >
                Bulk Action ({selectedCount})
              </button>

              {bulkMenuOpen && (
                <div className="bulk-action-menu">
                  <button
                    type="button"
                    className="action-menu-item"
                    onClick={() => handleBulkAction("activate")}
                  >
                    Activate Service
                  </button>
                  <button
                    type="button"
                    className="action-menu-item"
                    onClick={() => handleBulkAction("deactivate")}
                  >
                    Deactivate Service
                  </button>
                  <button
                    type="button"
                    className="action-menu-item danger"
                    onClick={() => handleBulkAction("remove")}
                  >
                    Remove Selected Clients
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {assignmentLoading ? (
          <p className="text-muted">Loading assignments...</p>
        ) : assignmentError ? (
          <div className="alert danger">{assignmentError}</div>
        ) : (
          <>
            <div className="table-details-row">
              <div>
                <p className="metric-label">Showing</p>
                <p>{`${pagedAssignments.length} of ${sortedAssignments.length} assignments`}</p>
              </div>
              <div>
                <p className="metric-label">Selected</p>
                <p>{selectedCount}</p>
              </div>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table compact full-width">
                <thead>
                  <tr>
                    <th className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={
                          pagedAssignments.length > 0 &&
                          pagedAssignments.every((a) => selectedAssignments[a._id])
                        }
                        onChange={toggleSelectAllAssignments}
                      />
                    </th>
                    <th onClick={() => handleSort("clientName")} className="sortable">
                      Client Name
                      <span className="sort-icon">
                        {sortField === "clientName" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </th>
                    <th onClick={() => handleSort("fileNumber")} className="sortable">
                      File Number
                      <span className="sort-icon">
                        {sortField === "fileNumber" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </th>
                    <th onClick={() => handleSort("package")} className="sortable">
                      Package
                      <span className="sort-icon">
                        {sortField === "package" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </th>
                    <th onClick={() => handleSort("customPrice")} className="sortable">
                      Custom Price
                      <span className="sort-icon">
                        {sortField === "customPrice" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </th>
                    <th>Status</th>
                    <th>Client</th>
                    <th className="actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedAssignments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No client assignments found.
                      </td>
                    </tr>
                  ) : (
                    pagedAssignments.map((assignment) => (
                      <tr key={assignment._id}>
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAssignments[assignment._id])}
                            onChange={() => toggleAssignmentSelection(assignment._id)}
                          />
                        </td>
                        <td>
                          <div className="client-name-cell">
                            <div className="client-name-text">
                              {assignment.clientId?.clientName || "—"}
                            </div>
                            <p className="client-subtitle">
                              {assignment.clientId?.email || assignment.clientId?.mobile || "—"}
                            </p>
                          </div>
                        </td>
                        <td>{assignment.clientId?.clientCode || "—"}</td>
                        <td>
                          {editingPackage === assignment._id ? (
                            <select
                              value={assignment.package}
                              onChange={(e) =>
                                handleUpdateAssignment(assignment._id, {
                                  package: e.target.value,
                                })
                              }
                              onBlur={() => setEditingPackage(null)}
                              autoFocus
                            >
                              <option value="Basic">Basic</option>
                              <option value="Standard">Standard</option>
                              <option value="Premium">Premium</option>
                              <option value="Custom">Custom</option>
                            </select>
                          ) : (
                            <span
                              onClick={() => setEditingPackage(assignment._id)}
                              style={{ cursor: "pointer" }}
                            >
                              {assignment.package || "Standard"}
                            </span>
                          )}
                        </td>
                        <td>
                          {editingPrice === assignment._id ? (
                            <input
                              type="number"
                              value={assignment.customPrice || ""}
                              onChange={(e) =>
                                handleUpdateAssignment(assignment._id, {
                                  customPrice: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              onBlur={() => setEditingPrice(null)}
                              autoFocus
                              style={{ width: "100px" }}
                            />
                          ) : (
                            <span
                              onClick={() => setEditingPrice(assignment._id)}
                              style={{ cursor: "pointer" }}
                            >
                              {assignment.customPrice != null
                                ? `₹ ${Number(assignment.customPrice).toLocaleString()}`
                                : "—"}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge status-${assignment.status?.toLowerCase()}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td>{renderClientAvatars(assignment.clientId)}</td>
                        <td className="actions-cell">
                          <div className="row-action-wrapper">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() =>
                                setActionMenuAssignmentId((current) =>
                                  current === assignment._id ? null : assignment._id
                                )
                              }
                            >
                              <FaEllipsisV />
                            </button>

                            {actionMenuAssignmentId === assignment._id && (
                              <div className="row-action-menu">
                                <button
                                  type="button"
                                  className="action-menu-item"
                                  onClick={() => {
                                    setActionMenuAssignmentId(null);
                                    setEditingPrice(assignment._id);
                                  }}
                                >
                                  Edit Price
                                </button>
                                <button
                                  type="button"
                                  className="action-menu-item"
                                  onClick={() => {
                                    setActionMenuAssignmentId(null);
                                    setEditingPackage(assignment._id);
                                  }}
                                >
                                  Edit Package
                                </button>
                                <button
                                  type="button"
                                  className="action-menu-item"
                                  onClick={() => {
                                    setActionMenuAssignmentId(null);
                                    handleUpdateAssignment(assignment._id, {
                                      status: assignment.status === "Active" ? "Inactive" : "Active",
                                    });
                                  }}
                                >
                                  {assignment.status === "Active" ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  className="action-menu-item danger"
                                  onClick={() => {
                                    setActionMenuAssignmentId(null);
                                    handleRemoveAssignments([assignment._id]);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="table-summary">
                {`Showing ${pagedAssignments.length} of ${sortedAssignments.length} assignments`}
              </div>
              <div className="pagination">
                {Array.from(
                  { length: Math.max(1, Math.ceil(sortedAssignments.length / rowsPerPage)) },
                  (_, index) => (
                    <button
                      key={index + 1}
                      type="button"
                      className={
                        currentPage === index + 1
                          ? "button primary small"
                          : "button secondary small"
                      }
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  const renderSupportingFilesTab = () => (
    <div className="service-panel-grid">
      <div className="service-panel-card">
        {supportingFiles.length === 0 ? (
          <p className="text-muted">No supporting files uploaded for this service.</p>
        ) : (
          <div className="files-list">
            {supportingFiles.map((file, index) => (
              <div key={file._id || `${file.name}-${index}`} className="file-row">
                <div>
                  <p className="file-name">{file.name || file.fileName || "Untitled file"}</p>
                  <p className="file-meta">{file.fileType || file.type || "Document"}</p>
                </div>
                <span>
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "Settings":
        return renderSettingsTab();
      case "Checklist":
        return renderChecklistTab();
      case "Subtasks":
        return renderSubtasksTab();
      case "Custom Fields":
        return renderCustomFieldsTab();
      case "Clients":
        return renderClientsTab();
      case "Supporting Files":
        return renderSupportingFilesTab();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card service-details-page">
        <div className="page-header service-details-header">
          <div>
            <p className="eyebrow">Services</p>
            <h1>Service details</h1>
            <p>
              Manage service settings, checklist, subtasks, clients, and files for this offering.
            </p>
          </div>

          <div className="page-tools">
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate("/dashboard/services")}
            >
              Back to Services
            </button>
          </div>
        </div>

        {loading ? (
          <div className="alert">Loading service details...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <>
            <div className="service-summary-card">
              <div className="service-hero-top">
                <div className="service-hero-copy">
                  <div className="service-title-row">
                    <p className="service-category">{service.serviceCategory || "Service category"}</p>
                    <span
                      className={`badge status-pill ${service.enabled === false ? "danger" : "success"}`}
                    >
                      {service.enabled === false ? "Inactive" : "Active"}
                    </span>
                    <span className="badge frequency-badge">{service.frequency || "Frequency not set"}</span>
                  </div>

                  <h2 className="service-title">{service.subService || "Untitled service"}</h2>
                  <p className="service-summary-description">
                    {service.description || "No description available."}
                  </p>

                  <div className="service-meta-grid">
                    <div className="service-meta-card">
                      <p className="meta-label">Created on</p>
                      <p className="meta-value">{createdDate}</p>
                    </div>
                    <div className="service-meta-card">
                      <p className="meta-label">Assigned clients</p>
                      <p className="meta-value">{serviceClientCount}</p>
                    </div>
                    <div className="service-meta-card">
                      <p className="meta-label">Checklist items</p>
                      <p className="meta-value">{checklistCount}</p>
                    </div>
                    <div className="service-meta-card">
                      <p className="meta-label">Subtasks</p>
                      <p className="meta-value">{subtaskCount}</p>
                    </div>
                  </div>
                </div>

                <div className="service-hero-actions">
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => setActiveTab("Clients")}
                  >
                    View clients
                  </button>
                </div>
              </div>
            </div>

            <div className="service-stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">
                  <FaUsers />
                </div>
                <p className="stat-card-title">Assigned clients</p>
                <p className="stat-card-value">{serviceClientCount}</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon secondary">
                  <FaClipboardList />
                </div>
                <p className="stat-card-title">Checklist items</p>
                <p className="stat-card-value">{checklistCount}</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon warning">
                  <FaTasks />
                </div>
                <p className="stat-card-title">Subtasks</p>
                <p className="stat-card-value">{subtaskCount}</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon accent">
                  <FaFileAlt />
                </div>
                <p className="stat-card-title">Supporting files</p>
                <p className="stat-card-value">{filesCount}</p>
              </div>
            </div>

            <div className="service-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`service-tab-button ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="service-detail-content">{renderActiveTab()}</div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ServiceDetails;