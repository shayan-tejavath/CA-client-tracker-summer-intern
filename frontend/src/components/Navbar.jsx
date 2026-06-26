import { useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./notifications/NotificationBell.jsx";

import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName =
    user?.name ||
    user?.email ||
    "Guest";

  const role =
    user?.role ||
    "User";

  const userInitial =
    displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">

      {/* Left */}

      <div className="navbar-left">

        <div className="search-box">

          <Search
            size={18}
            className="search-icon"
          />

          <input
            type="text"
            placeholder="Search clients, tasks, documents..."
          />

        </div>

      </div>

      {/* Right */}

      <div className="navbar-right">

        {/* Notification Bell */}

        <NotificationBell />

        {/* User */}

        <div className="profile-box">

          <div className="profile-avatar">
            {userInitial}
          </div>

          <div>

            <h4>{displayName}</h4>

            <p>{role}</p>

          </div>

        </div>

        {/* Logout */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <LogOut size={17} />

          Logout

        </button>

      </div>

    </header>
  );
};

export default Navbar;