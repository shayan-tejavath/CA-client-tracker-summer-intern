import api from "./api.js";

export const login = async ({ email, password }) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};
