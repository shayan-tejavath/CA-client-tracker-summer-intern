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

import "../../styles/clients-list.css";

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
      "Permanently delete this client?"
    );

    if (!confirmed) return;

    try {
      await deleteClient(clientId);

      toast.success(
        "Client deleted permanently."
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
      <section className="page-card clients-page">
        <div className="clients-page-inner">
          <div className="clients-header clients-header--compact">
            <div className="clients-header-copy">
              <p className="clients-eyebrow">Clients</p>
              <div className="clients-title-row">
                <h1 className="clients-title">Clients</h1>
                <p className="clients-subtitle">
                  Manage and track all your clients in one place.
                </p>
              </div>
            </div>

            <div className="clients-header-actions">
              {canCreateClient && (
                <>
                  <button
                    type="button"
                    className="button import-button"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Upload size={16} />
                    Import Clients
                  </button>
                  <button
                    type="button"
                    className="button add-button"
                    onClick={() => navigate("/dashboard/clients/add")}
                  >
                    <Plus size={16} />
                    Add Client
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="clients-stats-grid">
            <div className="stat-card stat-card--default">
              <div className="stat-card__icon stat-card__icon--default">
                <Users size={20} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Total clients</span>
                <span className="stat-card__value">{totalClients}</span>
              </div>
            </div>
            <div className="stat-card stat-card--active">
              <div className="stat-card__icon stat-card__icon--active">
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Active</span>
                <span className="stat-card__value">{activeClients}</span>
              </div>
            </div>
            <div className="stat-card stat-card--pending">
              <div className="stat-card__icon stat-card__icon--pending">
                <Clock size={20} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Pending</span>
                <span className="stat-card__value">{pendingClients}</span>
              </div>
            </div>
            <div className="stat-card stat-card--inactive">
              <div className="stat-card__icon stat-card__icon--inactive">
                <FileText size={20} />
              </div>
              <div className="stat-card__content">
                <span className="stat-card__label">Inactive</span>
                <span className="stat-card__value">{inactiveClients}</span>
              </div>
            </div>
          </div>

          <div className="clients-filters-card">
            <div className="clients-filters clients-filters--compact">
              <label className="filter-field filter-search">
                <span>Search clients</span>
                <div className="search-input-group">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search clients by name, email, or code"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </label>

              <label className="filter-field">
                <span>Status</span>
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

              <label className="filter-field">
                <span>Type</span>
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

              <label className="filter-field">
                <span>Industries</span>
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

              <button type="button" className="button filter-button">
                Filters
              </button>
            </div>
          </div>

          <div className="clients-table-card">
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
                <div className="clients-table-top">
                  <div>
                    <h2>Client directory</h2>
                    <p>
                      A summary of all client accounts and
                      their status in the system.
                    </p>
                  </div>
                  <p className="clients-table-meta">
                    Showing {clients.length} of {totalClients} clients
                  </p>
                </div>

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
                        <th>Actions</th>
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
                                className="icon-button"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/clients/${client._id}`
                                  )
                                }
                                aria-label="View client"
                              >
                                <Eye size={16} />
                              </button>

                              {canEditClient &&
                                (client.isArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      className="icon-button"
                                      onClick={() =>
                                        handleRestore(client._id)
                                      }
                                      aria-label="Restore client"
                                    >
                                      <Copy size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-button danger-icon"
                                      onClick={() =>
                                        handleDelete(client._id)
                                      }
                                      aria-label="Delete client"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="icon-button"
                                      onClick={() =>
                                        navigate(
                                          `/dashboard/clients/${client._id}/edit`
                                        )
                                      }
                                      aria-label="Edit client"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-button warning-icon"
                                      onClick={() =>
                                        handleArchive(client._id)
                                      }
                                      aria-label="Archive client"
                                    >
                                      <Trash2 size={16} />
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
          </div>
        </div>
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

  
