require("dotenv").config();
const { verifyEmailTransport, sendPasswordResetEmail } = require("../src/utils/emailService");

const targetEmail = process.argv[2];

async function diagnose() {
  console.log("=== Email SMTP diagnostic ===\n");
  console.log("EMAIL_USER:", process.env.EMAIL_USER || "(not set)");
  console.log("EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "(set)" : "(not set)");
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "(not set)");
  console.log("NODE_ENV:", process.env.NODE_ENV || "(not set)");
  console.log("");

  // 1. Verify the transport without sending an email.
  const transportOk = await verifyEmailTransport();
  if (!transportOk) {
    console.log("\n❌ SMTP transport could not be verified.");
    console.log("Common causes:");
    console.log("  - Wrong Gmail App Password (must be 16 chars, not your Gmail password)");
    console.log("  - 2-Step Verification not enabled on the Gmail account");
    console.log("  - App Password was revoked");
    console.log("  - Account temporarily blocked by Google");
    console.log("  - Network/firewall blocking outbound SMTP");
    return;
  }

  console.log("\n✅ SMTP transport verified successfully.");

  // 2. If an email address was passed as an argument, send a real test email.
  if (!targetEmail) {
    console.log("\nNo target email provided. To send a real test email, run:");
    console.log("  node scratch/diagnose-email.js your-email@example.com");
    return;
  }

  console.log(`\nSending a real test reset email to ${targetEmail}...`);
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=test-token`;
  const result = await sendPasswordResetEmail(targetEmail, resetUrl);

  if (result.success) {
    console.log("✅ Test email sent successfully. Message ID:", result.messageId);
    console.log("\nIf you don't see it in your inbox, check:");
    console.log("  - Spam / Junk / Promotions folders");
    console.log("  - Gmail 'All Mail'");
    console.log("  - Whether your provider rejected the message");
  } else {
    console.log("❌ Failed to send test email:", result.error);
  }
}

diagnose().catch((err) => {
  console.error("Unexpected error during diagnosis:", err);
  process.exit(1);
});
