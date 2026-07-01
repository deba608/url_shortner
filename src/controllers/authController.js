const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { sendPasswordResetEmail } = require("../utils/emailService");

const JWT_SECRET = require("../config").jwtSecret;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Shared cookie options so login/register/logout stay in sync.
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

// Issue a session JWT and set it as an HttpOnly cookie.
const issueSession = (res, userId) => {
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.cookie("token", token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });
  return token;
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
});

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(400, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: name ? name.trim() : null,
    },
  });

  const token = issueSession(res, user.id);

  res.status(201).json({
    message: "Registration successful",
    token,
    user: publicUser(user),
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  // Same error + code for unknown-user and bad-password so responses don't
  // reveal which emails are registered.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = issueSession(res, user.id);

  res.status(200).json({
    message: "Authentication successful",
    token,
    user: publicUser(user),
  });
});

const logout = (req, res) => {
  res.clearCookie("token", cookieOptions());
  res.status(200).json({ message: "Logged out successfully" });
};

const me = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, avatar: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ user });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Generic response regardless of whether the account exists — never reveal
  // which emails are registered (prevents user enumeration).
  const genericMessage = "If an account exists for that email, a password reset link has been sent.";

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (user) {
    const resetToken = jwt.sign(
      { email: user.email, type: "password_reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    const result = await sendPasswordResetEmail(user.email, resetUrl);
    if (!result.success) {
      // Log server-side but still return the generic message to the client.
      throw new ApiError(500, "Unable to send reset email right now. Please try again later.");
    }
  }

  res.status(200).json({ message: genericMessage });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  if (decoded.type !== "password_reset" || !decoded.email) {
    throw new ApiError(400, "Invalid reset token");
  }

  const user = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  // Single-use: a reset token issued before the last password change (e.g. a
  // token already consumed once, or issued before an earlier reset) is dead.
  // decoded.iat is in seconds; compare against passwordChangedAt.
  if (
    user.passwordChangedAt &&
    decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()
  ) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email: decoded.email },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });

  res.status(200).json({ message: "Password has been reset successfully. You can now log in." });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
