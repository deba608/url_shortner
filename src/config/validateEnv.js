const logger = require("./logger");

/**
 * Fail-fast environment validation.
 *
 * Called once at boot. Any missing *required* variable aborts startup so the
 * service never comes up half-configured (which is far harder to debug than a
 * clear crash on launch). Production-only checks guard against shipping insecure
 * defaults (e.g. a weak JWT secret).
 */
const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key] || process.env[key].trim() === "");

  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!process.env.REDIS_URL) {
      logger.error("REDIS_URL is required in production");
      process.exit(1);
    }
    if (process.env.JWT_SECRET.length < 32) {
      logger.error("JWT_SECRET must be at least 32 characters in production");
      process.exit(1);
    }
    if (!process.env.BASE_URL) {
      logger.warn("BASE_URL is not set; generated short URLs may point at the wrong host");
    }
  }

  logger.info(`Environment validated (NODE_ENV=${process.env.NODE_ENV || "development"})`);
};

module.exports = validateEnv;
