import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService.js";

const POLL_INTERVAL_MS = 30000;

export const useNotifications = (initialLimit = 20) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(
    async (page = 1, limit = initialLimit) => {
      setLoading(true);
      setError("");

      try {
        const data = await getNotifications({ page, limit });
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setPagination(
          data?.pagination || {
            page,
            limit,
            total: 0,
            pages: 0,
          }
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    },
    [initialLimit]
  );

  const fetchUnreadCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const data = await getUnreadNotificationsCount();
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (err) {
      // do not block UI for count failures
      console.error("Unread count fetch failed:", err);
    } finally {
      setCountLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(pagination.page, pagination.limit), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount, pagination.page, pagination.limit]);

  const markRead = useCallback(
    async (id) => {
      if (!id) return;

      try {
        await markNotificationAsRead(id);
        setNotifications((current) =>
          current.map((item) =>
            String(item._id) === String(id) ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (err) {
        throw new Error(err.response?.data?.message || "Unable to mark notification as read.");
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      throw new Error(err.response?.data?.message || "Unable to mark all notifications as read.");
    }
  }, []);

  const removeOne = useCallback(async (id) => {
    try {
      await deleteNotification(id);
      const removed = notifications.find((item) => String(item._id) === String(id));
      setNotifications((current) => current.filter((item) => String(item._id) !== String(id)));
      if (removed && !removed.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || "Unable to delete notification.");
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      throw new Error(err.response?.data?.message || "Unable to clear notifications.");
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, initialLimit);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, initialLimit]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications(pagination.page, pagination.limit);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount, pagination.page, pagination.limit]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications]
  );

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    pagination,
    loading,
    countLoading,
    error,
    refresh,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    removeOne,
    clearAll,
    setPagination,
  };
};

export default useNotifications;