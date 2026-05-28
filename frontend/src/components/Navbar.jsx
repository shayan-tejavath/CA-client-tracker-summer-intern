import { useNavigate } from "react-router-dom";
import { FiBell, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input type="search" placeholder="Search clients, tasks, or documents" />
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button">
          <FiBell />
        </button>
        <span className="user-badge">{user?.name || user?.email || "Guest"}</span>
        <button className="button secondary" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
