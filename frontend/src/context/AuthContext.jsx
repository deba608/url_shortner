import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import axiosClient, { TOKEN_KEY } from "@/api/axiosClient";

export const AuthContext = createContext(null);

// Single source of truth for the signed-in user. Provided once at the app root
// so every component (Navbar, ProtectedRoute, pages) shares the same state —
// otherwise each useAuth() call would hold its own copy and they'd disagree.
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

  const loginWithGoogle = useCallback(async (accessToken) => {
    const res = await axiosClient.post("/api/auth/google", { access_token: accessToken });
    // Persist the JWT for the Bearer header (cross-site cookie can't be relied on).
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
      loginWithGoogle,
      logout,
      refreshUser: fetchUser,
    }),
    [user, initializing, loginWithGoogle, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
