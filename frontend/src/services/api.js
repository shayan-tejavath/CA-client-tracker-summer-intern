import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const storedUser = window.localStorage.getItem("ca_user");
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      const token = userData.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("[API] Token attached", {
          role: userData.role,
          hasToken: !!token,
          tokenLength: token.length,
        });
      } else {
        console.warn("[API] No token in stored user");
      }
    } catch (err) {
      console.error("[API] Failed to parse stored user:", err);
    }
  } else {
    console.warn("[API] No stored user found");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("[API] 401 Unauthorized - clearing storage and redirecting");
      window.localStorage.removeItem("ca_user");
      window.location.assign("/login");
    }
    if (error.response?.status === 403) {
      console.error("[API] 403 Forbidden:", error.response.data);
      if (
        typeof error.response.data?.message === "string" &&
        error.response.data.message
          .toLowerCase()
          .includes("archived")
      ) {
        window.localStorage.removeItem("ca_user");
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
