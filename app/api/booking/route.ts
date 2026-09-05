import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || gmailUser;

  if (!gmailUser || !gmailAppPassword || !notifyTo) {
    console.error("[booking] Missing Gmail SMTP configuration in environment variables");
    return NextResponse.json({ error: "Booking notifications are not configured" }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: gmailUser,
      to: notifyTo,
      replyTo: payload.email,
      subject: `New booking request — ${payload.name}`,
      text: buildMessage(payload),
    });
  } catch (err) {
    console.error("[booking] Failed to send booking notification email:", err);
    return NextResponse.json({ error: "Failed to send booking notification" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
