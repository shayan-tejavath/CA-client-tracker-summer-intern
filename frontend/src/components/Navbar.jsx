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

  const displayName = user?.name || user?.email || "Guest";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ NAVBAR SYSTEM ARCHITECTURE ━━━━━━━━━━━━━━━━━━━━ */
        .qca-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 76px;
          /* Blends perfectly with the #09090f dashboard root */
          background: rgba(9, 9, 15, 0.85); 
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .qca-search-box {
          position: relative;
          width: 100%;
          max-width: 380px;
          display: flex;
          align-items: center;
        }

        .qca-search-icon {
          position: absolute;
          left: 16px;
          color: rgba(255, 255, 255, 0.3);
          font-size: 16px;
          transition: color 0.3s ease, transform 0.3s ease;
          pointer-events: none;
        }

        .qca-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px 16px 12px 46px;
          font-size: 14px;
          color: #fff;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
        }

        .qca-search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .qca-search-input:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .qca-search-input:focus {
          border-color: #7C3AED;
          background: rgba(124, 58, 237, 0.03);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }

        .qca-search-input:focus + .qca-search-icon {
          color: #A855F7;
        }

        .qca-topbar-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .qca-icon-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 16px;
          position: relative;
          transition: all 0.2s ease;
        }

        .qca-icon-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .qca-notification-dot {
          position: absolute;
          top: 10px;
          right: 11px;
          width: 6px;
          height: 6px;
          background: #F97316;
          border-radius: 50%;
          box-shadow: 0 0 8px #F97316;
        }

        .qca-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4px 14px 4px 4px;
          border-radius: 100px;
        }

        .qca-profile-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #06B6D4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
        }

        .qca-profile-name {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .qca-btn-logout {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5;
          padding: 0 16px;
          height: 38px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .qca-btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #EF4444;
          color: #fff;
        }

        @media (max-width: 640px) {
          .qca-topbar { padding: 0 16px; }
          .qca-search-box { max-width: 180px; }
          .qca-profile-pill { padding-right: 4px; border: none; }
          .qca-profile-name { display: none; }
        }
      `}</style>

      <header className="qca-topbar">
        <div className="qca-search-box">
          <FiSearch className="qca-search-icon" />
          <input 
            type="search" 
            className="qca-search-input"
            placeholder="Search clients, tasks, or documents" 
          />
        </div>

        <div className="qca-topbar-actions">
          <button type="button" className="qca-icon-btn" aria-label="Notifications">
            <FiBell />
            <span className="qca-notification-dot" aria-hidden="true" />
          </button>

          <div className="qca-profile-pill">
            <div className="qca-profile-avatar">{userInitial}</div>
            <span className="qca-profile-name">{displayName}</span>
          </div>

          <button className="qca-btn-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;