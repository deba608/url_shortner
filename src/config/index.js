const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || "development",

  // Auth: sessions are JWTs signed with JWT_SECRET and stored in an
  // HttpOnly cookie. JWT_SECRET comes from the environment.
};
