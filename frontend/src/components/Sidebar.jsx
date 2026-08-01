import { useEffect, useMemo, useState } from "react";
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
  FileText,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

import { usePermission } from "../hooks/usePermission.js";
import { SIDEBAR_MENU } from "../constants/rbac.js";

import "../styles/sidebar.css";

const ICON_MAP = {
  dashboard: LayoutDashboard,
  clients: Users,
  services: BriefcaseBusiness,
  invoices: FileText,
  tasks: ClipboardList,
  documents: FolderOpen,
  reports: BarChart3,
  admin: Shield,
  users: Users,
  userRoles: UserCog,
  todo: ClipboardList,
};

const MENU_ACCESS = {
  "/dashboard": ["dashboard:view"],

  "/dashboard/todos": ["todo:read", "todo:create", "todo:update", "todo:delete", "todo:assign"],

  "/dashboard/clients": ["client:read", "client:create", "client:update", "client:delete"],
  "/dashboard/services": ["service:read", "service:create", "service:update", "service:delete"],
  "/dashboard/invoices": ["invoice:read", "invoice:create", "invoice:update", "invoice:delete"],
  "/dashboard/quotations": ["invoice:read", "invoice:create", "invoice:update", "invoice:delete"],
  "/dashboard/receipts": ["reports:view", "invoice:read"],
  "/dashboard/expenses": ["expense:read", "expense:create", "expense:update", "expense:delete"],
  "/dashboard/tasks": ["task:read", "task:create", "task:update", "task:delete"],

  "/dashboard/documents/in-out": ["document:read", "document:upload", "document:update", "document:delete"],
  "/dashboard/documents/dsc": ["document:read", "document:upload", "document:update", "document:delete"],
  "/dashboard/documents/collection": ["document:read", "document:upload", "document:update", "document:delete"],

  "/dashboard/reports": ["reports:view"],
  "/dashboard/reports/tasks": ["reports:view"],
  "/dashboard/reports/services": ["reports:view"],
  "/dashboard/reports/clients": ["reports:view"],
  "/dashboard/reports/employees": ["reports:view"],
  "/dashboard/reports/export": ["reports:view"],

  "/dashboard/attendance": ["admin:settings"],
  "/dashboard/users": ["user:list"],
  "/dashboard/user-roles": ["admin:settings"],
};

const Sidebar = () => {
  const { hasAnyPermission } = usePermission();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const canAccessPath = (path) => {
    const requiredPermissions = MENU_ACCESS[path];
    if (!requiredPermissions) return true;
    return hasAnyPermission(requiredPermissions);
  };

  const visibleMenuItems = useMemo(() => {
    return SIDEBAR_MENU.filter((item) => {
      const selfVisible = canAccessPath(item.path);
      const childVisible = (item.children || []).some((child) => canAccessPath(child.path));
      return selfVisible || childVisible;
    });
  }, [hasAnyPermission]);

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
            const visibleChildren = (item.children || []).filter((child) => canAccessPath(child.path));

            const isGroupActive =
              visibleChildren.length > 0 &&
              visibleChildren.some((child) => location.pathname.startsWith(child.path));

            const isExpanded = expandedMenus[item.path] || isGroupActive;

            return (
              <div key={item.path} className="sidebar-item-group">
                {visibleChildren.length > 0 ? (
                  <div
                    className={isGroupActive || isExpanded ? "sidebar-link active" : "sidebar-link"}
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
      </aside>
    </>
  );
};

export default Sidebar;