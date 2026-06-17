const nodemailer = require("nodemailer");

// Create a reusable transporter using Gmail's SMTP settings.
// This requires an "App Password", not your normal Gmail password.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., noreply.dev.sh@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD, // 16-character app password
  },
});

/**
 * Send a beautifully formatted HTML password reset email.
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  // If credentials aren't set, just log it (useful for local testing without .env)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("─── EMAIL CREDENTIALS MISSING ────────────────────────");
    console.log(`  Would have sent reset link to: ${toEmail}`);
    console.log(`  Link: ${resetUrl}`);
    console.log("──────────────────────────────────────────────────────");
    return;
  }

  const htmlContent = `
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
        © ${new Date().getFullYear()} Shortly. All rights reserved.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Shortly Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Shortly password",
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email successfully sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
    // We throw the error so the controller can handle it (optional)
    // but usually we don't want to break the flow for the user if email fails.
  }
};

module.exports = {
  sendPasswordResetEmail,
};
