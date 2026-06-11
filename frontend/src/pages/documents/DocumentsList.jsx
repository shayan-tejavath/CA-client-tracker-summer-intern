import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

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

const formatFileSize = (
  bytes = 0
) => {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};



// ========================================
// EXPIRY STATUS
// ========================================

const getExpiryStatus = (
  expiryDate
) => {

  if (!expiryDate)
    return null;

  const today =
    new Date();

  const expiry =
    new Date(expiryDate);

  const diff =
    expiry - today;

  const days =
    Math.ceil(
      diff /
      (1000 *
        60 *
        60 *
        24)
    );

  if (days < 0)
    return "expired";

  if (days <= 15)
    return "expiring";

  return "valid";
};



// ========================================
// COMPONENT
// ========================================

const DocumentsList = () => {

  const [documents, setDocuments] =
    useState([]);

  const [pagination, setPagination] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showArchived, setShowArchived] =
    useState(false);

  const [page, setPage] =
    useState(1);



  // ========================================
  // LOAD DOCUMENTS
  // ========================================

  useEffect(() => {

    const loadDocuments =
      async () => {

        try {

          setLoading(true);

          setError("");

          const data =
            await getDocuments(
              showArchived,
              {
                page,
                limit: 10,
                search,
              }
            );

          setDocuments(
            data.documents || []
          );

          setPagination(
            data.pagination || null
          );

        } catch (err) {

          setError(
            err.response?.data
              ?.message ||
              "Failed to load documents."
          );

        } finally {

          setLoading(false);

        }
      };

    loadDocuments();

  }, [
    showArchived,
    page,
    search,
  ]);



  // ========================================
  // SAFE DOCUMENTS
  // ========================================

  const safeDocuments =
    Array.isArray(documents)
      ? documents
      : [];



  // ========================================
  // STATS
  // ========================================

  const stats = useMemo(() => {

    return {

      total:
        safeDocuments.length,

      archived:
        safeDocuments.filter(
          (doc) =>
            doc.isArchived
        ).length,

      confidential:
        safeDocuments.filter(
          (doc) =>
            doc.isConfidential
        ).length,

    };

  }, [safeDocuments]);



  // ========================================
  // ARCHIVE
  // ========================================

  const handleArchive =
    async (
      documentId
    ) => {

      const confirmed =
        window.confirm(
          "Archive this document?"
        );

      if (!confirmed)
        return;

      try {

        await archiveDocument(
          documentId
        );

        setDocuments(
          (current) =>
            current.filter(
              (doc) =>
                doc._id !==
                documentId
            )
        );

        toast.success(
          "Document archived successfully."
        );

      } catch (err) {

        toast.error(
          err.response?.data
            ?.message ||
            "Failed to archive document."
        );
      }
    };



  // ========================================
  // RESTORE
  // ========================================

  const handleRestore =
    async (
      documentId
    ) => {

      try {

        await restoreDocument(
          documentId
        );

        setDocuments(
          (current) =>
            current.filter(
              (doc) =>
                doc._id !==
                documentId
            )
        );

        toast.success(
          "Document restored successfully."
        );

      } catch (err) {

        toast.error(
          err.response?.data
            ?.message ||
            "Failed to restore document."
        );
      }
    };



  // ========================================
  // UI
  // ========================================

  return (

    <DashboardLayout>

      <section className="page-card">

        {/* HEADER */}

        <div className="page-header">

          <div>

            <p className="eyebrow">
              Documents
            </p>

            <h1>
              Document Management
            </h1>

            <p>
              Upload, organize,
              archive, and manage
              client documents.
            </p>

          </div>

          <div className="documents-header-actions">

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setShowArchived(
                  !showArchived
                )
              }
            >
              {showArchived
                ? "Show Active"
                : "Show Archived"}
            </button>

            <Link
              to="/dashboard/documents/upload"
              className="button primary"
            >
              Upload Document
            </Link>

          </div>

        </div>



        {/* STATS */}

        <div className="client-stats-grid">

          <div className="stats-card">

            <h3>
              Total Documents
            </h3>

            <p>
              {stats.total}
            </p>

          </div>

          <div className="stats-card">

            <h3>
              Archived
            </h3>

            <p>
              {stats.archived}
            </p>

          </div>

          <div className="stats-card">

            <h3>
              Confidential
            </h3>

            <p>
              {
                stats.confidential
              }
            </p>

          </div>

        </div>



        {/* SEARCH */}

        <div className="documents-toolbar">

          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(
              event
            ) => {

              setSearch(
                event.target
                  .value
              );

              setPage(1);

            }}
          />

        </div>



        {/* LOADING */}

        {loading ? (

          <div className="alert">
            Loading documents...
          </div>

        ) : error ? (

          <div className="alert danger">
            {error}
          </div>

        ) : safeDocuments.length ===
          0 ? (

          <div className="empty-state">

            <h3>
              No documents found
            </h3>

            <p>
              Upload your first
              document to start
              managing files.
            </p>

          </div>

        ) : (

          <div className="table-responsive">

            <table className="data-table">

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

                {safeDocuments.map(
                  (document) => (

                    <tr
                      key={
                        document._id
                      }
                    >

                      {/* FILE */}

                      <td>

                        <div className="document-file-cell">

                          <strong>

                            {document.originalFileName ||
                              document.fileName}

                          </strong>

                          {document.description && (

                            <p className="document-description">

                              {
                                document.description
                              }

                            </p>

                          )}

                        </div>

                      </td>



                      {/* CLIENT */}

                      <td>

                        {document
                          .client
                          ?.clientName ||
                          "—"}

                      </td>



                      {/* CATEGORY */}

                      <td>

                        <span className="document-category-badge">

                          {document.category ||
                            "Other"}

                        </span>

                      </td>



                      {/* TAGS */}

                      <td>

                        <div className="document-tags">

                          {document.tags
                            ?.length ? (

                            document.tags.map(
                              (
                                tag
                              ) => (

                                <span
                                  key={
                                    tag
                                  }
                                  className="document-tag"
                                >
                                  {tag}
                                </span>

                              )
                            )

                          ) : (
                            "—"
                          )}

                        </div>

                      </td>



                      {/* STATUS */}

                      <td>

                        <div className="document-status-stack">

                          <span
                            className={`status-badge ${
                              document.isArchived
                                ? "archived"
                                : "active"
                            }`}
                          >

                            {document.isArchived
                              ? "Archived"
                              : "Active"}

                          </span>

                          {document.isConfidential && (

                            <span className="confidential-badge">

                              Confidential

                            </span>

                          )}

                          {document.expiryDate && (

                            <span
                              className={`expiry-badge ${getExpiryStatus(
                                document.expiryDate
                              )}`}
                            >

                              {getExpiryStatus(
                                document.expiryDate
                              ) ===
                              "expired"
                                ? "Expired"
                                : getExpiryStatus(
                                    document.expiryDate
                                  ) ===
                                  "expiring"
                                ? "Expiring Soon"
                                : "Valid"}

                            </span>

                          )}

                        </div>

                      </td>



                      {/* FILE SIZE */}

                      <td>

                        {formatFileSize(
                          document.fileSize
                        )}

                      </td>



                      {/* ACTIONS */}

                      <td>

                        <div className="table-actions">

                          <a
                            href={getDocumentDownloadUrl(
                              document.filePath
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="button secondary small"
                          >
                            View
                          </a>

                          <a
                            href={getDocumentDownloadUrl(
                              document.filePath
                            )}
                            download
                            className="button primary small"
                          >
                            Download
                          </a>

                          {!document.isArchived ? (

                            <button
                              type="button"
                              className="button danger small"
                              onClick={() =>
                                handleArchive(
                                  document._id
                                )
                              }
                            >
                              Archive
                            </button>

                          ) : (

                            <button
                              type="button"
                              className="button primary small"
                              onClick={() =>
                                handleRestore(
                                  document._id
                                )
                              }
                            >
                              Restore
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}



        {/* PAGINATION */}

        {pagination && (

          <div className="pagination-controls">

            <button
              className="button secondary"
              disabled={
                pagination.currentPage ===
                1
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    prev - 1
                )
              }
            >
              Previous
            </button>

            <span>

              Page {
                pagination.currentPage
              } of {
                pagination.totalPages
              }

            </span>

            <button
              className="button secondary"
              disabled={
                pagination.currentPage ===
                pagination.totalPages
              }
              onClick={() =>
                setPage(
                  (prev) =>
                    prev + 1
                )
              }
            >
              Next
            </button>

          </div>

        )}

      </section>

    </DashboardLayout>

  );
};

export default DocumentsList;
