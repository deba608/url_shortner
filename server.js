require("dotenv").config();
const validateEnv = require("./src/config/validateEnv");

// Validate environment before anything else touches it.
validateEnv();

const config = require("./src/config");
const app = require("./src/app");
const logger = require("./src/config/logger");
const redisClient = require("./src/config/redis");
const { verifyEmailTransport } = require("./src/utils/emailService");

async function startServer() {
  try {
    await redisClient.ping();
    logger.info("Redis connected successfully");

    // Verify email transport non-blocking so SMTP credential issues surface
    // in the deploy logs immediately.
    verifyEmailTransport().catch((err) =>
      logger.error("Unexpected error during email transport verification", { error: err.message })
    );

    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} (${config.nodeEnv})`);
    });

    // Graceful shutdown so in-flight requests finish and connections close
    // cleanly when the platform sends SIGTERM (Render, Docker, k8s).
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => {
        redisClient.quit();
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

startServer();


