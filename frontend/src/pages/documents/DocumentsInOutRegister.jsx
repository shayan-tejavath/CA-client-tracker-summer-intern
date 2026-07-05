import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, MoreVertical, Plus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import {
  createDocumentRegisterEntry,
  getDocuments,
  updateDocument,
} from "../../services/documentService.js";
import "../../styles/documents-dsc.css";

const categories = [
  "All",
  "PAN",
  "GST",
  "Invoice",
  "Agreement",
  "Tax Filing",
  "Audit",
  "Compliance",
  "Bank Statement",
  "Digital Signature",
  "DSC",
  "ROC",
  "TDS",
  "Income Tax",
  "Other",
];

const initialForm = {
  client: "",
  originalFileName: "",
  category: "Other",
  movementType: "Received",
  returnStatus: "Pending Return",
  returnDate: "",
  location: "",
  notes: "",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const DocumentsInOutRegister = () => {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    category: "All",
    movementType: "All",
    search: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });

  const loadClients = async () => {
    const data = await getClients({ limit: 500 });
    setClients(data.clients || []);
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocuments(false, {
        category: filters.category === "All" ? undefined : filters.category,
        movementType: filters.movementType === "All" ? undefined : filters.movementType,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: filters.page,
        limit: 100,
      });
      setDocuments(data.documents || []);
      setPagination(data.pagination || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load document register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients().catch(() => setClients([]));
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const selectedCategoryOptions = useMemo(
    () => categories.filter((category) => category !== "All"),
    []
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createDocumentRegisterEntry(form);
      toast.success("Document register entry created.");
      setForm(initialForm);
      setModalOpen(false);
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create document entry.");
    }
  };

  const markReturned = async (document) => {
    try {
      await updateDocument(document._id, {
        returnStatus: "Returned",
        returnDate: new Date().toISOString(),
      });
      toast.success("Document marked returned.");
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update return status.");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Doc Type", "Category", "Client", "Return", "Location", "Notes"],
      ...documents.map((document) => [
        formatDate(document.createdAt),
        document.originalFileName || document.fileName,
        document.movementType || document.category,
        document.client?.clientName || "",
        document.returnStatus === "Returned"
          ? formatDate(document.returnDate)
          : document.returnStatus,
        document.location || "",
        document.notes || document.description || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "documents-in-out-register.csv";
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
            <h1>Documents In-Out Register</h1>
          </div>
          <div className="practive-actions">
            <button type="button" className="practive-btn" onClick={exportCsv}>
              <Download size={16} />
              Export
            </button>
            <button type="button" className="practive-btn primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} />
              New
            </button>
          </div>
        </div>

        <section className="practive-filter-card">
          <div className="practive-filter-grid">
            <div className="practive-field">
              <label>Date</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input className="practive-input" type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
                <input className="practive-input" type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} />
              </div>
            </div>
            <div className="practive-field">
              <label>Category</label>
              <select className="practive-select" value={filters.movementType} onChange={(event) => updateFilter("movementType", event.target.value)}>
                <option>All</option>
                <option>Received</option>
                <option>Given</option>
              </select>
            </div>
            <div className="practive-field">
              <label>Doc. Type</label>
              <select className="practive-select" value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div className="practive-row-actions">
              <button type="button" className="practive-btn icon" onClick={() => setModalOpen(true)} title="Add">
                <Plus size={20} />
              </button>
              <button type="button" className="practive-btn icon" onClick={loadDocuments} title="Refresh">
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
            <div className="practive-empty">Loading register...</div>
          ) : documents.length === 0 ? (
            <div className="practive-empty">No document movement entries found.</div>
          ) : (
            <div className="practive-table-scroll">
              <table className="practive-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" className="practive-checkbox" /></th>
                    <th>Date</th>
                    <th>Doc. Type</th>
                    <th>Category</th>
                    <th>Client</th>
                    <th>Return</th>
                    <th>Location</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document._id}>
                      <td><input type="checkbox" className="practive-checkbox" /></td>
                      <td>{formatDate(document.createdAt)}</td>
                      <td>{document.originalFileName || document.fileName || document.category}</td>
                      <td>{document.movementType || "Received"}</td>
                      <td>{document.client?.clientName || "Client"}</td>
                      <td>
                        {document.returnStatus === "Pending Return" ? (
                          <button type="button" className="practive-status pending" onClick={() => markReturned(document)}>
                            Mark Returned
                          </button>
                        ) : document.returnStatus === "Returned" ? (
                          formatDate(document.returnDate)
                        ) : (
                          document.returnStatus
                        )}
                      </td>
                      <td>{document.location || ""}</td>
                      <td>{document.notes || document.description || ""}</td>
                      <td><span className="practive-avatar">{document.uploadedBy?.name?.[0] || "U"}</span></td>
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

        {modalOpen && (
          <div className="practive-modal-backdrop">
            <form className="practive-modal wide" onSubmit={handleSubmit}>
              <div className="practive-modal-header">
                <h2>New Document Entry</h2>
                <button type="button" className="practive-modal-close" onClick={() => setModalOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="practive-modal-body">
                <div className="practive-field full">
                  <label>Client *</label>
                  <select className="practive-select" required value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })}>
                    <option value="">Select...</option>
                    {clients.map((client) => <option key={client._id} value={client._id}>{client.clientName}</option>)}
                  </select>
                </div>
                <div className="practive-field">
                  <label>Doc. Type *</label>
                  <input className="practive-input" required value={form.originalFileName} onChange={(event) => setForm({ ...form, originalFileName: event.target.value })} placeholder="Aadhar Card" />
                </div>
                <div className="practive-field">
                  <label>Category</label>
                  <select className="practive-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {selectedCategoryOptions.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </div>
                <div className="practive-field">
                  <label>Movement</label>
                  <select className="practive-select" value={form.movementType} onChange={(event) => setForm({ ...form, movementType: event.target.value })}>
                    <option>Received</option>
                    <option>Given</option>
                  </select>
                </div>
                <div className="practive-field">
                  <label>Return</label>
                  <select className="practive-select" value={form.returnStatus} onChange={(event) => setForm({ ...form, returnStatus: event.target.value })}>
                    <option>Pending Return</option>
                    <option>Returned</option>
                    <option>Not Returnable</option>
                  </select>
                </div>
                <div className="practive-field">
                  <label>Return Date</label>
                  <input className="practive-input" type="date" value={form.returnDate} onChange={(event) => setForm({ ...form, returnDate: event.target.value })} />
                </div>
                <div className="practive-field">
                  <label>Location</label>
                  <input className="practive-input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Rack no. 2" />
                </div>
                <div className="practive-field full">
                  <label>Notes</label>
                  <textarea className="practive-textarea" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                </div>
              </div>
              <div className="practive-modal-footer">
                <button type="submit" className="practive-btn primary">Save</button>
                <button type="button" className="practive-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentsInOutRegister;
