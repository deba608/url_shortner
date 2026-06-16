const dotenv = require("dotenv");
dotenv.config();

const isProd = (process.env.NODE_ENV || "development") === "production";

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Auth cookie. For a same-site deployment (API proxied through the frontend
  // domain) keep sameSite=lax. For a cross-site deployment set COOKIE_SAMESITE=none
  // and COOKIE_SECURE=true (required by browsers for SameSite=None).
  cookie: {
    name: process.env.COOKIE_NAME || "token",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProd,
    // 7 days in ms (kept in sync with jwtExpiresIn default)
    maxAgeMs: Number(process.env.COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000,
  },

  // OTP: 6 digits, 5-minute expiry, capped verification attempts.
  otp: {
    length: 6,
    ttlMs: 5 * 60 * 1000,
    maxAttempts: 5,
    // Minimum seconds between resends for the same email+purpose.
    resendCooldownMs: 30 * 1000,
  },

  // Email delivery. If RESEND_API_KEY is set we send real email; otherwise we run
  // in dev/console mode (OTP logged to server output and surfaced in the API
  // response when not in production), so the flow is fully demoable with no infra.
  email: {
    resendApiKey: process.env.RESEND_API_KEY || null,
    from: process.env.EMAIL_FROM || "Shortly <onboarding@resend.dev>",
  },
};
