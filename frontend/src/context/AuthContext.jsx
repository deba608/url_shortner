import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, clearToken } from "@/utils/token";
import { loginRequest, registerRequest } from "@/api/auth";

export const AuthContext = createContext(null);

// Decode a JWT into a user object, returning null if absent/expired/malformed.
// The backend signs { id, email, iat, exp } with a 1-day expiry.
const userFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // expired
    }
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  // Initialise synchronously from localStorage so a returning user isn't flashed
  // the logged-out UI on first paint.
  const [user, setUser] = useState(() => userFromToken(getToken()));
  // Guards the first render: until we've validated the stored token, route guards
  // shouldn't redirect (avoids bouncing an authenticated user to /login on reload).
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    const u = userFromToken(token);
    if (token && !u) clearToken(); // stored token was expired/invalid
    setUser(u);
    setInitializing(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const { token } = await loginRequest(credentials);
    setToken(token);
    setUser(userFromToken(token));
  }, []);

  const register = useCallback(async (credentials) => {
    // Backend register does NOT return a token, so we log in right after to
    // obtain one — a smoother UX than forcing a separate login step.
    await registerRequest(credentials);
    await login(credentials);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, initializing, login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
