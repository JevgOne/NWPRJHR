import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations/export";
import { sendNotificationEmail } from "@/lib/email";

// Simple in-memory rate limiter: IP -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, salonName, message, locale } = parsed.data;

  const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairora.cz";

  await sendNotificationEmail({
    to: contactTo,
    subject: `[Hairora] Contact form: ${name}`,
    body: [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      salonName ? `Salon: ${salonName}` : null,
      `Language: ${locale}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ success: true });
}
