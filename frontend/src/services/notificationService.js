import api from "./api";

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get("/notifications", {
    params: { page, limit },
  });
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await api.delete("/notifications");
  return response.data;
};

const unwrapApiResponse = (payload) => {
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
};

export const sendMessage = async (payload) => {
  const response = await api.post("/messages", payload);
  return response.data;
};

export const getMessages = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get("/messages", {
    params: { page, limit },
  });

  const messagePayload = unwrapApiResponse(response.data);
  if (Array.isArray(messagePayload)) {
    return messagePayload;
  }

  return messagePayload?.data ?? messagePayload ?? [];
};

export const getMessageById = async (id) => {
  const response = await api.get(`/messages/${id}`);
  const messagePayload = unwrapApiResponse(response.data);
  return messagePayload?.data ?? messagePayload ?? null;
};

export const cancelMessage = async (id) => {
  const response = await api.delete(`/messages/${id}`);
  return response.data;
};

export default {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  sendMessage,
  getMessages,
  getMessageById,
  cancelMessage,
};