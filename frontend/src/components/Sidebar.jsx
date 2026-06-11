import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermission } from "../hooks/usePermission.js";
import { SIDEBAR_MENU, ROLES } from "../constants/rbac.js";
import { FaTachometerAlt, FaUsers, FaTasks, FaFileAlt, FaChartBar, FaShieldAlt, FaConciergeBell } from "react-icons/fa";

const ICON_MAP = {
  dashboard: FaTachometerAlt,
  clients: FaUsers,
  services: FaConciergeBell,
  tasks: FaTasks,
  documents: FaFileAlt,
  reports: FaChartBar,
  admin: FaShieldAlt,
};

const Sidebar = () => {
  const { user } = useAuth();
  const { hasPermission, hasRole } = usePermission();
  const userRole = user?.role;

  const visibleMenuItems = SIDEBAR_MENU.filter((item) => {
    if (!item.requiredRoles.includes(userRole)) return false;
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
    return true;
  });

  return (
    <>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ SIDEBAR ARCHITECTURE ━━━━━━━━━━━━━━━━━━━━ */
        .qca-sidebar {
          width: 260px;
          height: 100vh;
          /* Matches root canvas exactly so it doesn't look like a box */
          background: #09090f; 
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          z-index: 90;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .qca-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px;
          height: 76px; /* perfectly aligns with Navbar height */
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .qca-brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #7C3AED, #A855F7, #F97316);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 0 16px rgba(124, 58, 237, 0.3);
          flex-shrink: 0;
        }

        .qca-brand-title {
          font-size: 17px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .qca-brand-subtitle {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 4px;
          display: block;
        }

        .qca-sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .qca-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .qca-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .qca-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }

        .qca-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .qca-nav-icon {
          font-size: 16px;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .qca-nav-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
          transform: translateX(2px);
        }

        .qca-nav-link.active {
          color: #fff;
          background: rgba(124, 58, 237, 0.08);
          border-color: rgba(124, 58, 237, 0.15);
        }

        .qca-nav-link.active .qca-nav-icon {
          color: #A855F7;
        }

        .qca-sidebar-footer {
          margin: 16px 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          text-align: center;
        }

        .qca-footer-title {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .qca-footer-subtitle {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .qca-upgrade-btn {
          width: 100%;
          background: linear-gradient(135deg, #7C3AED, #9333EA);
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .qca-upgrade-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
        }
      `}</style>

      <aside className="qca-sidebar">
        <div className="qca-sidebar-brand">
          <div className="qca-brand-icon">Q</div>
          <div>
            <div className="qca-brand-title">QwikCA</div>
            <span className="qca-brand-subtitle">Practice Suite</span>
          </div>
        </div>

        <nav className="qca-sidebar-nav">
          {visibleMenuItems.map((item) => {
            const IconComponent = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? "qca-nav-link active" : "qca-nav-link")}
                title={item.name}
              >
                {IconComponent && <IconComponent className="qca-nav-icon" />}
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="qca-sidebar-footer">
          <p className="qca-footer-title">Pro SaaS Admin</p>
          <span className="qca-footer-subtitle">Live analytics & workflow.</span>
          <button type="button" className="qca-upgrade-btn">
            Upgrade Now
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;