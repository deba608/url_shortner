require("dotenv").config();
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/database");

// Integration test for the OTP-gated auth flow. Uses the real database and the
// dev-mode `devCode` returned by the API when NODE_ENV !== "production".
describe("Auth Endpoints (OTP flow)", () => {
  const email = "test@example.com";
  const password = "password123";
  let verificationCode; // captured from register, reused (wrong attempts don't consume it)

  beforeAll(async () => {
    await prisma.otpToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a user as pending verification (no session yet)", async () => {
    const res = await request(app).post("/auth/register").send({ email, password });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty("requiresVerification", true);
    expect(res.body.data).toHaveProperty("devCode"); // surfaced in non-prod
    verificationCode = res.body.data.devCode;
  });

  it("blocks login until the email is verified", async () => {
    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("statusCode", 403);
  });

  it("rejects an incorrect OTP", async () => {
    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ email, code: "000000" });
    expect(res.statusCode).toEqual(400);
  });

  it("verifies the email with the correct OTP and sets a cookie", async () => {
    // Reuse the code from register — a wrong attempt above incremented the
    // counter but did not consume it (still valid, under the attempt cap).
    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ email, code: verificationCode });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user).toMatchObject({ email, emailVerified: true });
    expect(res.body.data).toHaveProperty("token");
    // HTTP-only session cookie is set
    const setCookie = res.headers["set-cookie"]?.join(";") || "";
    expect(setCookie).toMatch(/token=/);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("logs in a verified user", async () => {
    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty("token");
  });

  it("rejects login with a wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrongpassword" });
    expect(res.statusCode).toEqual(401);
  });

  it("does not register an already-verified email", async () => {
    const res = await request(app).post("/auth/register").send({ email, password });
    expect(res.statusCode).toEqual(409);
  });

  it("returns the current user from the session cookie via /auth/me", async () => {
    const login = await request(app).post("/auth/login").send({ email, password });
    const cookie = login.headers["set-cookie"];

    const res = await request(app).get("/auth/me").set("Cookie", cookie);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user).toMatchObject({ email, emailVerified: true });
  });

  it("supports the full password-reset flow", async () => {
    const forgot = await request(app).post("/auth/forgot-password").send({ email });
    expect(forgot.statusCode).toEqual(200);
    const code = forgot.body.data.devCode;

    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ email, code, newPassword: "newpassword456" });
    expect(reset.statusCode).toEqual(200);

    // Old password no longer works; new one does.
    const oldLogin = await request(app).post("/auth/login").send({ email, password });
    expect(oldLogin.statusCode).toEqual(401);
    const newLogin = await request(app)
      .post("/auth/login")
      .send({ email, password: "newpassword456" });
    expect(newLogin.statusCode).toEqual(200);
  });
});
