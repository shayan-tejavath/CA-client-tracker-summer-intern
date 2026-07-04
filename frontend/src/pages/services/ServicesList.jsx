import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Users, UserRoundPlus, BadgeInfo, Sparkles } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { deleteService, getServices } from "../../services/serviceService.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ServicesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const canManageService = ["SuperAdmin", "Partner"].includes(user?.role);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getServices();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load services.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();

    const handleClientsImported = () => {
      loadServices();
    };

    window.addEventListener("clients-imported", handleClientsImported);
    return () => window.removeEventListener("clients-imported", handleClientsImported);
  }, []);

  const filteredServices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return services;

    return services.filter((service) => {
      const serviceFields = [
        service.serviceCategory,
        service.subService,
        service.frequency,
        service.description,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const assignedClientNames = (service.assignedClientsPreview || [])
        .flatMap((client) => [
          client.clientName,
          client.clientCode,
          client.email,
          client.mobile,
        ])
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return [...serviceFields, ...assignedClientNames].some((value) =>
        value.includes(normalized)
      );
    });
  }, [services, search]);

  const stats = useMemo(() => {
    const totalServices = services.length;
    const totalAssignedClients = services.reduce(
      (sum, service) => sum + (Number(service.clientCount) || 0),
      0
    );
    const servicesWithoutClients = services.filter(
      (service) => !(Number(service.clientCount) || 0)
    ).length;

    return {
      totalServices,
      totalAssignedClients,
      servicesWithoutClients,
    };
  }, [services]);

  const handleDelete = async (serviceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );
    if (!confirmed) return;

    try {
      await deleteService(serviceId);
      setServices((current) =>
        current.filter((service) => service._id !== serviceId)
      );
      toast.success("Service deleted successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete the service.");
    }
  };

  const openServiceDetails = (serviceId) => {
    navigate(`/dashboard/services/${serviceId}`);
  };

  const renderAvatarPreview = (preview = []) => {
    const items = preview.slice(0, 3);

    if (items.length === 0) {
      return (
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          No clients assigned
        </span>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", marginRight: 4 }}>
          {items.map((client, index) => (
            <div
              key={client._id || `${client.clientName}-${index}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: "999px",
                overflow: "hidden",
                border: "2px solid rgba(15, 23, 42, 0.95)",
                marginLeft: index === 0 ? 0 : -8,
                background: "rgba(59, 130, 246, 0.18)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
              title={client.clientName || client.clientCode || "Client"}
            >
              {client.profileImage ? (
                <img
                  src={client.profileImage}
                  alt={client.clientName || "Client"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  {(client.clientName || client.clientCode || "C").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>

        <span className="badge badge-info">
          {Number((preview || []).length) || 0} shown
        </span>

        {(Number((preview || []).length) || 0) > 3 && (
          <span className="badge">
            +{(Number((preview || []).length) || 0) - 3} more
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header" style={{ alignItems: "flex-start" }}>
          <div style={{ maxWidth: 760 }}>
            <p className="eyebrow">Services</p>
            <h1>Service management</h1>
            <p>
              Search, edit, and remove service offerings available in your practice.
            </p>
          </div>

          {canManageService && (
            <div className="page-tools">
              <button
                type="button"
                className="button primary"
                onClick={() => navigate("/dashboard/services/add")}
              >
                Add service
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
            margin: "20px 0",
          }}
        >
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Total services
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {stats.totalServices}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Assigned clients
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {stats.totalAssignedClients}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BadgeInfo size={18} />
              <div style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
                Empty services
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
              {stats.servicesWithoutClients}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search services, categories, frequencies, descriptions, or assigned clients"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="alert">Loading services...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : filteredServices.length === 0 ? (
          <div className="alert">No services match your search.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Service name</th>
                  <th>Frequency</th>
                  <th>Assigned clients</th>
                  <th>Description</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service._id}
                    tabIndex={0}
                    role="link"
                    onClick={() => openServiceDetails(service._id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openServiceDetails(service._id);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{service.serviceCategory || "—"}</td>
                    <td>
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong>{service.subService || "—"}</strong>
                        <span className="badge badge-info">
                          {Number(service.clientCount) || 0} client(s)
                        </span>
                      </div>
                    </td>
                    <td>{service.frequency || "—"}</td>
                    <td>{renderAvatarPreview(service.assignedClientsPreview || [])}</td>
                    <td>{service.description || "—"}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="button secondary small"
                        onClick={(event) => {
                          event.stopPropagation();
                          openServiceDetails(service._id);
                        }}
                      >
                        View details
                      </button>

                      <button
                        type="button"
                        className="button secondary small"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/dashboard/services/${service._id}`);
                        }}
                      >
                        <UserRoundPlus size={16} />
                        Assign Clients
                      </button>

                      {canManageService && (
                        <>
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/dashboard/services/edit/${service._id}`);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button danger small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(service._id);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ServicesList;