import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  ClipboardList,
  FolderOpen,
  BarChart3,
  Shield,
  UserCog,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { usePermission } from "../hooks/usePermission.js";
import { SIDEBAR_MENU } from "../constants/rbac.js";

import "../styles/sidebar.css";

const ICON_MAP = {
  dashboard: LayoutDashboard,
  clients: Users,
  services: BriefcaseBusiness,
  tasks: ClipboardList,
  documents: FolderOpen,
  reports: BarChart3,
  admin: Shield,
  users: Users,
  userRoles: UserCog,
};

const Sidebar = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const userRole = user?.role;

  const visibleMenuItems = SIDEBAR_MENU.filter((item) => {
    if (!item.requiredRoles.includes(userRole)) return false;

    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((current) => !current)}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-navigation"
      >
        {mobileOpen ? <X size={22} strokeWidth={2.2} /> : <Menu size={22} strokeWidth={2.2} />}
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-box">Q</div>

          <div>
            <h2>QwikCA</h2>
            <p>Practice Suite</p>
          </div>
        </div>

        <nav className="sidebar-nav" id="sidebar-navigation">
          {visibleMenuItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const visibleChildren = (item.children || []).filter((child) => {
              if (!child.requiredRoles.includes(userRole)) return false;
              if (child.requiredPermission && !hasPermission(child.requiredPermission)) return false;
              return true;
            });

            const isGroupActive =
              visibleChildren.length > 0 &&
              visibleChildren.some((child) => location.pathname.startsWith(child.path));

            const isExpanded = expandedMenus[item.path] || isGroupActive;

            return (
              <div key={item.path} className="sidebar-item-group">
                  {visibleChildren.length > 0 ? (
                    <div
                      className={
                        isGroupActive || isExpanded
                          ? "sidebar-link active"
                          : "sidebar-link"
                      }
                      onClick={() =>
                        setExpandedMenus((prev) => ({
                          ...prev,
                          [item.path]: !prev[item.path],
                        }))
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <Icon size={19} strokeWidth={2} />

                      <span>{item.name}</span>

                      <ChevronRight
                        className="sidebar-chevron"
                        size={16}
                        style={{
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "0.2s ease",
                        }}
                      />
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? "sidebar-link active" : "sidebar-link"
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={19} strokeWidth={2} />
                      <span>{item.name}</span>
                    </NavLink>
                  )}

                {visibleChildren.length > 0 && isExpanded && (
                  <div className="sidebar-submenu">
                    {visibleChildren.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          isActive ? "sidebar-sublink active" : "sidebar-sublink"
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-card">
            <div className="card-icon">
              <Sparkles size={18} />
            </div>

            <h4>Professional Edition</h4>

            <p>
              Secure workflow management for Chartered Accountants.
            </p>

            <button type="button">Upgrade</button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
