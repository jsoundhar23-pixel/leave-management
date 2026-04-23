/* global process */
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsapp = async (to, message) => {
  try {
    const res = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`, // must be +91XXXXXXXXXX
      body: message,
    });

    console.log("✅ WhatsApp sent:", res.sid);
  } catch (error) {
    console.error("❌ WhatsApp failed:", error.message);
    throw error;
  }
};
