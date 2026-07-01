const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || "development",

  // Auth: sessions are JWTs signed with JWT_SECRET and stored in an
  // HttpOnly cookie. JWT_SECRET comes from the environment. The dev fallback is
  // ONLY used outside production — validateEnv hard-requires the real secret in
  // production, so the fallback can never sign prod tokens.
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "fallback-secret-for-dev"),
};
