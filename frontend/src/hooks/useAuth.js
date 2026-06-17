import { useState, useEffect, useCallback } from "react";
import axiosClient from "@/api/axiosClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/auth/me");
      setUser(res.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loginWithGoogle = async (credential) => {
    const res = await axiosClient.post("/api/auth/google", { credential });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await axiosClient.post("/api/auth/logout");
    } finally {
      setUser(null);
      window.location.assign("/login");
    }
  };

  return {
    isAuthenticated: !!user,
    initializing,
    user,
    loginWithGoogle,
    logout,
  };
}
