import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { getToken, setToken, clearToken } from "@/utils/token";
import * as authApi from "@/api/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Guards the first render until the session is resolved, so route guards don't
  // bounce an authenticated user to /login on a hard refresh.
  const [initializing, setInitializing] = useState(true);

  // Hydrate the session on mount. /auth/me works with either the HTTP-only
  // cookie or the stored Bearer token — the server is the source of truth, so a
  // user object only exists if the backend confirms a valid session.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authApi.meRequest();
        if (active) setUser(me);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist a successful session (token in storage for Bearer fallback; the
  // cookie is set by the backend).
  const applySession = useCallback((session) => {
    if (session?.token) setToken(session.token);
    setUser(session.user);
    return session;
  }, []);

  // Returns { user, token } on success; throws on bad credentials, and throws a
  // 403 when the email is unverified (caller routes to the OTP screen).
  const login = useCallback(
    (credentials) => authApi.loginRequest(credentials).then(applySession),
    [applySession]
  );

  // Returns { email, requiresVerification, devCode? } — does NOT start a session.
  const register = useCallback((credentials) => authApi.registerRequest(credentials), []);

  const verifyOtp = useCallback(
    (payload) => authApi.verifyOtpRequest(payload).then(applySession),
    [applySession]
  );

  const resendOtp = useCallback((email) => authApi.resendOtpRequest(email), []);

  const forgotPassword = useCallback((email) => authApi.forgotPasswordRequest(email), []);

  const resetPassword = useCallback(
    (payload) => authApi.resetPasswordRequest(payload).then(applySession),
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logoutRequest();
    } catch {
      /* clear local state regardless of network result */
    }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      initializing,
      login,
      register,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
    }),
    [user, initializing, login, register, verifyOtp, resendOtp, forgotPassword, resetPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
