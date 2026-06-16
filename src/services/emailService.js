const config = require("../config");
const logger = require("../config/logger");

// Lazily-created Resend client (only if configured + the package is installed).
let resendClient = null;
function getResend() {
  if (!config.email.resendApiKey) return null;
  if (resendClient) return resendClient;
  try {
    // eslint-disable-next-line global-require
    const { Resend } = require("resend");
    resendClient = new Resend(config.email.resendApiKey);
    return resendClient;
  } catch {
    logger.warn("RESEND_API_KEY is set but the 'resend' package is not installed. Run: npm i resend");
    return null;
  }
}

/**
 * Send an email. In production with Resend configured, sends for real. Otherwise
 * logs to the server console (dev/demo mode) so flows work without email infra.
 *
 * @returns {Promise<{ delivered: boolean }>}
 */
async function sendEmail({ to, subject, text, html }) {
  const resend = getResend();

  if (resend) {
    await resend.emails.send({ from: config.email.from, to, subject, text, html });
    logger.info("Email sent", { to, subject });
    return { delivered: true };
  }

  // Dev/console fallback.
  logger.info("📧 [DEV EMAIL] Not sending real email (no RESEND_API_KEY)", {
    to,
    subject,
    text,
  });
  return { delivered: false };
}

/** Convenience wrapper that formats a one-time-code email. */
async function sendOtpEmail({ to, code, purpose }) {
  const action =
    purpose === "PASSWORD_RESET" ? "reset your password" : "verify your email";
  const subject =
    purpose === "PASSWORD_RESET" ? "Your password reset code" : "Your verification code";

  const text = `Your Shortly code to ${action} is ${code}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2 style="margin:0 0 8px">Shortly</h2>
      <p style="color:#555">Use this code to ${action}:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p>
      <p style="color:#888;font-size:13px">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</p>
    </div>`;

  return sendEmail({ to, subject, text, html });
}

module.exports = { sendEmail, sendOtpEmail };
