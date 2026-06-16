// Unit tests for the OTP + auth service logic. Prisma and the email service are
// mocked so these run without a database or email provider.

const mockOtp = {
  findFirst: jest.fn(),
  updateMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const mockUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock("../src/config/database", () => ({
  otpToken: {
    findFirst: (...a) => mockOtp.findFirst(...a),
    updateMany: (...a) => mockOtp.updateMany(...a),
    create: (...a) => mockOtp.create(...a),
    update: (...a) => mockOtp.update(...a),
  },
  user: {
    findUnique: (...a) => mockUser.findUnique(...a),
    create: (...a) => mockUser.create(...a),
    update: (...a) => mockUser.update(...a),
  },
}));

jest.mock("../src/services/emailService", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue({ delivered: false }),
}));

const bcrypt = require("bcrypt");
const otpService = require("../src/services/otpService");
const authService = require("../src/services/authService");

beforeEach(() => jest.clearAllMocks());

describe("otpService.issueOtp", () => {
  it("invalidates old codes, stores a hashed code, and emails it", async () => {
    mockOtp.findFirst.mockResolvedValue(null); // no recent code
    mockOtp.updateMany.mockResolvedValue({ count: 0 });
    mockOtp.create.mockResolvedValue({ id: 1 });

    const result = await otpService.issueOtp("a@b.com", "EMAIL_VERIFICATION");

    expect(mockOtp.updateMany).toHaveBeenCalled(); // invalidates prior codes
    const created = mockOtp.create.mock.calls[0][0].data;
    expect(created.codeHash).not.toMatch(/^\d{6}$/); // stored hashed, not plaintext
    expect(created.type).toBe("EMAIL_VERIFICATION");
    // devCode surfaced in non-prod
    expect(result.devCode).toMatch(/^\d{6}$/);
  });

  it("enforces the resend cooldown", async () => {
    mockOtp.findFirst.mockResolvedValue({ createdAt: new Date() }); // just issued
    await expect(otpService.issueOtp("a@b.com", "EMAIL_VERIFICATION")).rejects.toMatchObject({
      statusCode: 429,
    });
  });
});

describe("otpService.verifyOtp", () => {
  it("rejects when no active code exists", async () => {
    mockOtp.findFirst.mockResolvedValue(null);
    await expect(otpService.verifyOtp("a@b.com", "EMAIL_VERIFICATION", "123456")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects an expired code", async () => {
    mockOtp.findFirst.mockResolvedValue({
      id: 1,
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() - 1000),
      attempts: 0,
    });
    await expect(otpService.verifyOtp("a@b.com", "EMAIL_VERIFICATION", "123456")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("increments attempts on a wrong code", async () => {
    mockOtp.findFirst.mockResolvedValue({
      id: 1,
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 60000),
      attempts: 0,
    });
    mockOtp.update.mockResolvedValue({});
    await expect(otpService.verifyOtp("a@b.com", "EMAIL_VERIFICATION", "000000")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockOtp.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } })
    );
  });

  it("blocks after too many attempts", async () => {
    mockOtp.findFirst.mockResolvedValue({
      id: 1,
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 60000),
      attempts: 5,
    });
    mockOtp.update.mockResolvedValue({});
    await expect(otpService.verifyOtp("a@b.com", "EMAIL_VERIFICATION", "123456")).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it("consumes the code on success", async () => {
    mockOtp.findFirst.mockResolvedValue({
      id: 1,
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 60000),
      attempts: 0,
    });
    mockOtp.update.mockResolvedValue({});
    await expect(otpService.verifyOtp("a@b.com", "EMAIL_VERIFICATION", "123456")).resolves.toBeUndefined();
    expect(mockOtp.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { consumedAt: expect.any(Date) } })
    );
  });
});

describe("authService.login", () => {
  it("blocks an unverified account with requiresVerification", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      password: await bcrypt.hash("password123", 10),
      emailVerified: false,
    });
    mockOtp.findFirst.mockResolvedValue(null);
    mockOtp.updateMany.mockResolvedValue({});
    mockOtp.create.mockResolvedValue({});

    await expect(
      authService.login({ email: "a@b.com", password: "password123" })
    ).rejects.toMatchObject({ statusCode: 403, requiresVerification: true });
  });

  it("rejects wrong password with 401", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      password: await bcrypt.hash("password123", 10),
      emailVerified: true,
    });
    await expect(
      authService.login({ email: "a@b.com", password: "wrong" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("returns a token for a verified user", async () => {
    mockUser.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      password: await bcrypt.hash("password123", 10),
      emailVerified: true,
    });
    const res = await authService.login({ email: "a@b.com", password: "password123" });
    expect(res.token).toEqual(expect.any(String));
    expect(res.user).toEqual({ id: 1, email: "a@b.com", emailVerified: true });
  });
});

describe("authService.forgotPassword", () => {
  it("does not reveal whether the email exists", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const res = await authService.forgotPassword({ email: "nobody@b.com" });
    expect(res.devCode).toBeUndefined(); // no code issued, but resolves normally
  });
});
