import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClientById } from "../../services/clientService.js";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocuments,
  uploadDocument,
} from "../../services/documentService.js";

const documentTypes = [
  "All",
  "GST",
  "Audit",
  "ROC",
  "TDS",
  "Income Tax",
  "Other",
];

const ClientDocuments = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    const loadClient = async () => {
      if (!clientId) return;

      try {
        const data = await getClientById(clientId);
        setClientName(data.clientName || "Client");
      } catch (err) {
        setClientName("Client");
      }
    };

    loadClient();
  }, [clientId]);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        setError("");

        const data = await getDocuments(false, {
          clientId,
          search,
          category: category === "All" ? undefined : category,
          page,
          limit: 10,
        });

        setDocuments(data.documents || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load documents for this client."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [clientId, search, category, page]);

  const safeDocuments = Array.isArray(documents) ? documents : [];

  const stats = useMemo(() => ({
    total: safeDocuments.length,
    gst: safeDocuments.filter((doc) => doc.category === "GST").length,
    audit: safeDocuments.filter((doc) => doc.category === "Audit").length,
    other: safeDocuments.filter((doc) => doc.category === "Other").length,
  }), [safeDocuments]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile || null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      await uploadDocument({
        file,
        client: clientId,
        category: category === "All" ? "Other" : category,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        expiryDate: expiryDate || null,
        isConfidential,
      });

      toast.success("Document uploaded successfully.");
      setFile(null);
      setDescription("");
      setTags("");
      setExpiryDate("");
      setIsConfidential(false);
      setFileInputKey(Date.now());
      setPage(1);
      setSearch("");
      setCategory("All");
      await Promise.resolve();
      const data = await getDocuments(false, {
        clientId,
        search: "",
        category: undefined,
        page: 1,
        limit: 10,
      });
      setDocuments(data.documents || []);
      setPagination(data.pagination || null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Document upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm(
      "Delete this document permanently?"
    );
    if (!confirmed) return;

    try {
      await deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document._id !== documentId)
      );
      toast.success("Document deleted successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to delete document."
      );
    }
  };

  const getFileUrl = (document) =>
    getDocumentDownloadUrl(document.filePath);

  return (
    <DashboardLayout>
      <style>{`
        .qca-documents-page { color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 40px; }
        .qca-section { background: rgba(18, 10, 35, 0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,0.15); margin-bottom: 24px; }
        .qca-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 18px; align-items: flex-start; }
        .qca-eyebrow { display: inline-flex; padding: 6px 14px; border-radius: 999px; background: rgba(6, 182, 212, 0.1); color: #67E8F9; letter-spacing: 0.18em; text-transform: uppercase; font-size: 11px; font-weight: 700; }
        .qca-title { margin: 0; font-size: 2rem; font-weight: 800; line-height: 1.05; }
        .qca-description { margin: 8px 0 0; color: rgba(255,255,255,0.6); max-width: 560px; }
        .qca-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .qca-btn { border: none; cursor: pointer; border-radius: 12px; padding: 10px 18px; font-size: 0.95rem; font-weight: 700; transition: transform 0.2s ease, background 0.2s ease; }
        .qca-btn:hover { transform: translateY(-1px); }
        .qca-btn-primary { background: linear-gradient(135deg,#7C3AED,#9333EA); color: #fff; }
        .qca-btn-secondary { background: rgba(255,255,255,0.06); color: #fff; }
        .qca-btn-danger { background: rgba(239,68,68,0.15); color: #FECACA; }
        .qca-stat-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 16px; margin-top: 24px; }
        .qca-stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; }
        .qca-stat-card h3 { margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.12em; }
        .qca-stat-card p { margin: 12px 0 0; font-size: 2rem; font-weight: 800; }
        .qca-toolbar { display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-top: 24px; }
        .qca-input, .qca-select, .qca-textarea { width: 100%; font: inherit; border-radius: 14px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); color: #fff; padding: 14px 16px; outline: none; }
        .qca-input::placeholder, .qca-textarea::placeholder { color: rgba(255,255,255,0.4); }
        .qca-select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; }
        .qca-form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; margin-top: 24px; }
        .qca-form-group { display: flex; flex-direction: column; gap: 8px; }
        .qca-form-group.full { grid-column: 1 / -1; }
        .qca-form-label { color: rgba(255,255,255,0.75); font-weight: 600; }
        .qca-file-name { font-size: 0.95rem; color: #fff; font-weight: 700; margin-top: 8px; }
        .qca-note { color: rgba(255,255,255,0.5); font-size: 0.9rem; }
        .qca-table-wrapper { overflow-x: auto; margin-top: 24px; }
        .qca-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .qca-table th, .qca-table td { padding: 16px 18px; text-align: left; vertical-align: middle; }
        .qca-table th { color: rgba(255,255,255,0.55); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .qca-table td { color: rgba(255,255,255,0.78); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .qca-table-row:hover td { background: rgba(255,255,255,0.03); }
        .qca-badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .qca-badge-gst { background: rgba(59,130,246,0.12); color: #BFDBFE; }
        .qca-badge-audit { background: rgba(168,85,247,0.12); color: #E9D5FF; }
        .qca-badge-roc { background: rgba(16,185,129,0.12); color: #BBF7D0; }
        .qca-badge-tds { background: rgba(245,158,11,0.12); color: #FCD34D; }
        .qca-badge-income-tax { background: rgba(236,72,153,0.12); color: #FBCFE8; }
        .qca-badge-other { background: rgba(148,163,184,0.12); color: #CBD5E1; }
        .qca-table-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .qca-small-btn { border-radius: 10px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
        .qca-small-btn:hover { background: rgba(255,255,255,0.1); }
        .qca-empty { padding: 48px 24px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12); color: rgba(255,255,255,0.55); text-align: center; }
        .qca-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #FCA5A5; border-radius: 16px; padding: 16px; margin-top: 20px; }

        @media (max-width: 900px) {
          .qca-form-grid { grid-template-columns: 1fr; }
          .qca-toolbar { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="qca-documents-page">
        <section className="qca-section">
          <div className="qca-header">
            <div>
              <span className="qca-eyebrow">Client Documents</span>
              <h1 className="qca-title">{clientName} Documents</h1>
              <p className="qca-description">
                Upload, search, download, and remove documents for this client. Filter by document type to narrow results.
              </p>
            </div>
            <div className="qca-actions">
              <button
                type="button"
                className="qca-btn qca-btn-secondary"
                onClick={() => navigate(`/dashboard/clients/${clientId}`)}
              >
                Back to Client
              </button>
            </div>
          </div>

          <div className="qca-stat-grid">
            <div className="qca-stat-card">
              <h3>Total Documents</h3>
              <p>{stats.total}</p>
            </div>
            <div className="qca-stat-card">
              <h3>GST</h3>
              <p>{stats.gst}</p>
            </div>
            <div className="qca-stat-card">
              <h3>Audit</h3>
              <p>{stats.audit}</p>
            </div>
            <div className="qca-stat-card">
              <h3>Other</h3>
              <p>{stats.other}</p>
            </div>
          </div>

          <form className="qca-form-grid" onSubmit={handleUpload}>
            <div className="qca-form-group full">
              <label className="qca-form-label" htmlFor="documentFile">
                Upload Document
              </label>
              <input
                key={fileInputKey}
                id="documentFile"
                type="file"
                className="qca-input"
                accept="*/*"
                onChange={handleFileChange}
              />
              {file && (
                <p className="qca-file-name">Selected file: {file.name}</p>
              )}
            </div>

            <div className="qca-form-group">
              <label className="qca-form-label" htmlFor="category">
                Document Type
              </label>
              <select
                id="category"
                className="qca-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="qca-form-group">
              <label className="qca-form-label" htmlFor="expiryDate">
                Expiry Date
              </label>
              <input
                id="expiryDate"
                type="date"
                className="qca-input"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>

            <div className="qca-form-group full">
              <label className="qca-form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="qca-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a short description for the document"
              />
            </div>

            <div className="qca-form-group">
              <label className="qca-form-label" htmlFor="tags">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                className="qca-input"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="tax,audit,2025"
              />
            </div>

            <div className="qca-form-group">
              <label className="qca-form-label" htmlFor="confidential">
                Confidential
              </label>
              <div>
                <label className="qca-small-btn qca-btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <input
                    id="confidential"
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(event) => setIsConfidential(event.target.checked)}
                    style={{ margin: 0, accentColor: "#7C3AED" }}
                  />
                  Keep private
                </label>
              </div>
            </div>

            <div className="qca-form-group full" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="qca-btn qca-btn-primary" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>

          {error && <div className="qca-error">{error}</div>}
        </section>

        <section className="qca-section">
          <div className="qca-header">
            <div>
              <span className="qca-eyebrow">Search & Filter</span>
              <h1 className="qca-title">Client Document Library</h1>
              <p className="qca-description">
                Find documents quickly with full search and category filters.
              </p>
            </div>
          </div>

          <div className="qca-toolbar">
            <input
              type="search"
              className="qca-input"
              placeholder="Search by file name or description"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              className="qca-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="qca-empty">Loading documents…</div>
          ) : safeDocuments.length === 0 ? (
            <div className="qca-empty">
              No documents found for this client. Upload a new file to get started.
            </div>
          ) : (
            <div className="qca-table-wrapper">
              <table className="qca-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Tags</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeDocuments.map((document) => (
                    <tr key={document._id} className="qca-table-row">
                      <td>
                        <strong>{document.originalFileName || document.fileName}</strong>
                        <div className="qca-note">{document.client?.clientName || clientName}</div>
                      </td>
                      <td>
                        <span className={`qca-badge qca-badge-${String(document.category || "Other").toLowerCase().replace(/\s+/g, "-")}`}>
                          {document.category || "Other"}
                        </span>
                      </td>
                      <td>{document.description || "—"}</td>
                      <td>
                        {document.tags?.length > 0 ? (
                          document.tags.map((tag) => (
                            <span key={tag} className="qca-badge qca-badge-other" style={{ marginRight: 6, marginBottom: 6 }}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="qca-note">No tags</span>
                        )}
                      </td>
                      <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="qca-table-actions">
                          <a
                            href={getFileUrl(document)}
                            target="_blank"
                            rel="noreferrer"
                            className="qca-small-btn"
                          >
                            Open
                          </a>
                          <a
                            href={getFileUrl(document)}
                            download
                            className="qca-small-btn"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            className="qca-small-btn qca-btn-danger"
                            onClick={() => handleDelete(document._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="qca-actions" style={{ justifyContent: "center", marginTop: 24 }}>
              <button
                type="button"
                className="qca-btn qca-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <div className="qca-note" style={{ alignSelf: "center" }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <button
                type="button"
                className="qca-btn qca-btn-secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ClientDocuments;
