import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  login as loginRequest,
  getProfile,
} from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // login button loading
  const [loading, setLoading] = useState(false);

  // app initialization loading
  const [initializing, setInitializing] = useState(true);

  // centralized logout
  const logout = () => {
    setUser(null);
    window.localStorage.removeItem("ca_user");
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = window.localStorage.getItem("ca_user");

        // no stored user
        if (!storedUser) {
          setInitializing(false);
          return;
        }

        let parsedUser;

        try {
          parsedUser = JSON.parse(storedUser);
        } catch (error) {
          console.error("[AUTH] Invalid stored user data");
          logout();
          setInitializing(false);
          return;
        }

        // validate token using profile endpoint
        const profile = await getProfile();

        const validatedUser = {
          ...parsedUser,
          ...profile,
        };

        setUser(validatedUser);

        window.localStorage.setItem(
          "ca_user",
          JSON.stringify(validatedUser)
        );
      } catch (error) {
        console.error("[AUTH] Session validation failed");
        logout();
      } finally {
        setInitializing(false);
      }
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
        permissions: Array.isArray(response.permissions)
          ? response.permissions
          : [],
      };

      setUser(userData);

      window.localStorage.setItem(
        "ca_user",
        JSON.stringify(userData)
      );

      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing,
      login,
      logout,
    }),
    [user, loading, initializing]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};