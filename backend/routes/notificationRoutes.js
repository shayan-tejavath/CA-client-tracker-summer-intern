import express from "express";

import  protect  from "../middleware/authMiddleware.js";

import {
  getNotifications,
  getUnreadNotificationsCount,
  markAsRead,
  markAllRead,
  removeNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

/* ==========================================
   NOTIFICATION ROUTES
========================================== */

router.get(
  "/",
  protect,
  getNotifications
);

router.get(
  "/unread-count",
  protect,
  getUnreadNotificationsCount
);

router.put(
  "/:id/read",
  protect,
  markAsRead
);

router.put(
  "/read-all",
  protect,
  markAllRead
);

router.delete(
  "/:id",
  protect,
  removeNotification
);

router.delete(
  "/",
  protect,
  clearAllNotifications
);

export default router;