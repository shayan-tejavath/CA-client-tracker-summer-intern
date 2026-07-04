import { X, CheckCheck, Trash2 } from "lucide-react";
import NotificationItem from "./NotificationItem.jsx";

const NotificationDropdown = ({
  open,
  notifications = [],
  unreadCount = 0,
  loading = false,
  onClose,
  onRead,
  onReadAll,
  onDelete,
  onClearAll,
  onOpenNotification,
}) => {
  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 z-50 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <p className="text-xs text-slate-500">
            {unreadCount} unread
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto p-3">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onRead={onRead}
                onDelete={onDelete}
                onOpen={(item) => {
                  if (onOpenNotification) onOpenNotification(item);
                  onClose?.();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onReadAll}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-200"
          disabled={!notifications.length}
        >
          <CheckCheck size={14} />
          Mark all read
        </button>

        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
          disabled={!notifications.length}
        >
          <Trash2 size={14} />
          Clear all
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;