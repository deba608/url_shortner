export const BRAND_NAME = "Shortly";

export const TOKEN_KEY = "url_shortener_token";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  URLS: "/urls",
  ANALYTICS: "/urls/:id/analytics",
  TERMS: "/terms",
  PRIVACY: "/privacy",
};

export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_SEC = 30;

export const RECENT_URLS_LIMIT = 5;
export const TRUNCATE_LENGTH = 48;
export const ANALYTICS_DAYS = 7;
export const TRUNCATE_DASHBOARD_LENGTH = 60;
