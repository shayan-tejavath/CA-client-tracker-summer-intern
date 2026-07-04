import { useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  deleteClient,
  getClients,
  archiveClient,
  restoreClient,
} from "../../services/clientService.js";

import BulkImportDialog from "../../components/clients/BulkImportDialog";

import {
  Upload,
  Plus,
  Search,
  Eye,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
} from "lucide-react";

const ClientsList = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const canCreateClient = [
    "SuperAdmin",
    "Partner",
  ].includes(user?.role);

  const canEditClient = [
    "SuperAdmin",
    "Partner",
    "Manager",
  ].includes(user?.role);

  // DATA

  const [clients, setClients] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  // FILTERS

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [industryFilter, setIndustryFilter] =
    useState("All");

  const [activeActionsMenu, setActiveActionsMenu] =
    useState(null);

  // PAGINATION

  const [page, setPage] = useState(1);

  const [limit, setLimit] =
    useState(10);

  const [pagination, setPagination] =
    useState({
      totalClients: 0,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    });
  const [selectedClientIds, setSelectedClientIds] =
    useState([]);
  const [showImportDialog, setShowImportDialog] =
    useState(false);

  // Moveable loader so it can be reused after import
  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClients({
        search,
        status: statusFilter,
        type: typeFilter,
        page,
        limit,
      });

      setClients(data.clients);
      setSelectedClientIds([]);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load clients."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOAD CLIENTS

  useEffect(() => {
    loadClients();
  }, [
    search,
    statusFilter,
    typeFilter,
    page,
    limit,
  ]);

  // STATS

  const totalClients =
    pagination.totalClients;

  const activeClients = clients.filter(
    (client) =>
      client.status === "Active"
  ).length;

  const pendingClients = clients.filter(
    (client) =>
      client.status === "Pending"
  ).length;

  const industryOptions = useMemo(() => {
    const industries = new Set();
    clients.forEach((client) => {
      if (client.industryType) {
        industries.add(client.industryType);
      }
    });
    return ["All", ...Array.from(industries).sort()];
  }, [clients]);

  const displayedClients = useMemo(() => {
    if (industryFilter === "All") return clients;
    return clients.filter(
      (client) =>
        client.industryType === industryFilter
    );
  }, [clients, industryFilter]);

  const inactiveClients = clients.filter(
    (client) =>
      client.status === "Inactive"
  ).length;

  // ARCHIVE

  const handleToggleSelect = (clientId) => {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
      return;
    }

    setSelectedClientIds(clients.map((client) => client._id));
  };

  const handleBulkDelete = async () => {
    if (selectedClientIds.length === 0) return;

    const confirmed = window.confirm(
      `Permanently delete ${selectedClientIds.length} selected client(s)?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedClientIds.map((clientId) =>
          deleteClient(clientId)
        )
      );

      toast.success(
        `${selectedClientIds.length} client(s) deleted permanently.`
      );

      setClients((current) =>
        current.filter(
          (client) =>
            !selectedClientIds.includes(client._id)
        )
      );
      setSelectedClientIds([]);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to delete selected clients."
      );
    }
  };

  const handleArchive = async (
    clientId
  ) => {
    const confirmed = window.confirm(
      "Archive this client?"
    );

    if (!confirmed) return;

    try {
      await archiveClient(clientId);

      toast.success(
        "Client archived successfully."
      );

      setClients((current) =>
        current.filter(
          (client) =>
            client._id !== clientId
        )
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to archive client."
      );
    }
  };

  // RESTORE

  const handleRestore = async (
    clientId
  ) => {
    try {
      await restoreClient(clientId);

      toast.success(
        "Client restored successfully."
      );

      setClients((current) =>
        current.map((client) =>
          client._id === clientId
            ? {
                ...client,
                isArchived: false,
              }
            : client
        )
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to restore client."
      );
    }
  };

  // DELETE

  const handleDelete = async (
    clientId
  ) => {
    const confirmed = window.confirm(
      "Delete this client permanently?"
    );

    if (!confirmed) return;

    try {
      await deleteClient(clientId);

      toast.success(
        "Client deleted successfully."
      );

      setClients((current) =>
        current.filter(
          (client) =>
            client._id !== clientId
        )
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to delete client."
      );
    }
  };

  // HELPERS

  const getStatusBadgeClass = (
    status
  ) => {
    switch (status) {
      case "Active":
        return "status-badge active";

      case "Pending":
        return "status-badge pending";

      case "Inactive":
        return "status-badge inactive";

      default:
        return "status-badge";
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPendingTaskCount = (client) =>
    client.pendingTaskCount ?? client.pendingTasks ?? 0;

  const getDocumentCount = (client) =>
    client.documentCount ?? client.documents?.length ?? 0;

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header" style={{ alignItems: "flex-start" }}>
          <div style={{ maxWidth: 760 }}>
            <p className="eyebrow">Clients</p>
            <h1>Client management</h1>
            <p>
              Search, manage, and track all your clients in one place.
            </p>
          </div>

          {canCreateClient && (
            <div className="page-tools">
              <button
                type="button"
                className="button primary"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload size={16} />
                Import
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => navigate("/dashboard/clients/add")}
              >
                <Plus size={16} />
                Add client
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            margin: "20px 0",
          }}
        >
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Total clients
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {totalClients}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Active
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {activeClients}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Pending
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {pendingClients}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Inactive
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {inactiveClients}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Search</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--hover)", borderRadius: 8, paddingRight: 12 }}>
                <Search size={16} style={{ color: "var(--text-secondary)", marginLeft: 12 }} />
                <input
                  type="text"
                  placeholder="Name, email, code..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  style={{ background: "transparent", border: "none", flex: 1, padding: "10px 0" }}
                />
              </div>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Type</span>
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="LLP">LLP</option>
                <option value="Private Limited">Private Limited</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Industry</span>
              <select
                value={industryFilter}
                onChange={(event) => {
                  setIndustryFilter(event.target.value);
                  setPage(1);
                }}
              >
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ height: 40 }} />
          </div>
        </div>

        {loading ? (
          <div className="alert">
            Loading clients...
          </div>
        ) : error ? (
          <div className="alert danger">
            {error}
          </div>
        ) : (
          <>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {canEditClient && (
                          <th className="select-column">
                            <input
                              type="checkbox"
                              checked={
                                clients.length > 0 &&
                                selectedClientIds.length ===
                                  clients.length
                              }
                              onChange={handleSelectAll}
                              aria-label="Select all clients"
                            />
                          </th>
                        )}
                        <th className="client-photo-header" aria-label="Client avatar" />
                        <th>Client</th>
                        <th>Contact</th>
                        <th>PAN / GSTIN</th>
                        <th>Type</th>
                        <th>Manager</th>
                        <th>Status</th>
                        <th>Pending</th>
                        <th>Docs</th>
                        <th>Updated</th>
                        <th className="actions-cell">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={canEditClient ? 12 : 11}>
                            No clients found.
                          </td>
                        </tr>
                      ) : (
                        clients.map((client) => (
                          <tr
                            key={client._id}
                            className={
                              client.isArchived
                                ? "archived-row"
                                : ""
                            }
                          >
                            {canEditClient && (
                              <td className="select-column">
                                <input
                                  type="checkbox"
                                  checked={selectedClientIds.includes(
                                    client._id
                                  )}
                                  onChange={() =>
                                    handleToggleSelect(client._id)
                                  }
                                  aria-label={`Select ${client.clientName}`}
                                />
                              </td>
                            )}
                            <td className="client-photo-cell">
                              <div className="client-avatar">
                                {client.profileImage ? (
                                  <img
                                    src={client.profileImage}
                                    alt={client.clientName}
                                  />
                                ) : (
                                  <span>
                                    {client.clientName
                                      ? client.clientName
                                          .split(" ")
                                          .map((part) => part[0])
                                          .join("")
                                          .slice(0, 2)
                                      : "C"}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <div className="client-profile-cell">
                                <button
                                  type="button"
                                  className="link-button client-name-link"
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/clients/${client._id}`
                                    )
                                  }
                                >
                                  {client.clientName || "—"}
                                </button>
                                <span className="client-code">
                                  {client.clientCode || "—"}
                                </span>
                              </div>
                            </td>

                            <td className="contact-cell">
                              <div className="contact-email">
                                {client.email || "—"}
                              </div>
                              <div className="contact-phone">
                                {client.mobile || "—"}
                              </div>
                            </td>

                            <td className="pan-gstin-cell">
                              <div>{client.pan || "—"}</div>
                              <div className="gstin-value">
                                {client.gstin || "—"}
                              </div>
                            </td>

                            <td>{client.clientType || "—"}</td>
                            <td>{client.assignedManager || "—"}</td>

                            <td>
                              <span
                                className={getStatusBadgeClass(
                                  client.status
                                )}
                              >
                                {client.status || "—"}
                              </span>
                            </td>

                            <td>{getPendingTaskCount(client)}</td>
                            <td>{getDocumentCount(client)}</td>
                            <td>{formatDate(client.updatedAt)}</td>

                            <td className="actions-cell">
                              <button
                                type="button"
                                className="button secondary small"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/clients/${client._id}`
                                  )
                                }
                              >
                                View
                              </button>

                              {canEditClient &&
                                (client.isArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      className="button secondary small"
                                      onClick={() =>
                                        handleRestore(client._id)
                                      }
                                    >
                                      Restore
                                    </button>
                                    <button
                                      type="button"
                                      className="button danger small"
                                      onClick={() =>
                                        handleDelete(client._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="button secondary small"
                                      onClick={() =>
                                        navigate(
                                          `/dashboard/clients/${client._id}/edit`
                                        )
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="button danger small"
                                      onClick={() =>
                                        handleDelete(client._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </>
                                ))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-bar">
                  <button
                    className="button secondary"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => current - 1)
                    }
                  >
                    Previous
                  </button>

                  <div className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>

                  <button
                    className="button secondary"
                    disabled={page === pagination.totalPages}
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
        </section>

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImported={async () => {
            setShowImportDialog(false);

            await loadClients();

            toast.success(
              "Clients imported successfully."
            );
        }}
      />
    </DashboardLayout>
  );
};

export default ClientsList;

  
