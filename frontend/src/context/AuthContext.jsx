import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchCurrentUser = async () => {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get("/me");
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      localStorage.removeItem("access_token");
      setToken("");
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!isMounted) return;
      setAuthLoading(true);

      if (!token) {
        if (isMounted) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/me");
        if (isMounted) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        localStorage.removeItem("access_token");
        if (isMounted) {
          setToken("");
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (newToken) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);

    try {
      const response = await api.get("/me", {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });

      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Login user fetch failed:", error);
      localStorage.removeItem("access_token");
      setToken("");
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      login,
      logout,
      fetchCurrentUser,
      isAuthenticated: !!token && !!user,
      authLoading,
    }),
    [token, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}