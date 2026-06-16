const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const { issueOtp, verifyOtp } = require("./otpService");

const SALT_ROUNDS = 10;
const JWT_SECRET = config.jwtSecret || "default_secret";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: config.jwtExpiresIn,
  });
}

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  emailVerified: user.emailVerified,
});

/**
 * Register a user (unverified) and issue an email-verification OTP.
 * If the email exists but is unverified, we re-issue a code rather than erroring
 * — a common, friendly pattern (no account enumeration on the verified path).
 */
async function register({ email, password }) {
  email = normalizeEmail(email);
  if (!email || !password) throw new ApiError(400, "Email and password are required");
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.emailVerified) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing && !existing.emailVerified) {
    // Update the pending registration's password and re-send a code.
    await prisma.user.update({ where: { id: existing.id }, data: { password: hashedPassword } });
  } else {
    await prisma.user.create({ data: { email, password: hashedPassword } });
  }

  const { devCode } = await issueOtp(email, "EMAIL_VERIFICATION");
  return { email, devCode };
}

/** Verify the signup OTP → activate the account and return a session token. */
async function verifyEmail({ email, code }) {
  email = normalizeEmail(email);
  await verifyOtp(email, "EMAIL_VERIFICATION", code);

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  return { user: publicUser(user), token: signToken(user) };
}

/** Re-issue a verification code for a pending (unverified) account. */
async function resendVerification({ email }) {
  email = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No account found for this email");
  if (user.emailVerified) throw new ApiError(400, "Email is already verified");

  const { devCode } = await issueOtp(email, "EMAIL_VERIFICATION");
  return { email, devCode };
}

/**
 * Authenticate. Returns a 403 with requiresVerification when the account exists
 * but hasn't verified its email, so the client can route to the OTP screen.
 */
async function login({ email, password }) {
  email = normalizeEmail(email);
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, "Invalid credentials");

  if (!user.emailVerified) {
    // Re-issue a code so the user can complete verification immediately.
    await issueOtp(email, "EMAIL_VERIFICATION").catch(() => {});
    const err = new ApiError(403, "Please verify your email to continue");
    err.requiresVerification = true;
    err.email = email;
    throw err;
  }

  return { user: publicUser(user), token: signToken(user) };
}

/**
 * Begin password reset. Always resolves the same way regardless of whether the
 * email exists, to avoid account enumeration.
 */
async function forgotPassword({ email }) {
  email = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email } });

  let devCode;
  if (user) {
    ({ devCode } = await issueOtp(email, "PASSWORD_RESET"));
  }
  // Generic response; devCode (non-prod only) included if a code was actually sent.
  return { devCode };
}

/** Complete password reset with a valid OTP. Returns a fresh session token. */
async function resetPassword({ email, code, newPassword }) {
  email = normalizeEmail(email);
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  await verifyOtp(email, "PASSWORD_RESET", code);

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, emailVerified: true },
  });

  return { user: publicUser(user), token: signToken(user) };
}

/** Current user from a verified JWT payload (id on req.user). */
async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  return publicUser(user);
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  signToken,
};
