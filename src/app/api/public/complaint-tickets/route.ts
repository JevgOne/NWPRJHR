import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { complaintTicketSchema } from "@/lib/validations/export";
import { sendNotificationEmail } from "@/lib/email";
import { notifyComplaintTicket } from "@/lib/telegram";
import { createNotificationForRole } from "@/lib/notifications";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 300_000; // 5 minutes
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) return true;

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function generateTicketNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RK-${y}${m}-${seq}`;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = complaintTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    customerType,
    name,
    email,
    phone,
    salonName,
    complaintType,
    orderNumber,
    description,
    photos,
    desiredResolution,
  } = parsed.data;

  const ticketNumber = generateTicketNumber();

  let ticket;
  try {
    ticket = await prisma.complaintTicket.create({
      data: {
        ticketNumber,
        customerType,
        name,
        email,
        phone: phone || null,
        salonName: salonName || null,
        complaintType,
        orderNumber: orderNumber || null,
        description,
        photos: JSON.stringify(photos),
        desiredResolution: desiredResolution || null,
      },
    });
  } catch (err) {
    console.error("ComplaintTicket create error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }

  // Email to admin
  const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";
  const resolutionLabels: Record<string, string> = {
    REPAIR: "Oprava",
    REPLACEMENT: "Výměna",
    DISCOUNT: "Sleva",
    REFUND: "Vrácení peněz",
  };

  sendNotificationEmail({
    to: contactTo,
    subject: `[Hairland] Reklamace ${ticketNumber}: ${name}`,
    body: [
      `Ticket: ${ticketNumber}`,
      `Jméno: ${name}`,
      `E-mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      salonName ? `Salon: ${salonName}` : null,
      `Typ zákazníka: ${customerType}`,
      `Typ reklamace: ${complaintType}`,
      orderNumber ? `Číslo objednávky: ${orderNumber}` : null,
      desiredResolution
        ? `Požadované řešení: ${resolutionLabels[desiredResolution] ?? desiredResolution}`
        : null,
      "",
      description,
      photos.length > 0 ? `\nFotografie (${photos.length}): ${photos.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  }).catch(() => {});

  // Telegram notification
  notifyComplaintTicket(ticket.id, {
    ticketNumber,
    customerType,
    name,
    email,
    phone: phone || undefined,
    salonName: salonName || undefined,
    complaintType,
    orderNumber: orderNumber || undefined,
    description,
    photoCount: photos.length,
  }).catch(() => {});

  // In-app notification for owners
  createNotificationForRole({
    role: "OWNER",
    type: "NEW_COMPLAINT",
    title: `Reklamace ${ticketNumber}`,
    message: `${name}${salonName ? ` (${salonName})` : ""} podal/a reklamaci.`,
    data: { complaintTicketId: ticket.id, ticketNumber, name, email },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    ticketNumber: ticket.ticketNumber,
  });
}
