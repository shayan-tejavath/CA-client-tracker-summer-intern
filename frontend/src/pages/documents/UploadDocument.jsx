import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileUp,
  FolderOpen,
  ShieldAlert,
  Upload,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import { getClients } from "../../services/clientService.js";
import { getTasks } from "../../services/taskService.js";
import { uploadDocument } from "../../services/documentService.js";

import "../../styles/uploadDocument.css";

const categories = [
  "GST",
  "Income Tax",
  "TDS",
  "Invoice",
  "Bank Statement",
  "Audit",
  "Payroll",
  "ROC",
  "Legal",
  "Other",
];

const UploadDocument = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    file: null,
    client: "",
    task: "",
    category: "GST",
    description: "",
    tags: "",
    expiryDate: "",
    isConfidential: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsResponse, tasksResponse] = await Promise.all([
          getClients({ limit: 100 }),
          getTasks(),
        ]);

        setClients(clientsResponse.clients || clientsResponse || []);
        setTasks(tasksResponse || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load upload form data.");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFormData((current) => ({
      ...current,
      file,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.file) {
      setError("Please select a file.");
      return;
    }

    if (!formData.client) {
      setError("Please select a client.");
      return;
    }

    setLoading(true);

    try {
      await uploadDocument({
        file: formData.file,
        client: formData.client,
        task: formData.task,
        category: formData.category,
        description: formData.description,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        expiryDate: formData.expiryDate,
        isConfidential: formData.isConfidential,
      });

      toast.success("Document uploaded successfully.");
      navigate("/dashboard/documents");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to upload document.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedFileName = formData.file?.name || "Click to choose a file";

  return (
    <DashboardLayout>
      <div className="upload-page">
        <section className="upload-hero">
          <div className="upload-hero-copy">
            <div className="upload-eyebrow">Documents</div>
            <h1 className="upload-title">Upload Document</h1>
            <p className="upload-subtitle">
              Securely transfer and classify client files with clear ownership, categories, and confidentiality controls.
            </p>
          </div>

          <div className="upload-hero-chip">
            <FileUp size={16} />
            Secure file intake
          </div>
        </section>

        <section className="upload-grid">
          <div className="upload-main-card">
            <div className="upload-card-header">
              <div>
                <h2 className="upload-card-title">Document details</h2>
                <p className="upload-card-text">
                  Provide the file and classify it so the team can find and manage it easily.
                </p>
              </div>
            </div>

            {pageLoading ? (
              <div className="upload-loading-state">
                <div className="upload-loading-title">Preparing upload form…</div>
                <div className="upload-loading-text">
                  Loading clients and tasks for document mapping.
                </div>
                <div className="upload-skeleton-grid">
                  <div className="upload-skeleton-block" />
                  <div className="upload-skeleton-block" />
                  <div className="upload-skeleton-block" />
                  <div className="upload-skeleton-block" />
                </div>
              </div>
            ) : error ? (
              <div className="upload-alert" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="upload-form">
                <div className="upload-dropzone-shell">
                  <input
                    type="file"
                    id="document-upload"
                    onChange={handleFileChange}
                    required
                    hidden
                  />
                  <label
                    htmlFor="document-upload"
                    className={`upload-dropzone ${formData.file ? "upload-dropzone--active" : ""}`}
                  >
                    <div className="upload-dropzone-icon">
                      {formData.file ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                    </div>

                    <div className="upload-dropzone-copy">
                      <div className="upload-dropzone-title">{selectedFileName}</div>
                      <div className="upload-dropzone-text">
                        {formData.file
                          ? "Click to replace the selected file."
                          : "Click to upload or drag-and-drop a document into this area."}
                      </div>
                    </div>

                    <div className="upload-dropzone-meta">
                      Supported: PDF, DOCX, JPG, PNG
                    </div>
                  </label>
                </div>

                <div className="upload-form-grid">
                  <div className="upload-field">
                    <label htmlFor="client">Client Allocation</label>
                    <select
                      id="client"
                      name="client"
                      className="upload-select"
                      value={formData.client}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select target client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="upload-field">
                    <label htmlFor="category">Document Category</label>
                    <select
                      id="category"
                      name="category"
                      className="upload-select"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="upload-field">
                    <div className="upload-label-row">
                      <label htmlFor="task">Related Task</label>
                      <span className="upload-optional">Optional</span>
                    </div>
                    <select
                      id="task"
                      name="task"
                      className="upload-select"
                      value={formData.task}
                      onChange={handleChange}
                    >
                      <option value="">No task association</option>
                      {tasks.map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="upload-field">
                    <div className="upload-label-row">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <span className="upload-optional">Optional</span>
                    </div>
                    <input
                      id="expiryDate"
                      type="date"
                      name="expiryDate"
                      className="upload-input"
                      value={formData.expiryDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="upload-field upload-field--full">
                    <div className="upload-label-row">
                      <label htmlFor="tags">Indexing Tags</label>
                      <span className="upload-optional">Optional</span>
                    </div>
                    <input
                      id="tags"
                      type="text"
                      name="tags"
                      className="upload-input"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="gst, invoice, fy24"
                    />
                    <div className="upload-help">
                      Use comma-separated tags to make this document easier to search later.
                    </div>
                  </div>

                  <div className="upload-field upload-field--full">
                    <div className="upload-label-row">
                      <label htmlFor="description">Document Notes</label>
                      <span className="upload-optional">Optional</span>
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      className="upload-textarea"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add context, follow-up notes, or internal instructions..."
                    />
                  </div>

                  <div className="upload-field upload-field--full">
                    <label className="upload-checkbox-card">
                      <input
                        type="checkbox"
                        name="isConfidential"
                        className="upload-checkbox"
                        checked={formData.isConfidential}
                        onChange={handleChange}
                      />
                      <div>
                        <div className="upload-checkbox-title">Mark as confidential</div>
                        <div className="upload-checkbox-text">
                          Restrict visibility to authorized roles only.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="upload-form-actions">
                  <button
                    type="button"
                    className="upload-btn upload-btn--secondary"
                    onClick={() => navigate("/dashboard/documents")}
                    disabled={loading}
                  >
                    <ArrowLeft size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="upload-btn upload-btn--primary"
                    disabled={loading}
                  >
                    {loading ? "Uploading…" : "Secure Upload Document"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="upload-side-card">
            <div className="upload-side-top">
              <div className="upload-side-icon">
                <FolderOpen size={18} />
              </div>
              <div>
                <h3 className="upload-side-title">Upload checklist</h3>
                <p className="upload-side-text">
                  A structured upload keeps your document library organized and searchable.
                </p>
              </div>
            </div>

            <div className="upload-side-list">
              <div className="upload-side-item">
                <ShieldAlert size={16} />
                Choose the correct client before uploading.
              </div>
              <div className="upload-side-item">
                <ShieldAlert size={16} />
                Use tags for fast retrieval across teams.
              </div>
              <div className="upload-side-item">
                <ShieldAlert size={16} />
                Mark sensitive files as confidential when needed.
              </div>
              <div className="upload-side-item">
                <ShieldAlert size={16} />
                Add expiry dates for documents with compliance deadlines.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UploadDocument;