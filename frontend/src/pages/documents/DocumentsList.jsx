import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getDocuments,
  archiveDocument,
  restoreDocument,
  getDocumentDownloadUrl,
} from "../../services/documentService.js";

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
        setError(
          err.response?.data?.message || "Failed to load documents."
        );
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
    return {
      total: safeDocuments.length,
      archived: safeDocuments.filter((doc) => doc.isArchived).length,
      confidential: safeDocuments.filter((doc) => doc.isConfidential).length,
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
      setDocuments((current) =>
        current.filter((doc) => doc._id !== documentId)
      );
      toast.success("Document archived successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to archive document."
      );
    }
  };

  // ========================================
  // RESTORE
  // ========================================
  const handleRestore = async (documentId) => {
    try {
      await restoreDocument(documentId);
      setDocuments((current) =>
        current.filter((doc) => doc._id !== documentId)
      );
      toast.success("Document restored successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to restore document."
      );
    }
  };

  // ========================================
  // UI
  // ========================================
  return (
    <DashboardLayout>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ ANIMATIONS & BASE ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-stagger-fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .qca-documents-shell {
          display: flex; flex-direction: column; gap: 24px;
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          padding-bottom: 40px;
        }

        /* ── SURFACES ── */
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
        .qca-header-row {
          display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;
        }

        .qca-eyebrow {
          display: inline-flex; align-items: center; align-self: flex-start;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: #06B6D4; text-transform: uppercase;
          background: rgba(6, 182, 212, 0.1); padding: 4px 12px;
          border-radius: 100px; border: 1px solid rgba(6, 182, 212, 0.2);
          margin-bottom: 12px;
        }

        .qca-title { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 8px 0; }
        .qca-subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.5); line-height: 1.6; margin: 0; }

        /* ── BUTTONS ── */
        .qca-header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        
        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 18px; height: 40px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: none; text-decoration: none;
        }
        
        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA); color: #fff;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .qca-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.5); }
        
        .qca-btn-outline {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.15); color: #fff;
        }
        .qca-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); }

        .qca-btn-micro { height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
        
        .qca-btn-ghost { background: transparent; color: rgba(255,255,255,0.6); border: 1px solid transparent; }
        .qca-btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: rgba(255,255,255,0.1); }
        
        .qca-btn-danger { background: transparent; color: #FCA5A5; border: 1px solid rgba(239,68,68,0.3); }
        .qca-btn-danger:hover { background: rgba(239,68,68,0.15); color: #fff; border-color: #EF4444; }

        /* ── METRICS GRID ── */
        .qca-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.1s;
        }
        .qca-metric-card {
          padding: 24px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px; transition: transform 0.3s, border-color 0.3s;
        }
        .qca-metric-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15); background: rgba(255, 255, 255, 0.04); }
        .qca-metric-card h3 { font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .qca-metric-card p { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0; line-height: 1; }

        /* ── SEARCH BAR ── */
        .qca-toolbar {
          margin: 24px 0; display: flex; align-items: center;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.2s;
        }
        .qca-search-wrapper { position: relative; width: 100%; max-width: 400px; }
        .qca-search-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          width: 18px; height: 18px; color: rgba(255,255,255,0.4); pointer-events: none; transition: color 0.3s;
        }
        .qca-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; padding: 12px 16px 12px 44px; border-radius: 12px; font-size: 0.95rem;
          font-family: inherit; transition: all 0.3s; outline: none;
        }
        .qca-input::placeholder { color: rgba(255,255,255,0.3); }
        .qca-input:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .qca-input:focus {
          border-color: #7C3AED; background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }
        .qca-input:focus + .qca-search-icon { color: #A855F7; }

        /* ── DATA TABLE ── */
        .qca-table-wrapper {
          width: 100%; overflow-x: auto; margin-top: 8px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.3s;
        }
        .qca-table { width: 100%; border-collapse: collapse; text-align: left; }
        .qca-table th {
          padding: 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .qca-table td {
          padding: 18px 16px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle;
        }
        .qca-table tbody tr { transition: background 0.2s; }
        .qca-table tbody tr:hover td { background: rgba(255, 255, 255, 0.03); }

        .qca-file-cell { display: flex; flex-direction: column; gap: 4px; }
        .qca-file-name {
          color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;
        }
        .qca-file-desc { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin: 0; }

        /* Badges & Tags */
        .qca-badge {
          display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px;
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .qca-badge-active { background: rgba(16, 185, 129, 0.1); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.2); }
        .qca-badge-archived { background: rgba(239, 68, 68, 0.1); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.2); }
        .qca-badge-warning { background: rgba(249, 115, 22, 0.1); color: #FDBA74; border: 1px solid rgba(249, 115, 22, 0.2); }
        .qca-badge-info { background: rgba(6, 182, 212, 0.1); color: #67E8F9; border: 1px solid rgba(6, 182, 212, 0.2); }

        .qca-tags-container { display: flex; flex-wrap: wrap; gap: 6px; }
        .qca-tag {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
          padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
        }

        .qca-table-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── PAGINATION ── */
        .qca-pagination {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          margin-top: 32px; animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.4s;
        }
        .qca-page-indicator { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.6); }

        /* ── EMPTY STATES ── */
        .qca-empty-state {
          padding: 60px 20px; text-align: center; background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;
          color: rgba(255,255,255,0.5); font-size: 0.95rem; margin-top: 16px;
          animation: qca-stagger-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.3s;
        }
        .qca-empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0 0 8px; }
        
        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 16px; border-radius: 12px; text-align: center; font-weight: 500;
        }

        @media (max-width: 768px) {
          .qca-header-row { flex-direction: column; gap: 16px; }
          .qca-header-actions { width: 100%; }
          .qca-btn { flex: 1; }
          .qca-surface { padding: 24px; }
        }
      `}</style>

      <div className="qca-documents-shell">
        <section className="qca-surface">
          
          {/* HEADER */}
          <div className="qca-header-row">
            <div>
              <span className="qca-eyebrow">Documents</span>
              <h1 className="qca-title">Document Management</h1>
              <p className="qca-subtitle">Upload, organize, archive, and manage client documents.</p>
            </div>
            <div className="qca-header-actions">
              <button
                type="button"
                className="qca-btn qca-btn-outline"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? "Show Active" : "Show Archived"}
              </button>
              <Link to="/dashboard/documents/upload" className="qca-btn qca-btn-primary">
                Upload Document
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="qca-metrics-grid" style={{ marginTop: "32px" }}>
            <div className="qca-metric-card">
              <h3 style={{ color: "#06B6D4" }}>Total Documents</h3>
              <p>{stats.total}</p>
            </div>
            <div className="qca-metric-card">
              <h3 style={{ color: "#EF4444" }}>Archived</h3>
              <p>{stats.archived}</p>
            </div>
            <div className="qca-metric-card">
              <h3 style={{ color: "#F59E0B" }}>Confidential</h3>
              <p>{stats.confidential}</p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="qca-toolbar">
            <div className="qca-search-wrapper">
              <svg className="qca-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                className="qca-input"
                placeholder="Search documents by name or description..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* LOADING / ERROR / EMPTY / TABLE */}
          {loading ? (
            <div className="qca-empty-state" style={{ border: "none" }}>Loading document database...</div>
          ) : error ? (
            <div className="qca-alert-danger">{error}</div>
          ) : safeDocuments.length === 0 ? (
            <div className="qca-empty-state">
              <h3>No documents found</h3>
              <p>Upload your first document or adjust your search filters to start managing files.</p>
            </div>
          ) : (
            <div className="qca-table-wrapper">
              <table className="qca-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Client</th>
                    <th>Category</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeDocuments.map((document) => (
                    <tr key={document._id}>
                      {/* FILE */}
                      <td>
                        <div className="qca-file-cell">
                          <span className="qca-file-name">
                            <svg width="16" height="16" fill="none" stroke="#A855F7" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                            {document.originalFileName || document.fileName}
                          </span>
                          {document.description && (
                            <p className="qca-file-desc">{document.description}</p>
                          )}
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>
                        {document.client?.clientName || "—"}
                      </td>

                      {/* CATEGORY */}
                      <td>
                        <span className="qca-badge qca-badge-info" style={{ textTransform: "none", fontWeight: 600 }}>
                          {document.category || "Other"}
                        </span>
                      </td>

                      {/* TAGS */}
                      <td>
                        <div className="qca-tags-container">
                          {document.tags?.length ? (
                            document.tags.map((tag) => (
                              <span key={tag} className="qca-tag">{tag}</span>
                            ))
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                          <span className={`qca-badge ${document.isArchived ? "qca-badge-archived" : "qca-badge-active"}`}>
                            {document.isArchived ? "Archived" : "Active"}
                          </span>

                          {document.isConfidential && (
                            <span className="qca-badge qca-badge-warning">Confidential</span>
                          )}

                          {document.expiryDate && (
                            <span className={`qca-badge ${
                              getExpiryStatus(document.expiryDate) === "expired" ? "qca-badge-archived" :
                              getExpiryStatus(document.expiryDate) === "expiring" ? "qca-badge-warning" : "qca-badge-active"
                            }`}>
                              {getExpiryStatus(document.expiryDate) === "expired" ? "Expired" :
                               getExpiryStatus(document.expiryDate) === "expiring" ? "Expiring Soon" : "Valid"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* FILE SIZE */}
                      <td style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 600 }}>
                        {formatFileSize(document.fileSize)}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="qca-table-actions">
                          <a
                            href={getDocumentDownloadUrl(document.filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="qca-btn qca-btn-micro qca-btn-ghost"
                          >
                            View
                          </a>
                          <a
                            href={getDocumentDownloadUrl(document.filePath)}
                            download
                            className="qca-btn qca-btn-micro qca-btn-outline"
                          >
                            Download
                          </a>

                          {!document.isArchived ? (
                            <button
                              type="button"
                              className="qca-btn qca-btn-micro qca-btn-danger"
                              onClick={() => handleArchive(document._id)}
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="qca-btn qca-btn-micro qca-btn-outline"
                              onClick={() => handleRestore(document._id)}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {pagination && (
            <div className="qca-pagination">
              <button
                className="qca-btn qca-btn-outline"
                disabled={pagination.currentPage === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <span className="qca-page-indicator">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="qca-btn qca-btn-outline"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
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

export default DocumentsList;