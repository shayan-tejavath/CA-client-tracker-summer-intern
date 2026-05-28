import api from "./api.js";

export const getPermissions = async () => {
  const response = await api.get("/admin/permissions");
  return response.data;
};

export const savePermissions = async (permissionsByRole) => {
  const response = await api.put("/admin/permissions", { permissionsByRole });
  return response.data;
};
