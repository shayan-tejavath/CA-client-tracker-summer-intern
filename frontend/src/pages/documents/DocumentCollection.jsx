import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Info, MoreVertical, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import {
  getDocumentDownloadUrl,
  getDocumentRequests,
} from "../../services/documentService.js";
import { getTaskDocuments } from "../../services/taskService.js";
import "../../styles/documents-dsc.css";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const DocumentCollection = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentsModal, setDocumentsModal] = useState({
    open: false,
    loading: false,
    documents: [],
    request: null,
  });
  const [filters, setFilters] = useState({
    clientId: "",
    status: "All",
    search: "",
  });

  const loadClients = async () => {
    const data = await getClients({ limit: 500 });
    setClients(data.clients || []);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getDocumentRequests({
        clientId: filters.clientId || undefined,
        status: filters.status,
        search: filters.search || undefined,
        limit: 100,
      });
      setRequests(data.requests || []);
      setPagination(data.pagination || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load document collection requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients().catch(() => setClients([]));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const openDocuments = async (request) => {
    if (!request.task?._id) return;

    setDocumentsModal({
      open: true,
      loading: true,
      documents: [],
      request,
    });

    try {
      const documents = await getTaskDocuments(request.task._id);
      setDocumentsModal({
        open: true,
        loading: false,
        documents: Array.isArray(documents) ? documents : [],
        request,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load uploaded documents.");
      setDocumentsModal((current) => ({ ...current, loading: false }));
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Client", "Task", "Message", "Documents", "Status", "Assigned To"],
      ...requests.map((request) => [
        formatDate(request.createdAt),
        request.task?.client?.clientName || "",
        request.task?.title || "",
        (request.requiredDocuments || []).join(" "),
        request.documentCount,
        request.status,
        request.task?.assignedTo?.name || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document-collection.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="practive-page">
        <div className="practive-titlebar">
          <div className="practive-title">
            <button type="button" className="practive-back" onClick={() => window.history.back()}>
              <ArrowLeft size={22} />
            </button>
            <h1>Document Collection</h1>
          </div>
          <div className="practive-actions">
            <button type="button" className="practive-btn" onClick={exportCsv}>
              <Download size={16} />
              Export
            </button>
            <button type="button" className="practive-btn primary" onClick={() => navigate("/dashboard/tasks")}>
              <Plus size={16} />
              New
            </button>
          </div>
        </div>

        <section className="practive-filter-card">
          <div className="practive-filter-grid">
            <div className="practive-field">
              <label>Creation Date</label>
              <input className="practive-input" type="search" placeholder="Search task" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </div>
            <div className="practive-field">
              <label>Upload Date</label>
              <select className="practive-select" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                <option>All</option>
                <option>Pending</option>
                <option>Uploaded</option>
                <option>Verified</option>
              </select>
            </div>
            <div className="practive-field">
              <label>Client</label>
              <select className="practive-select" value={filters.clientId} onChange={(event) => updateFilter("clientId", event.target.value)}>
                <option value="">Select...</option>
                {clients.map((client) => <option key={client._id} value={client._id}>{client.clientName}</option>)}
              </select>
            </div>
            <div className="practive-row-actions">
              <button type="button" className="practive-btn icon" onClick={() => navigate("/dashboard/tasks")} title="Add">
                <Plus size={20} />
              </button>
              <button type="button" className="practive-btn icon" onClick={loadRequests} title="Refresh">
                <RefreshCw size={18} />
              </button>
              <button type="button" className="practive-btn icon" title="Search">
                <Search size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="practive-table-card">
          {loading ? (
            <div className="practive-empty">Loading document collection...</div>
          ) : requests.length === 0 ? (
            <div className="practive-empty">No document collection requests found.</div>
          ) : (
            <div className="practive-table-scroll">
              <table className="practive-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" className="practive-checkbox" /></th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Task</th>
                    <th>Message</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td><input type="checkbox" className="practive-checkbox" /></td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td><button type="button" className="practive-link">{request.task?.client?.clientName || "Client"}</button></td>
                      <td>
                        {request.task?._id ? (
                          <button type="button" className="practive-link" onClick={() => navigate(`/dashboard/tasks/${request.task._id}`)}>
                            {request.task.title}
                          </button>
                        ) : "Task"}
                      </td>
                      <td>{(request.requiredDocuments || []).join(" ") || "Documents requested"}</td>
                      <td>
                        <button type="button" className="practive-link" onClick={() => openDocuments(request)}>
                          {request.documentCount || 0}
                        </button>
                      </td>
                      <td>
                        <span className={`practive-status ${(request.status || "Open").toLowerCase()}`}>
                          {request.status === "Pending" ? "Open" : request.status}
                        </span>
                      </td>
                      <td><span className="practive-avatar">{request.requestedBy?.name?.[0] || "P"}</span></td>
                      <td><MoreVertical size={17} color="#8a94a6" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && (
            <div className="practive-pagination">
              {pagination.total} items
              <span>100 / page</span>
            </div>
          )}
        </section>

        {documentsModal.open && (
          <div className="practive-modal-backdrop">
            <div className="practive-modal">
              <div className="practive-modal-header">
                <h2>Documents</h2>
                <button
                  type="button"
                  className="practive-modal-close"
                  onClick={() => setDocumentsModal({ open: false, loading: false, documents: [], request: null })}
                >
                  <X size={22} />
                </button>
              </div>
              <div style={{ padding: 20 }}>
                {documentsModal.loading ? (
                  <div className="practive-empty">Loading documents...</div>
                ) : documentsModal.documents.length === 0 ? (
                  <div className="practive-empty">No uploaded files for this request.</div>
                ) : (
                  <div className="practive-doc-list">
                    {documentsModal.documents.map((document) => (
                      <div className="practive-doc-item" key={document._id}>
                        <div className="practive-doc-name">
                          <FileText size={15} />
                          <span>{document.originalName || document.fileName}</span>
                        </div>
                        <button type="button" className="practive-btn icon" title="Info">
                          <Info size={15} />
                        </button>
                        <a className="practive-btn icon" href={getDocumentDownloadUrl(document.path)} download title="Download">
                          <Download size={15} />
                        </a>
                        <button type="button" className="practive-btn icon" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentCollection;
