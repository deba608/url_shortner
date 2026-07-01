const Redis = require("ioredis");
const logger = require("./logger");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisClient = new Redis(redisUrl);

redisClient.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});

module.exports = redisClient;