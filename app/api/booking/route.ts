import { NextResponse } from "next/server";
import twilio from "twilio";

interface BookingPayload {
  name: string;
  email: string;
  eventDate?: string;
  eventType?: string;
  location?: string;
  budget?: string;
  message?: string;
}

function buildMessage(payload: BookingPayload): string {
  return [
    "🎧 NEW JONNYVERSE BOOKING REQUEST",
    "---------------------------------",
    `👤 Client: ${payload.name}`,
    `📧 Email: ${payload.email}`,
    `📅 Date: ${payload.eventDate || "—"}`,
    `🎉 Event: ${payload.eventType || "—"}`,
    `📍 Location: ${payload.location || "—"}`,
    `💰 Budget: ${payload.budget || "—"}`,
    `💬 Note: ${payload.message || "—"}`,
  ].join("\n");
}

export async function POST(request: Request) {
  let payload: BookingPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.name || !payload.email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.BOOKING_WHATSAPP_TO;

  if (!accountSid || !authToken || !from || !to) {
    console.error("[booking] Missing Twilio configuration in environment variables");
    return NextResponse.json({ error: "Booking notifications are not configured" }, { status: 500 });
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${from.replace(/^whatsapp:/, "")}`,
      to: `whatsapp:${to.replace(/^whatsapp:/, "")}`,
      body: buildMessage(payload),
    });
  } catch (err) {
    console.error("[booking] Failed to send WhatsApp notification:", err);
    return NextResponse.json({ error: "Failed to send booking notification" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
