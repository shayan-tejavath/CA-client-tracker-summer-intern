import Notification from "../models/Notification.js";
import User from "../models/User.js";
import {
  sendEmail,
  sendSMS,
  sendWhatsApp,
} from "./messengerClient.js";

/* ==========================================================
   DEFAULT CHANNELS
========================================================== */

const DEFAULT_INTERNAL_CHANNELS = {
  inApp: true,
  email: false,
  sms: false,
  whatsapp: false,
};

const DEFAULT_CLIENT_CHANNELS = {
  email: true,
  sms: false,
  whatsapp: false,
};

/* ==========================================================
   INTERNAL NOTIFICATION DELIVERY
========================================================== */

const deliverInternalChannels = async ({
  recipientUser,
  title,
  message,
  channels = DEFAULT_INTERNAL_CHANNELS,
  metadata = {},
}) => {
  if (!recipientUser) return;

  if (channels.email && recipientUser.email) {
    await sendEmail({
      to: recipientUser.email,
      subject: title,
      body: message,
      metadata,
    });
  }

  if (channels.sms && recipientUser.mobile) {
    await sendSMS({
      to: recipientUser.mobile,
      body: message,
      metadata,
    });
  }

  if (channels.whatsapp && recipientUser.mobile) {
    await sendWhatsApp({
      to: recipientUser.mobile,
      body: message,
      metadata,
    });
  }
};

/* ==========================================================
   CLIENT NOTIFICATION DELIVERY
========================================================== */

const deliverClientChannels = async ({
  client,
  title,
  message,
  channels = DEFAULT_CLIENT_CHANNELS,
  metadata = {},
}) => {
  if (!client) return [];

  const results = [];

  if (channels.email && client.email) {
    results.push(
      await sendEmail({
        to: client.email,
        subject: title,
        body: message,
        metadata,
      })
    );
  }

  if (channels.sms && client.mobile) {
    results.push(
      await sendSMS({
        to: client.mobile,
        body: message,
        metadata,
      })
    );
  }

  if (channels.whatsapp && client.mobile) {
    results.push(
      await sendWhatsApp({
        to: client.mobile,
        body: message,
        metadata,
      })
    );
  }

  return results;
};

/* ==========================================================
   CREATE SINGLE INTERNAL NOTIFICATION
========================================================== */

export const createNotification = async ({
  title,
  message,
  recipient,
  recipientRole = "",
  sender = null,
  type = "System",
  priority = "Medium",
  entityType = "Notification",
  entityId = null,
  actionUrl = "",
  icon = "bell",
  channels = DEFAULT_INTERNAL_CHANNELS,
  metadata = {},
}) => {
  try {
    if (!recipient) return null;

    const notification = await Notification.create({
      title,
      message,
      recipient,
      recipientRole,
      sender,
      type,
      priority,
      entityType,
      entityId,
      actionUrl,
      icon,
      channels,
      metadata,
    });

    const recipientUser = await User.findById(recipient).select(
      "name email mobile"
    );

    await deliverInternalChannels({
      recipientUser,
      title,
      message,
      channels,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

/* ==========================================================
   SEND TO ALL USERS OF A ROLE
========================================================== */

export const notifyRole = async ({
  role,
  title,
  message,
  sender = null,
  type = "System",
  priority = "Medium",
  entityType = "Notification",
  entityId = null,
  actionUrl = "",
  icon = "bell",
  channels = DEFAULT_INTERNAL_CHANNELS,
  metadata = {},
}) => {
  try {
    const users = await User.find({
      role,
      isActive: true,
    }).select("_id role");

    const created = [];

    for (const user of users) {
      const notification = await createNotification({
        title,
        message,
        recipient: user._id,
        recipientRole: user.role,
        sender,
        type,
        priority,
        entityType,
        entityId,
        actionUrl,
        icon,
        channels,
        metadata,
      });

      if (notification) created.push(notification);
    }

    return created;
  } catch (error) {
    console.error("Role notification failed:", error.message);
    return [];
  }
};

/* ==========================================================
   SEND TO MULTIPLE USERS
========================================================== */

export const notifyUsers = async ({
  recipients = [],
  title,
  message,
  sender = null,
  type = "System",
  priority = "Medium",
  entityType = "Notification",
  entityId = null,
  actionUrl = "",
  icon = "bell",
  channels = DEFAULT_INTERNAL_CHANNELS,
  metadata = {},
}) => {
  const created = [];

  try {
    for (const recipient of recipients) {
      const notification = await createNotification({
        title,
        message,
        recipient,
        sender,
        type,
        priority,
        entityType,
        entityId,
        actionUrl,
        icon,
        channels,
        metadata,
      });

      if (notification) created.push(notification);
    }

    return created;
  } catch (error) {
    console.error("Multiple notification failed:", error.message);
    return [];
  }
};

/* ==========================================================
   EXTERNAL CLIENT NOTIFICATION (NO MONGODB NOTIFICATION DOC)
========================================================== */

export const notifyClient = async ({
  client,
  title,
  message,
  channels = DEFAULT_CLIENT_CHANNELS,
  metadata = {},
}) => {
  try {
    if (!client) return [];

    return await deliverClientChannels({
      client,
      title,
      message,
      channels,
      metadata,
    });
  } catch (error) {
    console.error("Client notification failed:", error.message);
    return [];
  }
};

/* ==========================================================
   CLIENT CREATED
========================================================== */

export const notifyClientCreated = async ({
  client,
  sender = null,
}) => {
  const title = "Welcome to QwikCA";
  const message = `Hello ${client.clientName}, your account has been created successfully.`;

  return notifyClient({
    client,
    title,
    message,
    channels: {
      email: true,
      sms: true,
      whatsapp: true,
    },
    metadata: {
      clientId: client._id,
      event: "client_created",
    },
  });
};

/* ==========================================================
   CLIENT UPDATED
========================================================== */

export const notifyClientUpdated = async ({
  client,
}) => {
  const title = "Client Profile Updated";
  const message = `Your client profile for ${client.clientName} has been updated successfully.`;

  return notifyClient({
    client,
    title,
    message,
    channels: {
      email: true,
      sms: false,
      whatsapp: true,
    },
    metadata: {
      clientId: client._id,
      event: "client_updated",
    },
  });
};

/* ==========================================================
   BULK IMPORT COMPLETED
========================================================== */

export const notifyBulkImportCompleted = async ({
  client,
}) => {
  const title = "Welcome to QwikCA";
  const message = `Hello ${client.clientName}, your account was created through bulk import successfully.`;

  return notifyClient({
    client,
    title,
    message,
    channels: {
      email: true,
      sms: true,
      whatsapp: true,
    },
    metadata: {
      clientId: client._id,
      event: "bulk_import_client_created",
    },
  });
};

/* ==========================================================
   SERVICE ASSIGNED
========================================================== */

export const notifyServiceAssigned = async ({
  client,
  service,
  sender = null,
}) => {
  const title = "New Service Assigned";
  const message = `${service.subService} has been assigned to your account.`;

  return notifyClient({
    client,
    title,
    message,
    channels: {
      email: true,
      sms: false,
      whatsapp: true,
    },
    metadata: {
      clientId: client._id,
      serviceId: service._id,
      event: "service_assigned",
    },
  });
};

/* ==========================================================
   TASK ASSIGNED (INTERNAL USER NOTIFICATION)
========================================================== */

export const notifyTaskAssigned = async ({
  userId,
  task,
  sender = null,
}) => {
  return createNotification({
    title: "Task Assigned",
    message: `A new task has been assigned to you: ${task.title || "Task"}.`,
    recipient: userId,
    recipientRole: "Employee",
    sender,
    type: "Task",
    priority: "High",
    entityType: "Task",
    entityId: task._id,
    actionUrl: `/tasks/${task._id}`,
    channels: {
      inApp: true,
      email: true,
      sms: false,
      whatsapp: false,
    },
    metadata: {
      taskId: task._id,
      event: "task_assigned",
    },
  });
};

/* ==========================================================
   GET USER NOTIFICATIONS
========================================================== */

export const getUserNotifications = async (
  userId,
  {
    page = 1,
    limit = 20,
  } = {}
) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({
    recipient: userId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({
    recipient: userId,
  });

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/* ==========================================================
   GET UNREAD COUNT
========================================================== */

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

/* ==========================================================
   MARK ONE AS READ
========================================================== */

export const markNotificationRead = async (
  notificationId,
  userId
) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },
    {
      isRead: true,
    },
    {
      new: true,
    }
  );
};

/* ==========================================================
   MARK ALL AS READ
========================================================== */

export const markAllNotificationsRead = async (userId) => {
  return Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    }
  );
};

/* ==========================================================
   DELETE NOTIFICATION
========================================================== */

export const deleteNotification = async (
  notificationId,
  userId
) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

/* ==========================================================
   CLEAR ALL NOTIFICATIONS
========================================================== */

export const clearNotifications = async (userId) => {
  return Notification.deleteMany({
    recipient: userId,
  });
};

export default {
  createNotification,
  notifyRole,
  notifyUsers,
  notifyClient,
  notifyClientCreated,
  notifyClientUpdated,
  notifyBulkImportCompleted,
  notifyServiceAssigned,
  notifyTaskAssigned,
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
};