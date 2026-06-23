import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { deleteService, getServices } from "../../services/serviceService.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ServicesList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const canManageService = ["SuperAdmin", "Partner"].includes(user?.role);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load services.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return services;
    return services.filter((service) => {
      return [service.serviceCategory, service.subService, service.frequency, service.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [services, search]);

  const handleDelete = async (serviceId) => {
    const confirmed = window.confirm("Are you sure you want to delete this service?");
    if (!confirmed) return;

    try {
      await deleteService(serviceId);
      setServices((current) => current.filter((service) => service._id !== serviceId));
      toast.success("Service deleted successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete the service.");
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">
        <div className="page-header">
          <div>
            <p className="eyebrow">Services</p>
            <h1>Service management</h1>
            <p>Search, edit, and remove service offerings available in your practice.</p>
          </div>
          {canManageService && (
            <div className="page-tools">
              <button type="button" className="button secondary" onClick={() => navigate("/dashboard/services/add")}> 
                Add service
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="Search services by name, category, frequency, or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="alert">Loading services...</div>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Service name</th>
                  <th>Frequency</th>
                  <th>Description</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="5">No services match your search.</td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service._id}>
                      <td onClick={() => navigate(`/dashboard/services/${service._id}`)} style={{ cursor: "pointer" }}>
                        {service.serviceCategory || "—"}
                      </td>
                      <td onClick={() => navigate(`/dashboard/services/${service._id}`)} style={{ cursor: "pointer" }}>
                        {service.subService || "—"}
                      </td>
                      <td onClick={() => navigate(`/dashboard/services/${service._id}`)} style={{ cursor: "pointer" }}>
                        {service.frequency || "—"}
                      </td>
                      <td onClick={() => navigate(`/dashboard/services/${service._id}`)} style={{ cursor: "pointer" }}>
                        {service.description || "—"}
                      </td>
                      <td className="actions-cell">
                        {canManageService && (
                          <>
                            <button
                              type="button"
                              className="button secondary small"
                              onClick={() => navigate(`/dashboard/services/${service._id}`)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="button secondary small"
                              onClick={() => navigate(`/dashboard/services/edit/${service._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button danger small"
                              onClick={() => handleDelete(service._id)}
                            >
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

export default ServicesList;
