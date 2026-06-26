import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Notification Title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification Message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification Category
    type: {
      type: String,
      enum: [
        "Client",
        "Service",
        "Task",
        "Document",
        "Employee",
        "Reminder",
        "System",
        "Message",
        "Bulk Import",
      ],
      default: "System",
    },

    // Priority
    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
      ],
      default: "Medium",
    },

    // Receiver User
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Receiver Role
    recipientRole: {
      type: String,
      default: "",
    },

    // Who triggered this notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Related Module
    entityType: {
      type: String,
      enum: [
        "Client",
        "Service",
        "Task",
        "Document",
        "Employee",
        "Dashboard",
        "Notification",
      ],
      default: "Notification",
    },

    // Related Document ID
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // URL to open on click
    actionUrl: {
      type: String,
      default: "",
    },

    // Icon Name
    icon: {
      type: String,
      default: "bell",
    },

    // Notification Read Status
    isRead: {
      type: Boolean,
      default: false,
    },

    // Delivery Channels
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },

      email: {
        type: Boolean,
        default: false,
      },

      sms: {
        type: Boolean,
        default: false,
      },

      whatsapp: {
        type: Boolean,
        default: false,
      },
    },

    // Delivery Status
    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Delivered",
        "Failed",
      ],
      default: "Pending",
    },

    // Extra metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Faster unread notification lookup
notificationSchema.index({
  recipient: 1,
  isRead: 1,
});

// Latest notifications first
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;