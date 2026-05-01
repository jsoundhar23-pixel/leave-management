/* global process */
import nodemailer from "nodemailer";

// Create transporter function to ensure env vars are loaded at runtime
const getTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (to, subject, text) => {
  try {
    const transporter = getTransporter();
    
    const info = await transporter.sendMail({
      from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: text, // Send as HTML as well for better formatting
    });

    console.log("✅ Email sent to:", to, "- MessageID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed to:", to);
    console.error("Error details:", error.message);
    throw error;
  }
};
