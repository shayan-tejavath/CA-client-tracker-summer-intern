import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermission } from "../hooks/usePermission.js";
import { SIDEBAR_MENU, ROLES } from "../constants/rbac.js";
import { FaTachometerAlt, FaUsers, FaTasks, FaFileAlt, FaChartBar, FaShieldAlt, FaConciergeBell } from "react-icons/fa";

// Icon mapping for menu items
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

  // Filter menu items based on user role and permissions
  const visibleMenuItems = SIDEBAR_MENU.filter((item) => {
    // Check role access
    if (!item.requiredRoles.includes(userRole)) {
      return false;
    }
    // Check permission access
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }
    return true;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">Q</span>
        <div>
          <p className="brand-title">QwikCA</p>
          <p className="brand-subtitle">Practice Suite</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {visibleMenuItems.map((item) => {
          const IconComponent = ICON_MAP[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              title={item.name}
            >
              {IconComponent && <IconComponent />}
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <p className="footer-title">Pro SaaS Admin</p>
        <span className="footer-subtitle">Live analytics, team workflow, and client operations.</span>
        <button type="button" className="button secondary upgrade-button">Upgrade Now</button>
      </div>
    </aside>
  );
};

export default Sidebar;
