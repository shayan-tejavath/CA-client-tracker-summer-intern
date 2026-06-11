import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user?._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

