import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getUserRoles } from "../../services/adminService.js";
import "../../styles/users.css";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api$/, "");

const UserRolesList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
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
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Assigned Users</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role._id}>
                    <td>
                      <Link className="users-link" to={`/dashboard/user-roles/${role._id}`}>
                        {role.name}
                      </Link>
                    </td>
                    <td>
                      <div className="assigned-users">
                        {(role.assignedUsers || []).slice(0, 6).map((user) =>
                          user.photo ? (
                            <img key={user._id} src={`${apiBase}${user.photo}`} alt={user.name} title={user.name} />
                          ) : (
                            <span key={user._id} title={user.name}><UserCircle size={28} /></span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserRolesList;
