const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/database");

describe("Auth Endpoints", () => {
  // Clear the database or user table before tests so we start fresh
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Optional: clear again or just disconnect
    await prisma.$disconnect();
  });

  let testUserToken;

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "User registered successfully");
    expect(res.body).toHaveProperty("userId");
  });

  it("should not register a user with an existing email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("error", "Email already registered");
  });

  it("should login with the registered user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    testUserToken = res.body.token; // Save token for future test if needed
  });

  it("should not login with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });
});
