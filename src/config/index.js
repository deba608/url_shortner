const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || "development",

  // Auth: Google OAuth (google-auth-library) verifies the token in the
  // authController; sessions are JWTs signed with JWT_SECRET and stored in an
  // HttpOnly cookie. GOOGLE_CLIENT_ID and JWT_SECRET come from the environment.
};
