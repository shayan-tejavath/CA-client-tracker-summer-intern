import { useEffect, useState } from "react";
import { ArrowLeft, Download, MoreVertical, Plus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getClients } from "../../services/clientService.js";
import { createDscRecord, getDscRecords } from "../../services/dscService.js";
import "../../styles/documents-dsc.css";

const initialForm = {
  client: "",
  dscClass: "Class 1",
  password: "",
  issueDate: "",
  expiryDate: "",
  status: "New created",
  notes: "",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const DscManagement = () => {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [settings, setSettings] = useState({ renewalWindowDays: 30 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    clientId: "",
    dateFrom: "",
    dateTo: "",
    status: "All",
  });

  const loadClients = async () => {
    const data = await getClients({ limit: 500 });
    setClients(data.clients || []);
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getDscRecords({
        clientId: filters.clientId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        status: filters.status,
        limit: 100,
      });
      setRecords(data.records || []);
      setPagination(data.pagination || null);
      setSettings(data.settings || { renewalWindowDays: 30 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load DSC records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients().catch(() => setClients([]));
  }, []);

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createDscRecord(form);
      toast.success("DSC record created.");
      setForm(initialForm);
      setModalOpen(false);
      loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create DSC record.");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Client", "Class", "Issue Date", "Expiry Date", "Notes", "Created By"],
      ...records.map((record) => [
        record.client?.clientName || "",
        record.dscClass,
        formatDate(record.issueDate),
        formatDate(record.expiryDate),
        record.notes || "",
        record.createdBy?.name || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dsc-management.csv";
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
            <h1>DSC Management</h1>
          </div>
          <div className="practive-actions">
            <button type="button" className="practive-btn">
              Import
            </button>
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
              <label>Issue Date</label>
              <input className="practive-input" type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
            </div>
            <div className="practive-field">
              <label>Expiry Date</label>
              <input className="practive-input" type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} />
            </div>
            <div className="practive-field">
              <label>Client *</label>
              <select className="practive-select" value={filters.clientId} onChange={(event) => updateFilter("clientId", event.target.value)}>
                <option value="">Select...</option>
                {clients.map((client) => <option key={client._id} value={client._id}>{client.clientName}</option>)}
              </select>
            </div>
            <div className="practive-row-actions">
              <button type="button" className="practive-btn icon" onClick={() => setModalOpen(true)} title="Add">
                <Plus size={20} />
              </button>
              <button type="button" className="practive-btn icon" onClick={loadRecords} title="Refresh">
                <RefreshCw size={18} />
              </button>
              <button type="button" className="practive-btn icon" title="Search">
                <Search size={18} />
              </button>
            </div>
          </div>
          <div style={{ marginTop: 14, color: "#64748b", fontSize: 13 }}>
            Renewal tasks are surfaced {settings.renewalWindowDays} days before expiry.
          </div>
        </section>

        <section className="practive-table-card">
          {loading ? (
            <div className="practive-empty">Loading DSC records...</div>
          ) : records.length === 0 ? (
            <div className="practive-empty">No DSC records found.</div>
          ) : (
            <div className="practive-table-scroll">
              <table className="practive-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" className="practive-checkbox" /></th>
                    <th>Client</th>
                    <th>Class</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td><input type="checkbox" className="practive-checkbox" /></td>
                      <td><button type="button" className="practive-link">{record.client?.clientName || "Client"}</button></td>
                      <td>{record.dscClass}</td>
                      <td>{formatDate(record.issueDate)}</td>
                      <td>{formatDate(record.expiryDate)}</td>
                      <td>{record.notes || record.status}</td>
                      <td><span className="practive-avatar">{record.createdBy?.name?.[0] || "U"}</span></td>
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
            <form className="practive-modal" onSubmit={handleSubmit}>
              <div className="practive-modal-header">
                <h2>New DSC</h2>
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
                  <label>Class *</label>
                  <select className="practive-select" required value={form.dscClass} onChange={(event) => setForm({ ...form, dscClass: event.target.value })}>
                    <option>Class 1</option>
                    <option>Class 2</option>
                    <option>Class 3</option>
                  </select>
                </div>
                <div className="practive-field">
                  <label>Password</label>
                  <input className="practive-input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </div>
                <div className="practive-field">
                  <label>Issue Date *</label>
                  <input className="practive-input" required type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} />
                </div>
                <div className="practive-field">
                  <label>Expiry Date *</label>
                  <input className="practive-input" required type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
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

export default DscManagement;
