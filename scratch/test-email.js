require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log("Testing email configuration...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_APP_PASSWORD configured:", !!process.env.EMAIL_APP_PASSWORD);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error("❌ Credentials are missing in .env file");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Shortly Support" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to themselves for testing
      subject: "Test Email from Shortly",
      text: "If you are reading this, your Nodemailer setup is working perfectly!",
    });
    console.log("✅ SUCCESS! Email sent to", process.env.EMAIL_USER);
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ FAILED to send email.");
    console.error("Error Details:", error.message);
  }
}

testEmail();
