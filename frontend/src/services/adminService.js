import api from "./api";

export const getAdminOverview = async () => {
  const response = await api.get("/admin/overview");
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await api.post("/admin/users", userData);
  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};
