import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { notifyInquiry } from "@/lib/telegram";
import { z } from "zod";

const inquiryItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(500),
  lengthCm: z.number().int().positive(),
  color: z.string().min(1).max(50),
  quantity: z.number().int().positive(),
  unit: z.enum(["g", "ks"]).default("g"),
});

const inquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().default(""),
  salonName: z.string().max(200).optional().default(""),
  message: z.string().max(5000).optional().default(""),
  items: z.array(inquiryItemSchema).min(1).max(50),
});

// Rate limit: 5 per hour per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3600_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, salonName, message, items } = parsed.data;

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        salonName: salonName || null,
        message: message || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            lengthCm: item.lengthCm,
            color: item.color,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
    });

    // Notify owner
    const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";
    const itemLines = items
      .map((i) => `  • ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}`)
      .join("\n");

    await sendNotificationEmail({
      to: contactTo,
      subject: `[Hairland] Nová poptávka: ${name}${salonName ? ` (${salonName})` : ""}`,
      body: [
        `Nová poptávka #${inquiry.id.slice(-6)}`,
        "",
        `Jméno: ${name}`,
        `Email: ${email}`,
        phone ? `Telefon: ${phone}` : null,
        salonName ? `Salon: ${salonName}` : null,
        "",
        `Položky (${items.length}):`,
        itemLines,
        "",
        message ? `Poznámka: ${message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch(() => {});

    // In-app notification for all owners
    try {
      const owners = await prisma.user.findMany({
        where: { role: "OWNER" },
        select: { id: true },
      });
      if (owners.length > 0) {
        await prisma.notification.createMany({
          data: owners.map((o) => ({
            recipientId: o.id,
            type: "NEW_INQUIRY" as const,
            title: `Nová poptávka: ${name}${salonName ? ` (${salonName})` : ""}`,
            message: `${name} poptává ${items.length} položek. ${items.map((i) => i.productName).join(", ")}`,
            data: JSON.stringify({ inquiryId: inquiry.id, name, itemCount: items.length }),
          })),
        });
      }
    } catch {}

    // Telegram notification
    notifyInquiry(inquiry.id, {
      name,
      email,
      phone: phone || undefined,
      salonName: salonName || undefined,
      message: message || undefined,
      items,
    }).catch(() => {});

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (err) {
    console.error("Inquiry creation failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
