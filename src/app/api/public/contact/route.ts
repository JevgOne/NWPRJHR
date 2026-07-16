import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactFormSchema } from "@/lib/validations/export";
import { sendNotificationEmail } from "@/lib/email";
import { notifyContact } from "@/lib/telegram";
import { createNotificationForRole } from "@/lib/notifications";

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

  const { name, email, phone, salonName, message, customerPhotos, locale } = parsed.data;

  // Save to DB
  const contactMsg = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      salonName: salonName || null,
      message,
      customerPhotos: customerPhotos && customerPhotos.length > 0 ? JSON.stringify(customerPhotos) : null,
      locale: locale || "cs",
    },
  });

  const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";

  await sendNotificationEmail({
    to: contactTo,
    subject: `[Hairland] Contact form: ${name}`,
    body: [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      salonName ? `Salon: ${salonName}` : null,
      `Language: ${locale}`,
      customerPhotos && customerPhotos.length > 0 ? `Photos: ${customerPhotos.length}` : null,
      "",
      message,
      ...(customerPhotos && customerPhotos.length > 0
        ? ["", "Attached photos:", ...customerPhotos.map((url: string, i: number) => `  ${i + 1}. ${url}`)]
        : []),
    ]
      .filter(Boolean)
      .join("\n"),
  }).catch(() => {});

  // Telegram notification
  notifyContact(contactMsg.id, {
    name,
    email,
    phone: phone || undefined,
    salonName: salonName || undefined,
    message,
    locale: locale || undefined,
    customerPhotos: customerPhotos && customerPhotos.length > 0 ? customerPhotos : undefined,
  }).catch(() => {});

  // In-app notification for owners
  createNotificationForRole({
    role: "OWNER",
    type: "NEW_CONTACT",
    title: `Kontaktní formulář: ${name}`,
    message: `${name}${salonName ? ` (${salonName})` : ""} odeslal/a zprávu přes kontaktní formulář.`,
    data: { contactMessageId: contactMsg.id, name, email },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
