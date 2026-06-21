import { useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  deleteClient,
  getClients,
  archiveClient,
  restoreClient,
} from "../../services/clientService.js";

import "../../styles/clients-list.css";

const ClientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canCreateClient = ["SuperAdmin", "Partner"].includes(user?.role);
  const canEditClient = canCreateClient;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    totalClients: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);

        const data = await getClients({
          search,
          status: statusFilter,
          type: typeFilter,
          page,
          limit,
        });

        setClients(data.clients);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [search, statusFilter, typeFilter, page, limit]);

  const totalClients = pagination.totalClients;

  const activeClients = clients.filter((client) => client.status === "Active").length;
  const pendingClients = clients.filter((client) => client.status === "Pending").length;
  const inactiveClients = clients.filter((client) => client.status === "Inactive").length;

  const handleArchive = async (clientId) => {
    const confirmed = window.confirm("Archive this client?");
    if (!confirmed) return;

    try {
      await archiveClient(clientId);
      toast.success("Client archived successfully.");

      setClients((current) =>
        current.filter((client) => client._id !== clientId)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to archive client.");
    }
  };

  const handleRestore = async (clientId) => {
    try {
      await restoreClient(clientId);
      toast.success("Client restored successfully.");

      setClients((current) =>
        current.map((client) =>
          client._id === clientId
            ? { ...client, isArchived: false }
            : client
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to restore client.");
    }
  };

  const handleDelete = async (clientId) => {
    const confirmed = window.confirm("Permanently delete this client?");
    if (!confirmed) return;

    try {
      await deleteClient(clientId);
      toast.success("Client deleted permanently.");

      setClients((current) =>
        current.filter((client) => client._id !== clientId)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete client.");
    }
  };

  const getStatusBadgeClass = (status) => {
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

  return (
    <DashboardLayout>
      <div className="page-content clients-page">
        <section className="page-header clients-page__header">
          <div className="clients-page__header-copy">
            <span className="eyebrow">Clients</span>
            <h1>Client Management</h1>
            <p>Manage onboarding, compliance, and services.</p>
          </div>

          {canCreateClient && (
            <div className="page-tools">
              <button
                type="button"
                className="button primary"
                onClick={() => navigate("/dashboard/clients/add")}
              >
                Add Client
              </button>
            </div>
          )}
        </section>

        <section className="clients-stats-grid">
          <article className="stat-card">
            <span className="stat-card__label">Total Clients</span>
            <strong className="stat-card__value">{totalClients}</strong>
            <span className="stat-card__meta">All clients in the system</span>
          </article>

          <article className="stat-card stat-card--active">
            <span className="stat-card__label">Active</span>
            <strong className="stat-card__value">{activeClients}</strong>
            <span className="stat-card__meta">Currently engaged clients</span>
          </article>

          <article className="stat-card stat-card--pending">
            <span className="stat-card__label">Pending</span>
            <strong className="stat-card__value">{pendingClients}</strong>
            <span className="stat-card__meta">Awaiting completion</span>
          </article>

          <article className="stat-card stat-card--inactive">
            <span className="stat-card__label">Inactive</span>
            <strong className="stat-card__value">{inactiveClients}</strong>
            <span className="stat-card__meta">Paused or dormant accounts</span>
          </article>
        </section>

        <section className="page-card clients-filters-card">
          <div className="clients-filters">
            <div className="field field--search">
              <label htmlFor="clientSearch">Search</label>
              <input
                id="clientSearch"
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
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
            </div>

            <div className="field">
              <label htmlFor="typeFilter">Type</label>
              <select
                id="typeFilter"
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
            </div>

            <div className="field">
              <label htmlFor="pageSize">Page size</label>
              <select
                id="pageSize"
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="page-card clients-state">
            <div className="clients-spinner" />
            <h3>Loading clients...</h3>
            <p>Fetching your latest client records and filters.</p>
          </div>
        ) : error ? (
          <div className="alert danger clients-alert">{error}</div>
        ) : (
          <section className="page-card clients-table-card">
            <div className="clients-table-top">
              <div>
                <h2>Clients</h2>
                <p>Browse, filter, and manage client accounts.</p>
              </div>
            </div>

            <div className="table-responsive clients-table-wrap">
              <table className="data-table clients-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Manager</th>
                    <th>Mobile</th>
                    <th>Services</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-inline">No clients found.</div>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr
                        key={client._id}
                        className={client.isArchived ? "archived-row" : ""}
                      >
                        <td>
                          <div className="client-name-cell">
                            <button
                              type="button"
                              className="link-button"
                              onClick={() =>
                                navigate(`/dashboard/clients/${client._id}`)
                              }
                            >
                              {client.clientName}
                            </button>
                            <span>{client.email}</span>
                          </div>
                        </td>

                        <td>{client.clientType || "—"}</td>

                        <td>
                          <span className={getStatusBadgeClass(client.status)}>
                            {client.status}
                          </span>
                        </td>

                        <td>{client.assignedManager || "—"}</td>

                        <td>{client.mobile || "—"}</td>

                        <td>
                          <div className="service-tags service-tags--compact">
                            {client.assignedServices?.slice(0, 2).map((service) => (
                              <span key={service} className="service-tag">
                                {service}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="actions-cell">
                          <Link
                            className="button secondary small"
                            to={`/dashboard/clients/${client._id}`}
                          >
                            View
                          </Link>

                          {canEditClient && (
                            <>
                              {!client.isArchived ? (
                                <>
                                  <Link
                                    className="button secondary small"
                                    to={`/dashboard/clients/${client._id}/edit`}
                                  >
                                    Edit
                                  </Link>

                                  <button
                                    type="button"
                                    className="button warning small"
                                    onClick={() => handleArchive(client._id)}
                                  >
                                    Archive
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="button success small"
                                    onClick={() => handleRestore(client._id)}
                                  >
                                    Restore
                                  </button>

                                  <button
                                    type="button"
                                    className="button danger small"
                                    onClick={() => handleDelete(client._id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <button
                type="button"
                className="button secondary"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <div className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <button
                type="button"
                className="button secondary"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientsList;