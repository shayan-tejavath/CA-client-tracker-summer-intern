import { useEffect, useState } from "react";

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

const ClientsList = () => {
  const navigate = useNavigate();

  const { user } = useAuth();

  const canCreateClient = [
    "SuperAdmin",
    "Partner",
  ].includes(user?.role);

  const canEditClient = canCreateClient;

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

  // LOAD CLIENTS

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
        setError(
          err.response?.data?.message ||
            "Failed to load clients."
        );
      } finally {
        setLoading(false);
      }
    };

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

  const inactiveClients = clients.filter(
    (client) =>
      client.status === "Inactive"
  ).length;

  // ARCHIVE

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

  // BADGE

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

  return (
    <DashboardLayout>
      <section className="page-card">
        {/* HEADER */}

        <div className="page-header">
          <div>
            <p className="eyebrow">
              Clients
            </p>

            <h1>
              Client Management
            </h1>

            <p>
              Manage onboarding,
              compliance, and services.
            </p>
          </div>

          {canCreateClient && (
            <div className="page-tools">
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  navigate(
                    "/dashboard/clients/add"
                  )
                }
              >
                Add Client
              </button>
            </div>
          )}
        </div>

        {/* STATS */}

        <div className="client-stats-grid">
          <div className="client-stat-card">
            <h2>{totalClients}</h2>

            <p>Total Clients</p>
          </div>

          <div className="client-stat-card active">
            <h2>{activeClients}</h2>

            <p>Active</p>
          </div>

          <div className="client-stat-card pending">
            <h2>{pendingClients}</h2>

            <p>Pending</p>
          </div>

          <div className="client-stat-card inactive">
            <h2>{inactiveClients}</h2>

            <p>Inactive</p>
          </div>
        </div>

        {/* FILTERS */}

        <div className="client-filters">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setPage(1);
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value
              );

              setPage(1);
            }}
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(
                event.target.value
              );

              setPage(1);
            }}
          >
            <option value="All">
              All Types
            </option>

            <option value="Individual">
              Individual
            </option>

            <option value="Business">
              Business
            </option>

            <option value="LLP">
              LLP
            </option>

            <option value="Private Limited">
              Private Limited
            </option>
          </select>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(
                Number(
                  event.target.value
                )
              );

              setPage(1);
            }}
          >
            <option value={5}>
              5 / page
            </option>

            <option value={10}>
              10 / page
            </option>

            <option value={20}>
              20 / page
            </option>

            <option value={50}>
              50 / page
            </option>
          </select>
        </div>

        {/* TABLE */}

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
                    <th>Client</th>

                    <th>Type</th>

                    <th>Status</th>

                    <th>Manager</th>

                    <th>Mobile</th>

                    <th>Services</th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clients.length ===
                  0 ? (
                    <tr>
                      <td colSpan="8">
                        No clients found.
                      </td>
                    </tr>
                  ) : (
                    clients.map(
                      (client) => (
                        <tr
                          key={
                            client._id
                          }
                          className={
                            client.isArchived
                              ? "archived-row"
                              : ""
                          }
                        >
                          <td>
                            <div className="client-name-cell">
                              <button
                                type="button"
                                className="link-button"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/clients/${client._id}`
                                  )
                                }
                              >
                                {
                                  client.clientName
                                }
                              </button>

                              <span>
                                {
                                  client.email
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            {client.clientType ||
                              "—"}
                          </td>

                          <td>
                            <span
                              className={getStatusBadgeClass(
                                client.status
                              )}
                            >
                              {
                                client.status
                              }
                            </span>
                          </td>

                          <td>
                            {client.assignedManager ||
                              "—"}
                          </td>

                          <td>
                            {client.mobile ||
                              "—"}
                          </td>

                          <td>
                            <div className="service-tags">
                              {client.assignedServices?.slice(
                                0,
                                2
                              ).map(
                                (
                                  service
                                ) => (
                                  <span
                                    key={
                                      service
                                    }
                                    className="service-tag"
                                  >
                                    {
                                      service
                                    }
                                  </span>
                                )
                              )}
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
                                      onClick={() =>
                                        handleArchive(
                                          client._id
                                        )
                                      }
                                    >
                                      Archive
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="button success small"
                                      onClick={() =>
                                        handleRestore(
                                          client._id
                                        )
                                      }
                                    >
                                      Restore
                                    </button>

                                    <button
                                      type="button"
                                      className="button danger small"
                                      onClick={() =>
                                        handleDelete(
                                          client._id
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="pagination-bar">
              <button
                className="button secondary"
                disabled={page === 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1
                  )
                }
              >
                Previous
              </button>

              <div className="pagination-info">
                Page {pagination.currentPage} of{" "}
                {pagination.totalPages}
              </div>

              <button
                className="button secondary"
                disabled={
                  page ===
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ClientsList;