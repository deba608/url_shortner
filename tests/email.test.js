const mockSendMail = jest.fn();
jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: (...a) => mockSendMail(...a),
  }),
}));

jest.mock("../src/config/database", () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
jest.mock("../src/config/logger", () => ({
  info: (...a) => mockLoggerInfo(...a),
  warn: (...a) => mockLoggerWarn(...a),
  error: (...a) => mockLoggerError(...a),
}));

const { sendPasswordResetEmail } = require("../src/utils/emailService");
const authController = require("../src/controllers/authController");

describe("sendPasswordResetEmail", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.EMAIL_USER = "noreply@test.com";
    process.env.EMAIL_APP_PASSWORD = "app-pass-123";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("sends an email with correct options", async () => {
    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });

    await sendPasswordResetEmail("user@example.com", "https://example.com/reset?token=abc");

    expect(mockSendMail).toHaveBeenCalledWith({
      from: { name: "Shortly Support", address: "noreply@test.com" },
      to: "user@example.com",
      subject: "Reset your Shortly password",
      text: expect.stringContaining("https://example.com/reset?token=abc"),
      html: expect.stringContaining("https://example.com/reset?token=abc"),
    });
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining("sent to user@example.com"),
      expect.objectContaining({ messageId: "test-msg-id" })
    );
  });

  it("logs a warning and skips sending when credentials are missing", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_APP_PASSWORD;

    await sendPasswordResetEmail("user@example.com", "https://example.com/reset?token=abc");

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.stringContaining("CREDENTIALS MISSING"),
      expect.objectContaining({ toEmail: "user@example.com" })
    );
  });

  it("logs an error when sendMail fails", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP connection refused"));

    await sendPasswordResetEmail("user@example.com", "https://example.com/reset?token=abc");

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send"),
      expect.objectContaining({
        to: "user@example.com",
        error: "SMTP connection refused",
      })
    );
  });
});

describe("forgotPassword controller", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.EMAIL_USER = "noreply@test.com";
    process.env.EMAIL_APP_PASSWORD = "app-pass-123";
    process.env.JWT_SECRET = "test-secret";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("sends password reset email when user exists", async () => {
    const prisma = require("../src/config/database");
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "Test User",
    });

    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });

    const req = { body: { email: "user@example.com" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authController.forgotPassword(req, res, next);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Reset your Shortly password",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("reset link has been sent"),
    });
  });

  it("returns 404 when user is not found", async () => {
    const prisma = require("../src/config/database");
    prisma.user.findUnique.mockResolvedValue(null);

    const req = { body: { email: "unknown@example.com" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authController.forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("No account found"),
    });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authController.forgotPassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("Email is required"),
    });
  });

  it("generates a reset URL with a valid JWT token", async () => {
    const prisma = require("../src/config/database");
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "user@example.com",
    });

    mockSendMail.mockResolvedValue({ messageId: "test-msg-id" });

    const req = { body: { email: "user@example.com" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authController.forgotPassword(req, res, next);

    const mailCall = mockSendMail.mock.calls[0][0];
    const resetUrl = mailCall.html.match(/href="([^"]+)"/)[1];

    expect(resetUrl).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=.+$/);

    const urlObj = new URL(resetUrl);
    const token = urlObj.searchParams.get("token");

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, "fallback-secret-for-dev");
    expect(decoded.email).toBe("user@example.com");
    expect(decoded.type).toBe("password_reset");
  });
});
