// Auth controller unit tests. Prisma, bcrypt, jwt and the email service are all
// mocked so this runs without a database, SMTP, or real crypto. Handlers are
// wrapped in catchAsync, so thrown ApiErrors surface via next(err).

const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockUserUpdate = jest.fn();
jest.mock("../src/config/database", () => ({
  user: {
    findUnique: (...a) => mockUserFindUnique(...a),
    create: (...a) => mockUserCreate(...a),
    update: (...a) => mockUserUpdate(...a),
  },
}));

const mockHash = jest.fn();
const mockCompare = jest.fn();
jest.mock("bcrypt", () => ({
  hash: (...a) => mockHash(...a),
  compare: (...a) => mockCompare(...a),
}));

const mockSign = jest.fn();
const mockVerify = jest.fn();
jest.mock("jsonwebtoken", () => ({
  sign: (...a) => mockSign(...a),
  verify: (...a) => mockVerify(...a),
}));

const mockSendResetEmail = jest.fn();
jest.mock("../src/utils/emailService", () => ({
  sendPasswordResetEmail: (...a) => mockSendResetEmail(...a),
}));

const authController = require("../src/controllers/authController");

// Minimal Express res double capturing status/json/cookie.
const makeRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((b) => { res.body = b; return res; });
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  return res;
};

// Run a handler and return { res, err } where err is whatever next received.
// catchAsync doesn't return its inner promise, so next(err) can fire a tick
// after the handler call returns — flush the queue before asserting.
const run = async (handler, req) => {
  const res = makeRes();
  let err = null;
  await handler(req, res, (e) => { err = e; });
  await new Promise((r) => setImmediate(r));
  return { res, err };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSign.mockReturnValue("signed.jwt.token");
  mockHash.mockResolvedValue("hashed-pw");
});

describe("register", () => {
  it("rejects missing fields with 400", async () => {
    const { err } = await run(authController.register, { body: { email: "a@b.com" } });
    expect(err).toMatchObject({ statusCode: 400 });
  });

  it("rejects invalid email format", async () => {
    const { err } = await run(authController.register, { body: { email: "nope", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 400, message: "Invalid email format" });
  });

  it("rejects passwords shorter than 8 chars", async () => {
    const { err } = await run(authController.register, { body: { email: "a@b.com", password: "short" } });
    expect(err).toMatchObject({ statusCode: 400 });
    expect(err.message).toMatch(/at least 8/);
  });

  it("rejects an already-registered email", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1" });
    const { err } = await run(authController.register, { body: { email: "a@b.com", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 400 });
  });

  it("creates the user, sets a cookie, and returns 201", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A", avatar: null });
    const { res, err } = await run(authController.register, { body: { email: "A@B.com", password: "password1", name: " A " } });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(201);
    // Email normalized to lowercase + trimmed.
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "a@b.com", name: "A" }) })
    );
    expect(res.cookie).toHaveBeenCalledWith("token", "signed.jwt.token", expect.any(Object));
    expect(res.body.user).not.toHaveProperty("password");
  });
});

describe("login", () => {
  it("rejects missing fields with 400", async () => {
    const { err } = await run(authController.login, { body: {} });
    expect(err).toMatchObject({ statusCode: 400 });
  });

  it("returns 401 for an unknown user", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const { err } = await run(authController.login, { body: { email: "a@b.com", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 401, message: "Invalid email or password" });
  });

  it("returns 401 for a wrong password", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", password: "hashed-pw" });
    mockCompare.mockResolvedValue(false);
    const { err } = await run(authController.login, { body: { email: "a@b.com", password: "wrongpass" } });
    expect(err).toMatchObject({ statusCode: 401 });
  });

  it("logs in with valid credentials", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", email: "a@b.com", name: "A", avatar: null, password: "hashed-pw" });
    mockCompare.mockResolvedValue(true);
    const { res, err } = await run(authController.login, { body: { email: "a@b.com", password: "password1" } });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(res.cookie).toHaveBeenCalled();
  });
});

describe("forgotPassword", () => {
  it("requires an email", async () => {
    const { err } = await run(authController.forgotPassword, { body: {} });
    expect(err).toMatchObject({ statusCode: 400 });
  });

  it("returns generic 200 for an unknown email without sending mail (no enumeration)", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const { res, err } = await run(authController.forgotPassword, { body: { email: "ghost@b.com" } });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(mockSendResetEmail).not.toHaveBeenCalled();
    expect(res.body.message).toMatch(/If an account exists/);
  });

  it("sends a reset email for a known user, same generic message", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", email: "a@b.com" });
    mockSendResetEmail.mockResolvedValue({ success: true });
    const { res, err } = await run(authController.forgotPassword, { body: { email: "a@b.com" } });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(mockSendResetEmail).toHaveBeenCalled();
    expect(res.body.message).toMatch(/If an account exists/);
  });
});

describe("resetPassword", () => {
  it("requires token and password", async () => {
    const { err } = await run(authController.resetPassword, { body: { token: "t" } });
    expect(err).toMatchObject({ statusCode: 400 });
  });

  it("rejects an invalid/expired token", async () => {
    mockVerify.mockImplementation(() => { throw new Error("bad"); });
    const { err } = await run(authController.resetPassword, { body: { token: "bad", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 400, message: "Invalid or expired reset token" });
  });

  it("rejects a token of the wrong type", async () => {
    mockVerify.mockReturnValue({ type: "session", email: "a@b.com" });
    const { err } = await run(authController.resetPassword, { body: { token: "x", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 400, message: "Invalid reset token" });
  });

  it("rejects a reused token issued before the last password change", async () => {
    // Token issued at t=1000s; password already changed at a later instant.
    mockVerify.mockReturnValue({ type: "password_reset", email: "a@b.com", iat: 1000 });
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordChangedAt: new Date(2000 * 1000),
    });
    const { err } = await run(authController.resetPassword, { body: { token: "x", password: "password1" } });
    expect(err).toMatchObject({ statusCode: 400, message: "Invalid or expired reset token" });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("updates the password for a valid token", async () => {
    mockVerify.mockReturnValue({ type: "password_reset", email: "a@b.com", iat: 3000 });
    mockUserFindUnique.mockResolvedValue({ id: "u1", email: "a@b.com" });
    mockUserUpdate.mockResolvedValue({});
    const { res, err } = await run(authController.resetPassword, { body: { token: "x", password: "password1" } });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: "hashed-pw", passwordChangedAt: expect.any(Date) }),
      })
    );
  });
});
