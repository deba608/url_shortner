const redisClient = require("../src/config/redis");

describe("Redis Integration Test", () => {
  afterAll(async () => {
    // Close the connection gracefully after tests
    await redisClient.quit();
  });

  it("should respond to a PING command with PONG", async () => {
    const response = await redisClient.ping();
    expect(response).toBe("PONG");
  });

  it("should be able to set and get a key-value pair", async () => {
    const testKey = "jest:test:key";
    const testValue = "hello_redis";

    // Set value in Redis
    await redisClient.set(testKey, testValue);

    // Get value from Redis
    const retrievedValue = await redisClient.get(testKey);
    expect(retrievedValue).toBe(testValue);

    // Cleanup
    await redisClient.del(testKey);
  });
});
