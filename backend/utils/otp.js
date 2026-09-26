const nodemailer = require("nodemailer");

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, code) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV] OTP for ${toEmail}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: "StockSense password reset code",
    text: `Your OTP is ${code}. It expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.`,
  });
}

module.exports = { generateOtpCode, sendOtpEmail };
