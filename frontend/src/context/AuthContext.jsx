import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import axiosClient, { TOKEN_KEY } from "@/api/axiosClient";

export const AuthContext = createContext(null);

// Single source of truth for the signed-in user. Provided once at the app root
// so every component (Navbar, ProtectedRoute, pages) shares the same state.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const res = await axiosClient.post("/api/auth/login", { email, password });
    if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await axiosClient.post("/api/auth/register", { name, email, password });
    if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      window.location.assign("/login");
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      initializing,
      user,
      login,
      register,
      logout,
      refreshUser: fetchUser,
    }),
    [user, initializing, login, register, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
