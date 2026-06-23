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
  const response = await api.post("/admin/users", userData, {
    headers: userData instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData, {
    headers: userData instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getUserRoles = async () => {
  const response = await api.get("/admin/user-roles");
  return response.data;
};

export const getUserRole = async (roleId) => {
  const response = await api.get(`/admin/user-roles/${roleId}`);
  return response.data;
};

export const createUserRole = async (roleData) => {
  const response = await api.post("/admin/user-roles", roleData);
  return response.data;
};

export const updateUserRole = async (roleId, roleData) => {
  const response = await api.put(`/admin/user-roles/${roleId}`, roleData);
  return response.data;
};

export const deleteUserRole = async (roleId) => {
  const response = await api.delete(`/admin/user-roles/${roleId}`);
  return response.data;
};
