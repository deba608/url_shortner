// Single source of truth for the localStorage key holding the JWT.
// Centralised so we never typo the key across the codebase.
export const TOKEN_KEY = "url_shortener_token";

// Application route paths in one place — avoids magic strings in <Link>/navigate.
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  URLS: "/urls",
  ANALYTICS: "/urls/:id/analytics",
};
