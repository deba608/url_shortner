const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    logger.warn("EMAIL CREDENTIALS MISSING — password reset email not sent", {
      toEmail,
      resetUrl,
    });
    return;
  }

  const mailOptions = {
    from: `"Shortly Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Shortly password",
    html: buildResetEmailHtml(toEmail, resetUrl),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${toEmail}`, {
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error("Failed to send password reset email", {
      to: toEmail,
      error: error.message,
      stack: error.stack,
    });
  }
};

function buildResetEmailHtml(toEmail, resetUrl) {
  const year = new Date().getFullYear();
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Shortly</h2>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h3 style="color: #333333; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #555555; line-height: 1.6;">
          We received a request to reset the password for your Shortly account associated with <strong>${toEmail}</strong>.
        </p>
        <p style="color: #555555; line-height: 1.6;">
          Click the button below to choose a new password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #777777; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <p style="text-align: center; color: #999999; font-size: 12px; margin-top: 20px;">
        &copy; ${year} Shortly. All rights reserved.
      </p>
    </div>
  `;
}

module.exports = {
  sendPasswordResetEmail,
};
