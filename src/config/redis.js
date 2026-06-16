const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisClient = new Redis(redisUrl);

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

module.exports = redisClient;