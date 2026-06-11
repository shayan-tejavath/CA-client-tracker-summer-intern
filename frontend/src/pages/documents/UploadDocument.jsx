import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getClients,
} from "../../services/clientService.js";

import {
  getTasks,
} from "../../services/taskService.js";

import {
  uploadDocument,
} from "../../services/documentService.js";

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

        setClients(
          clientsResponse.clients || clientsResponse || []
        );
        setTasks(tasksResponse || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load upload form data."
        );
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
      setError(
        err.response?.data?.message || "Failed to upload document."
      );
      toast.error(
        err.response?.data?.message || "Failed to upload document."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ BASE & ANIMATIONS ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-upload-shell {
          display: flex; flex-direction: column; gap: 32px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        .qca-surface {
          background: rgba(18, 10, 35, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── HEADERS ── */
        .qca-header-block {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 24px;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #06B6D4; text-transform: uppercase;
          background: rgba(6, 182, 212, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(6, 182, 212, 0.2);
          margin-bottom: 8px;
        }

        .qca-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
        .qca-subtitle { font-size: 1rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── INTERACTIVE DROPZONE ── */
        .qca-dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 32px;
        }
        .qca-dropzone:hover {
          border-color: #7C3AED; background: rgba(124, 58, 237, 0.05);
        }
        .qca-dropzone.has-file {
          border-color: #10B981; border-style: solid;
          background: rgba(16, 185, 129, 0.05);
        }
        .qca-dropzone-label {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 48px 24px; cursor: pointer; gap: 12px; text-align: center;
        }
        
        .qca-drop-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; transition: all 0.3s;
        }
        .qca-dropzone:hover .qca-drop-icon {
          background: #7C3AED; color: #fff; transform: scale(1.1) translateY(-4px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
        }
        .qca-dropzone.has-file .qca-drop-icon {
          background: #10B981; color: #fff; transform: scale(1.1);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .qca-dropzone h3 { font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0; }
        .qca-dropzone p { font-size: 0.9rem; color: rgba(255, 255, 255, 0.4); margin: 0; }

        /* ── FORM GRID & FIELDS ── */
        .qca-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .qca-form-field { display: flex; flex-direction: column; gap: 8px; }
        .qca-form-field.full-width { grid-column: 1 / -1; }
        
        .qca-label-wrapper { display: flex; align-items: center; justify-content: space-between; }
        .qca-form-field label { font-size: 0.85rem; font-weight: 600; color: rgba(255, 255, 255, 0.7); }
        .qca-optional-badge {
          font-size: 0.7rem; font-weight: 600; color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 100px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .qca-input, .qca-select, .qca-textarea {
          width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff; padding: 12px 16px; border-radius: 12px; font-size: 0.95rem;
          font-family: inherit; transition: all 0.2s; outline: none;
          color-scheme: dark; /* Ensures date picker is dark */
        }
        .qca-textarea { resize: vertical; min-height: 100px; }
        
        .qca-select {
          appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; padding-right: 40px;
        }
        .qca-select option { background: #120a23; color: #fff; }
        
        .qca-input::placeholder, .qca-textarea::placeholder { color: rgba(255, 255, 255, 0.25); }
        
        .qca-input:hover, .qca-select:hover, .qca-textarea:hover { border-color: rgba(255, 255, 255, 0.2); }
        .qca-input:focus, .qca-select:focus, .qca-textarea:focus {
          border-color: #7C3AED; background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }

        /* ── CUSTOM CHECKBOX ── */
        .qca-checkbox-wrapper {
          display: inline-flex; align-items: center; gap: 12px; cursor: pointer;
          margin-top: 8px; padding: 16px; border-radius: 12px;
          background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s;
        }
        .qca-checkbox-wrapper:hover { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.1); }
        
        .qca-checkbox-input {
          appearance: none; width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.2); border-radius: 6px;
          background: rgba(255,255,255,0.03); outline: none; transition: all 0.2s;
          display: grid; place-content: center; cursor: pointer; margin: 0;
        }
        .qca-checkbox-input::before {
          content: ""; width: 10px; height: 10px; transform: scale(0);
          transition: 120ms transform cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: inset 1em 1em #fff; transform-origin: center;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .qca-checkbox-input:checked {
          background: #EF4444; border-color: #EF4444; box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }
        .qca-checkbox-input:checked::before { transform: scale(1); }
        .qca-checkbox-text { font-size: 0.95rem; color: #fff; font-weight: 600; }
        .qca-checkbox-desc { font-size: 0.8rem; color: rgba(255,255,255,0.4); display: block; margin-top: 2px; }

        /* ── ACTIONS ── */
        .qca-form-actions {
          display: flex; align-items: center; justify-content: flex-end; gap: 16px;
          margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);
        }

        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 24px; height: 44px; border-radius: 12px;
          font-size: 14px; font-weight: 600; font-family: inherit;
          transition: all 0.3s ease; cursor: pointer; border: none;
        }
        
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
        }
        .qca-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.6); }
        .qca-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.5); }
        
        .qca-btn-secondary {
          background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.8);
        }
        .qca-btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.4); color: #fff;
        }

        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center; font-weight: 500;
        }

        @media (max-width: 768px) {
          .qca-form-grid { grid-template-columns: 1fr; }
          .qca-form-actions { flex-direction: column-reverse; }
          .qca-btn { width: 100%; }
        }
      `}</style>

      <div className="qca-upload-shell">
        <section className="qca-surface">
          
          <div className="qca-header-block">
            <span className="qca-eyebrow">Documents</span>
            <h1 className="qca-title">Upload Document</h1>
            <p className="qca-subtitle">Securely transfer and classify client-related files and assets.</p>
          </div>

          {pageLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
              Initializing upload environment...
            </div>
          ) : error ? (
            <div className="qca-alert-danger">{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* INTERACTIVE DROPZONE */}
              <div className={`qca-dropzone ${formData.file ? "has-file" : ""}`}>
                <input
                  type="file"
                  id="document-upload"
                  onChange={handleFileChange}
                  required
                  hidden
                />
                <label htmlFor="document-upload" className="qca-dropzone-label">
                  <div className="qca-drop-icon">
                    {formData.file ? (
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>
                  <h3>
                    {formData.file ? formData.file.name : "Click or drag document to upload"}
                  </h3>
                  <p>
                    {formData.file ? "Click to replace selected file" : "Supports PDF, DOCX, JPG, PNG up to 50MB"}
                  </p>
                </label>
              </div>

              {/* FORM GRID */}
              <div className="qca-form-grid">
                
                {/* CLIENT */}
                <div className="qca-form-field">
                  <label htmlFor="client">Client Allocation</label>
                  <select
                    id="client"
                    name="client"
                    className="qca-select"
                    value={formData.client}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Target Client...</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY */}
                <div className="qca-form-field">
                  <label htmlFor="category">Document Category</label>
                  <select
                    id="category"
                    name="category"
                    className="qca-select"
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

                {/* TASK */}
                <div className="qca-form-field">
                  <div className="qca-label-wrapper">
                    <label htmlFor="task">Related Task</label>
                    <span className="qca-optional-badge">Optional</span>
                  </div>
                  <select
                    id="task"
                    name="task"
                    className="qca-select"
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

                {/* EXPIRY */}
                <div className="qca-form-field">
                  <div className="qca-label-wrapper">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <span className="qca-optional-badge">Optional</span>
                  </div>
                  <input
                    id="expiryDate"
                    type="date"
                    name="expiryDate"
                    className="qca-input"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>

                {/* TAGS */}
                <div className="qca-form-field full-width">
                  <div className="qca-label-wrapper">
                    <label htmlFor="tags">Indexing Tags</label>
                    <span className="qca-optional-badge">Optional</span>
                  </div>
                  <input
                    id="tags"
                    type="text"
                    name="tags"
                    className="qca-input"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., gst, invoice, fy24 (comma separated)"
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="qca-form-field full-width">
                  <div className="qca-label-wrapper">
                    <label htmlFor="description">Document Notes</label>
                    <span className="qca-optional-badge">Optional</span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    className="qca-textarea"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add any relevant context or processing notes here..."
                  />
                </div>

                {/* CONFIDENTIAL CHECKBOX */}
                <div className="qca-form-field full-width">
                  <label className="qca-checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="isConfidential"
                      className="qca-checkbox-input"
                      checked={formData.isConfidential}
                      onChange={handleChange}
                    />
                    <div>
                      <span className="qca-checkbox-text">Mark as Confidential</span>
                      <span className="qca-checkbox-desc">Restricts access to highly privileged roles only.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="qca-form-actions">
                <button
                  type="button"
                  className="qca-btn qca-btn-secondary"
                  onClick={() => navigate("/dashboard/documents")}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="qca-btn qca-btn-primary"
                  disabled={loading}
                >
                  {loading ? "Processing Upload..." : "Secure Upload Document"}
                </button>
              </div>

            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UploadDocument;