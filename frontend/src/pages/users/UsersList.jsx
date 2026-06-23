import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAdminUsers } from "../../services/adminService.js";
import "../../styles/users.css";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api$/, "");

const getPhotoUrl = (photo) => {
  if (!photo) return "";
  if (photo.startsWith("http")) return photo;
  return `${apiBase}${photo}`;
};

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setUsers(await getAdminUsers());
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.role, user.username, user.mobile, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, users]);

  return (
    <DashboardLayout>
      <div className="users-page">
        <div className="users-header">
          <div>
            <p className="users-eyebrow">SuperAdmin</p>
            <h1>Users</h1>
          </div>

          <button className="users-primary" type="button" onClick={() => navigate("/dashboard/users/new")}>
            + New
          </button>
        </div>

        <section className="users-card">
          <label className="users-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" />
          </label>

          {error && <div className="users-alert">{error}</div>}
          {loading ? (
            <div className="users-empty">Loading users...</div>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Username</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id || user.id}>
                      <td>
                        {user.photo ? (
                          <img className="users-avatar" src={getPhotoUrl(user.photo)} alt={user.name} />
                        ) : (
                          <span className="users-avatar users-avatar-empty">
                            <UserCircle size={32} />
                          </span>
                        )}
                      </td>
                      <td><span className="users-link">{user.name}</span></td>
                      <td>{user.role}</td>
                      <td>{user.username || "-"}</td>
                      <td>{user.mobile || "-"}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={user.isActive === false ? "status-pill inactive" : "status-pill active"}>
                          {user.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && <div className="users-empty">No users found.</div>}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UsersList;
