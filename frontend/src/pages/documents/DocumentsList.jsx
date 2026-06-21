import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Search,
  ShieldAlert,
  Upload,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getDocuments,
  archiveDocument,
  restoreDocument,
  getDocumentDownloadUrl,
} from "../../services/documentService.js";

import "../../styles/DocumentsList.css";

// ========================================
// FORMAT FILE SIZE
// ========================================
const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ========================================
// EXPIRY STATUS
// ========================================
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "expired";
  if (days <= 15) return "expiring";
  return "valid";
};

// ========================================
// COMPONENT
// ========================================
const DocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  // ========================================
  // LOAD DOCUMENTS
  // ========================================
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDocuments(showArchived, {
          page,
          limit: 10,
          search,
        });

        setDocuments(data.documents || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [showArchived, page, search]);

  // ========================================
  // SAFE DOCUMENTS
  // ========================================
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // ========================================
  // STATS
  // ========================================
  const stats = useMemo(() => {
    const expired = safeDocuments.filter(
      (doc) => getExpiryStatus(doc.expiryDate) === "expired"
    ).length;

    const expiring = safeDocuments.filter(
      (doc) => getExpiryStatus(doc.expiryDate) === "expiring"
    ).length;

    return {
      total: safeDocuments.length,
      archived: safeDocuments.filter((doc) => doc.isArchived).length,
      confidential: safeDocuments.filter((doc) => doc.isConfidential).length,
      expiring,
      expired,
    };
  }, [safeDocuments]);

  // ========================================
  // ARCHIVE
  // ========================================
  const handleArchive = async (documentId) => {
    const confirmed = window.confirm("Archive this document?");
    if (!confirmed) return;

    try {
      await archiveDocument(documentId);
      setDocuments((current) => current.filter((doc) => doc._id !== documentId));
      toast.success("Document archived successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive document.");
    }
  };

  // ========================================
  // RESTORE
  // ========================================
  const handleRestore = async (documentId) => {
    try {
      await restoreDocument(documentId);
      setDocuments((current) => current.filter((doc) => doc._id !== documentId));
      toast.success("Document restored successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore document.");
    }
  };

  // ========================================
  // UI
  // ========================================
  return (
    <DashboardLayout>
      <div className="documents-page">
        <section className="documents-hero">
          <div className="documents-hero-copy">
            <div className="documents-eyebrow">Documents</div>
            <h1 className="documents-title">Document Management</h1>
            <p className="documents-subtitle">
              Upload, organize, archive, and manage client documents in one place.
            </p>
          </div>

          <div className="documents-hero-actions">
            <button
              type="button"
              className={`documents-toggle ${showArchived ? "documents-toggle--active" : ""}`}
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <ArrowLeft size={16} /> : <Archive size={16} />}
              {showArchived ? "Show Active" : "Show Archived"}
            </button>

            <Link to="/dashboard/documents/upload" className="documents-primary-action">
              <Upload size={16} />
              Upload Document
            </Link>
          </div>
        </section>

        <section className="documents-stats-grid" aria-label="Document summary">
          <article className="documents-stat-card">
            <div className="documents-stat-label">Total Documents</div>
            <div className="documents-stat-value">{stats.total}</div>
            <div className="documents-stat-note">Visible in current view</div>
          </article>

          <article className="documents-stat-card">
            <div className="documents-stat-label">Archived</div>
            <div className="documents-stat-value documents-stat-value--warning">{stats.archived}</div>
            <div className="documents-stat-note">Hidden from active workflow</div>
          </article>

          <article className="documents-stat-card">
            <div className="documents-stat-label">Confidential</div>
            <div className="documents-stat-value documents-stat-value--danger">{stats.confidential}</div>
            <div className="documents-stat-note">Sensitive access control</div>
          </article>

          <article className="documents-stat-card">
            <div className="documents-stat-label">Expiring Soon</div>
            <div className="documents-stat-value documents-stat-value--accent">{stats.expiring}</div>
            <div className="documents-stat-note">Needs attention within 15 days</div>
          </article>
        </section>

        <section className="documents-toolbar">
          <div className="documents-search-shell">
            <Search className="documents-search-icon" size={18} />
            <input
              type="search"
              className="documents-search-input"
              placeholder="Search documents by name or description..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="documents-toolbar-meta">
            <div className="documents-toolbar-chip">
              <ShieldAlert size={16} />
              {showArchived ? "Archived view" : "Active view"}
            </div>
            <div className="documents-toolbar-chip documents-toolbar-chip--soft">
              <FileText size={16} />
              {pagination?.totalItems ?? stats.total} results
            </div>
          </div>
        </section>

        {loading ? (
          <section className="documents-empty-state documents-empty-state--loading">
            Loading document database…
          </section>
        ) : error ? (
          <section className="documents-alert" role="alert">
            {error}
          </section>
        ) : safeDocuments.length === 0 ? (
          <section className="documents-empty-state">
            <div className="documents-empty-icon">
              <FileText size={22} />
            </div>
            <h3>No documents found</h3>
            <p>
              Upload your first document or refine the search and archive filters to continue.
            </p>
          </section>
        ) : (
          <section className="documents-card">
            <div className="documents-table-shell">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Client</th>
                    <th>Category</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th className="documents-actions-head">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeDocuments.map((document) => {
                    const expiryStatus = getExpiryStatus(document.expiryDate);

                    return (
                      <tr key={document._id}>
                        <td>
                          <div className="documents-file-cell">
                            <div className="documents-file-icon">
                              <FileText size={16} />
                            </div>
                            <div className="documents-file-copy">
                              <div className="documents-file-name">
                                {document.originalFileName || document.fileName}
                              </div>
                              {document.description && (
                                <div className="documents-file-desc">{document.description}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="documents-muted-cell">
                          {document.client?.clientName || "—"}
                        </td>

                        <td>
                          <span className="documents-badge documents-badge--blue">
                            {document.category || "Other"}
                          </span>
                        </td>

                        <td>
                          <div className="documents-tags">
                            {document.tags?.length ? (
                              document.tags.map((tag) => (
                                <span key={tag} className="documents-tag">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="documents-placeholder">—</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="documents-status-stack">
                            <span
                              className={`documents-badge ${
                                document.isArchived
                                  ? "documents-badge--archived"
                                  : "documents-badge--active"
                              }`}
                            >
                              {document.isArchived ? "Archived" : "Active"}
                            </span>

                            {document.isConfidential && (
                              <span className="documents-badge documents-badge--warning">
                                Confidential
                              </span>
                            )}

                            {document.expiryDate && (
                              <span
                                className={`documents-badge ${
                                  expiryStatus === "expired"
                                    ? "documents-badge--archived"
                                    : expiryStatus === "expiring"
                                      ? "documents-badge--warning"
                                      : "documents-badge--active"
                                }`}
                              >
                                {expiryStatus === "expired"
                                  ? "Expired"
                                  : expiryStatus === "expiring"
                                    ? "Expiring Soon"
                                    : "Valid"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="documents-muted-cell documents-size-cell">
                          {formatFileSize(document.fileSize)}
                        </td>

                        <td>
                          <div className="documents-row-actions">
                            <a
                              href={getDocumentDownloadUrl(document.filePath)}
                              target="_blank"
                              rel="noreferrer"
                              className="documents-action documents-action--ghost"
                            >
                              <Eye size={16} />
                              View
                            </a>

                            <a
                              href={getDocumentDownloadUrl(document.filePath)}
                              download
                              className="documents-action documents-action--outline"
                            >
                              <Download size={16} />
                              Download
                            </a>

                            {!document.isArchived ? (
                              <button
                                type="button"
                                className="documents-action documents-action--danger"
                                onClick={() => handleArchive(document._id)}
                              >
                                <Archive size={16} />
                                Archive
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="documents-action documents-action--outline"
                                onClick={() => handleRestore(document._id)}
                              >
                                <ArchiveRestore size={16} />
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pagination && (
          <section className="documents-pagination">
            <button
              className="documents-page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="documents-page-indicator">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              className="documents-page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentsList;