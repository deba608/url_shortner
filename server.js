const config = require("./src/config");
const app = require("./src/app");
const redisClient = require("./src/config/redis");

async function startServer() {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully.");
    
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();