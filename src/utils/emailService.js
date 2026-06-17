const nodemailer = require("nodemailer");

// Use explicit SMTP settings instead of service shorthand
// — required for reliable delivery from cloud hosts like Render
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("─── EMAIL CREDENTIALS MISSING ────────────────────────");
    console.log(`  Would have sent reset link to: ${toEmail}`);
    console.log(`  Link: ${resetUrl}`);
    console.log("──────────────────────────────────────────────────────");
    return;
  }

  const year = new Date().getFullYear();

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset your Shortly password</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding:0 0 24px 0;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#4f46e5;">Shortly</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#888888;">URL Shortener</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a2e;">Reset your password</h2>
            <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.6;">
              We received a request to reset the password for the Shortly account associated with <strong>${toEmail}</strong>.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#555555;line-height:1.6;">
              Click the button below to choose a new password. This link will expire in <strong>1 hour</strong>.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background-color:#4f46e5;border-radius:8px;">
                  <a href="${resetUrl}" target="_blank"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#888888;line-height:1.6;text-align:center;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:32px 0;" />
            <p style="margin:0;font-size:13px;color:#aaaaaa;line-height:1.5;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 0 0;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">© ${year} Shortly. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = `Reset your Shortly password\n\nWe received a request to reset the password for your Shortly account (${toEmail}).\n\nClick the link below to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n© ${year} Shortly`;

  const mailOptions = {
    from: {
      name: "Shortly Support",
      address: process.env.EMAIL_USER,
    },
    to: toEmail,
    subject: "Reset your Shortly password",
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email successfully sent to ${toEmail} — MessageID: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error.message);
    throw error; // re-throw so the controller can return a 500 if email fails
  }
};

module.exports = { sendPasswordResetEmail };
