import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} from "../services/notificationService.js";

/* =====================================================
   GET ALL NOTIFICATIONS
===================================================== */

export const getNotifications = async (
  req,
  res,
  next
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result =
      await getUserNotifications(
        req.user._id,
        { page, limit }
      );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET UNREAD COUNT
===================================================== */

export const getUnreadNotificationsCount =
  async (req, res, next) => {
    try {
      const count =
        await getUnreadCount(req.user._id);

      res.json({
        unreadCount: count,
      });
    } catch (err) {
      next(err);
    }
  };

/* =====================================================
   MARK SINGLE READ
===================================================== */

export const markAsRead = async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await markNotificationRead(
        req.params.id,
        req.user._id
      );

    if (!notification) {
      return res.status(404).json({
        message:
          "Notification not found",
      });
    }

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   MARK ALL READ
===================================================== */

export const markAllRead =
  async (req, res, next) => {
    try {
      await markAllNotificationsRead(
        req.user._id
      );

      res.json({
        message:
          "All notifications marked as read",
      });
    } catch (err) {
      next(err);
    }
  };

/* =====================================================
   DELETE ONE
===================================================== */

export const removeNotification =
  async (req, res, next) => {
    try {
      await deleteNotification(
        req.params.id,
        req.user._id
      );

      res.json({
        message:
          "Notification deleted",
      });
    } catch (err) {
      next(err);
    }
  };

/* =====================================================
   CLEAR ALL
===================================================== */

export const clearAllNotifications =
  async (req, res, next) => {
    try {
      await clearNotifications(
        req.user._id
      );

      res.json({
        message:
          "Notifications cleared",
      });
    } catch (err) {
      next(err);
    }
  };