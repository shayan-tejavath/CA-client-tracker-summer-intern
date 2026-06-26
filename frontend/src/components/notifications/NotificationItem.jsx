import { Trash2, CheckCheck, ExternalLink } from "lucide-react";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const NotificationItem = ({
  notification,
  onRead,
  onDelete,
  onOpen,
}) => {
  const isRead = Boolean(notification?.isRead);

  const handleOpen = async () => {
    if (!isRead && onRead) {
      await onRead(notification._id);
    }
    if (onOpen) {
      onOpen(notification);
    }
  };

  return (
    <div
      className={`flex gap-3 rounded-xl border p-3 transition ${
        isRead ? "bg-white border-slate-200" : "bg-slate-50 border-violet-200"
      }`}
    >
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleOpen}
              className="block text-left"
            >
              <h4 className="truncate text-sm font-semibold text-slate-900">
                {notification?.title || "Notification"}
              </h4>
            </button>

            <p className="mt-1 text-sm text-slate-600">
              {notification?.message || ""}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {formatTime(notification?.createdAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {notification?.actionUrl ? (
              <button
                type="button"
                onClick={handleOpen}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                title="Open"
              >
                <ExternalLink size={16} />
              </button>
            ) : null}

            {!isRead ? (
              <button
                type="button"
                onClick={() => onRead?.(notification._id)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                title="Mark as read"
              >
                <CheckCheck size={16} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onDelete?.(notification._id)}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;