import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, getProfile } from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = window.localStorage.getItem("ca_user");
      if (!storedUser) return;

      let userData;
      try {
        userData = JSON.parse(storedUser);
      } catch (err) {
        console.error("[Auth] Failed to parse stored user", err);
        window.localStorage.removeItem("ca_user");
        return;
      }

      if (!userData.permissions || !Array.isArray(userData.permissions)) {
        try {
          const profile = await getProfile();
          userData = { ...userData, ...profile };
          window.localStorage.setItem("ca_user", JSON.stringify(userData));
        } catch (err) {
          console.warn("[Auth] Failed to refresh profile permissions", err);
        }
      }

      setUser(userData);
    };

    initializeUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await loginRequest(credentials);
      const userData = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        token: response.token,
        permissions: Array.isArray(response.permissions) ? response.permissions : [],
      };
      setUser(userData);
      window.localStorage.setItem("ca_user", JSON.stringify(userData));
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem("ca_user");
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
