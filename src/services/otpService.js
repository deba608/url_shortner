const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const { sendOtpEmail } = require("./emailService");

const SALT_ROUNDS = 10;

// Cryptographically-random 6-digit code (000000–999999), zero-padded.
function generateCode() {
  const n = crypto.randomInt(0, 10 ** config.otp.length);
  return String(n).padStart(config.otp.length, "0");
}

/**
 * Issue a fresh OTP for an email+type: invalidates any prior unconsumed codes,
 * stores a hashed code, and emails it. Enforces a resend cooldown.
 *
 * @returns {Promise<{ devCode?: string }>} devCode is included only in non-prod.
 */
async function issueOtp(email, type) {
  // Resend cooldown: reject if a code was issued very recently.
  const recent = await prisma.otpToken.findFirst({
    where: { email, type, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - new Date(recent.createdAt).getTime() < config.otp.resendCooldownMs) {
    throw new ApiError(429, "Please wait a moment before requesting another code");
  }

  // Invalidate previous outstanding codes for this purpose (one active at a time).
  await prisma.otpToken.updateMany({
    where: { email, type, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  await prisma.otpToken.create({
    data: {
      email,
      codeHash,
      type,
      expiresAt: new Date(Date.now() + config.otp.ttlMs),
    },
  });

  await sendOtpEmail({ to: email, code, purpose: type });

  // Surface the code in non-prod so the flow is demoable without real email.
  return config.nodeEnv === "production" ? {} : { devCode: code };
}

/**
 * Verify a submitted code for an email+type. Consumes it on success. Throws an
 * ApiError on any failure (expired, wrong, too many attempts, none outstanding).
 */
async function verifyOtp(email, type, code) {
  const record = await prisma.otpToken.findFirst({
    where: { email, type, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "No active code. Please request a new one.");
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    throw new ApiError(400, "This code has expired. Please request a new one.");
  }

  if (record.attempts >= config.otp.maxAttempts) {
    // Burn it so it can't be hammered further.
    await prisma.otpToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    throw new ApiError(429, "Too many incorrect attempts. Please request a new code.");
  }

  const ok = await bcrypt.compare(String(code), record.codeHash);
  if (!ok) {
    await prisma.otpToken.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, "Incorrect code. Please try again.");
  }

  // Success — consume so it can't be reused.
  await prisma.otpToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
}

module.exports = { issueOtp, verifyOtp };
