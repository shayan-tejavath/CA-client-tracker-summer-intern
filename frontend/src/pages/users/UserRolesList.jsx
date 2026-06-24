import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getUserRoles } from "../../services/adminService.js";
import "../../styles/users.css";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api$/, "");

const getPhotoUrl = (photo) => {
  if (!photo) return "";
  if (photo.startsWith("http")) return photo;
  return `${apiBase}${photo}`;
};

const UserRolesList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        setRoles(await getUserRoles());
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load user roles.");
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => role.name.toLowerCase().includes(query));
  }, [roles, search]);

  return (
    <DashboardLayout>
      <div className="users-page">
        <div className="users-header">
          <div>
            <p className="users-eyebrow">SuperAdmin</p>
            <h1>User Roles</h1>
          </div>

          <button className="users-primary" type="button" onClick={() => navigate("/dashboard/user-roles/new")}>
            + New
          </button>
        </div>

        <section className="users-card">
          <label className="users-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles" />
          </label>

          {error && <div className="users-alert">{error}</div>}

          {loading ? (
            <div className="users-empty">Loading roles...</div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Assigned Users</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role._id || role.id}>
                      <td>
                        <button
                          type="button"
                          className="link-button users-link"
                          onClick={() => navigate(`/dashboard/user-roles/${role._id || role.id}`)}
                        >
                          {role.name}
                        </button>
                      </td>
                      <td>
                        <div className="assigned-users">
                          {(role.assignedUsers || []).slice(0, 5).map((user) =>
                            user.photo ? (
                              <img key={user._id || user.id} src={getPhotoUrl(user.photo)} alt={user.name} />
                            ) : (
                              <span key={user._id || user.id} title={user.name}>
                                {user.name?.charAt(0)?.toUpperCase() || <UserCircle size={16} />}
                              </span>
                            )
                          )}
                          {(role.assignedUsers || []).length > 5 && (
                            <span>+{role.assignedUsers.length - 5}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRoles.length === 0 && <div className="users-empty">No user roles found.</div>}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserRolesList;
