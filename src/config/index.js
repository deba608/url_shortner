const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || "development",

  // Auth is handled by Clerk (@clerk/express). clerkMiddleware() reads
  // CLERK_SECRET_KEY from the environment directly; no app config needed here.
};
