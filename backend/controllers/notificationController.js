import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

