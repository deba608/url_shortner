require('dotenv').config();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

async function testResetEmail() {
  console.log("=== Simulating the EXACT forgot password flow ===\n");
  
  const userEmail = 'pdebashish608@gmail.com'; // <<< CHANGE TO YOUR EMAIL TO TEST
  
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_APP_PASSWORD set:", !!process.env.EMAIL_APP_PASSWORD);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Target email:", userEmail);
  console.log("\n--- Building reset email ---");

  const resetToken = jwt.sign(
    { email: userEmail, type: "password_reset" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  console.log("Reset URL:", resetUrl);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Shortly</h2>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h3 style="color: #333333; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #555555; line-height: 1.6;">
          We received a request to reset the password for your Shortly account associated with <strong>${userEmail}</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #777777; font-size: 13px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    console.log("\nSending password reset email...");
    const info = await transporter.sendMail({
      from: `"Shortly Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Reset your Shortly password",
      html: htmlContent,
    });
    console.log("✅ SUCCESS! Reset email sent to:", userEmail);
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ FAILED to send reset email!");
    console.error("Error:", err.message);
  }
}

testResetEmail();
