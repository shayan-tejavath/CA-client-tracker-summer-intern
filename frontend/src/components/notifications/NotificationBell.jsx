import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown.jsx";
import useNotifications from "../../hooks/useNotifications.js";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    removeOne,
    clearAll,
    refresh,
  } = useNotifications(20);

  const latestNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const handleOpenNotification = async (notification) => {
    if (notification?.actionUrl) {
      navigate(notification.actionUrl);
      return;
    }

    if (notification?.entityType && notification?.entityId) {
      const entity = String(notification.entityType).toLowerCase();
      if (entity === "client") navigate(`/dashboard/clients/${notification.entityId}`);
      if (entity === "service") navigate(`/dashboard/services/${notification.entityId}`);
      if (entity === "task") navigate(`/dashboard/tasks/${notification.entityId}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          refresh();
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        open={open}
        notifications={latestNotifications}
        unreadCount={unreadCount}
        loading={loading}
        onClose={() => setOpen(false)}
        onRead={markRead}
        onReadAll={markAllRead}
        onDelete={removeOne}
        onClearAll={clearAll}
        onOpenNotification={handleOpenNotification}
      />
    </div>
  );
};

export default NotificationBell;