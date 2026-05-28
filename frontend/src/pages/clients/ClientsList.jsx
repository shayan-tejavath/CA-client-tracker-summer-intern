import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { deleteClient, getClients } from "../../services/clientService.js";

const ClientsList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const canCreateClient = ["SuperAdmin", "Partner"].includes(user?.role);
  const canEditClient = canCreateClient;

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load clients.");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) => {
      return [client.clientName, client.email, client.mobile, client.pan, client.gstin]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [clients, search]);

  const handleDelete = async (clientId) => {
    const confirmed = window.confirm("Are you sure you want to delete this client?");
    if (!confirmed) return;

    try {
      await deleteClient(clientId);
      setClients((current) => current.filter((client) => client._id !== clientId));
      toast.success("Client deleted successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete the client.");
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Clients</p>
            <h1>Client management</h1>
            <p>Search, review, edit, and delete client records in your practice.</p>
          </div>
            {canCreateClient && (
              <div className="page-tools">
                <button type="button" className="button secondary" onClick={() => navigate("/dashboard/clients/add")}> 
                  Add client
                </button>
              </div>
            )}
            <input
              type="text"
              placeholder="Search clients by name, email, mobile, PAN, or GSTIN"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
        </div>

        {loading ? (
          <div className="alert">Loading clients...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>PAN</th>
                  <th>GSTIN</th>
                  <th>Services</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="6">No clients match your search.</td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td>
                        <button type="button" className="link-button" onClick={() => navigate(`/dashboard/clients/${client._id}`)}>
                          {client.clientName}
                        </button>
                      </td>
                      <td>{client.email || "—"}</td>
                      <td>{client.mobile || "—"}</td>
                      <td>{client.pan || "—"}</td>
                      <td>{client.gstin || "—"}</td>
                      <td>{client.assignedServices?.join(", ") || "—"}</td>
                      <td className="actions-cell">
                        <Link className="button secondary small" to={`/dashboard/clients/${client._id}`}>View</Link>
                        {canEditClient && (
                          <>
                            <Link className="button secondary small" to={`/dashboard/clients/${client._id}/edit`}>
                              Edit
                            </Link>
                            <button type="button" className="button danger small" onClick={() => handleDelete(client._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ClientsList;
