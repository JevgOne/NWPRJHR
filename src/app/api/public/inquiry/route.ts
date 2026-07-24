import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { getInquiryConfirmationEmail } from "@/lib/email-templates";
import { notifyInquiry } from "@/lib/telegram";
import { generateSku } from "@/lib/sku";
import { upsertCustomerFromContact } from "@/lib/customer-upsert";
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
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().default(""),
  city: z.string().max(100).optional().default(""),
  salonName: z.string().max(200).optional().default(""),
  message: z.string().max(5000).optional().default(""),
  promoCode: z.string().max(50).optional().default(""),
  referralCode: z.string().max(50).optional().default(""),
  locale: z.enum(["cs", "uk", "ru"]).optional().default("cs"),
  customerPhotos: z.array(z.string().url().or(z.string().startsWith("/uploads/"))).max(3).optional().default([]),
  items: z.array(inquiryItemSchema).max(50).default([]),
  shippingMethod: z.enum(["PERSONAL_DELIVERY", "PACKETA", "CZECH_POST", "PICKUP"]).optional(),
  paymentMethod: z.enum(["TRANSFER", "CASH", "CARD"]).optional(),
  packetaPointId: z.string().max(50).optional(),
  packetaPointName: z.string().max(200).optional(),
  packetaPointCity: z.string().max(100).optional(),
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

  const { firstName, lastName, email, phone, city, salonName, message, promoCode, referralCode, locale, customerPhotos, items, shippingMethod, paymentMethod, packetaPointId, packetaPointName, packetaPointCity } = parsed.data;
  const name = parsed.data.name || `${firstName} ${lastName}`.trim();

  // Validate and increment promo code usage
  let appliedPromoCode: string | null = null;
  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode.toUpperCase() },
    });
    if (promo && promo.active) {
      const now = new Date();
      const isValid =
        (!promo.validFrom || now >= promo.validFrom) &&
        (!promo.validTo || now <= promo.validTo) &&
        (!promo.maxUses || promo.usedCount < promo.maxUses);
      if (isValid) {
        appliedPromoCode = promo.code;
        await prisma.promoCode.update({
          where: { code: promo.code },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  // Auto-upsert customer
  const customerId = await upsertCustomerFromContact({
    firstName, lastName, email, phone, city,
  }).catch(() => null);

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        firstName,
        lastName,
        email,
        phone: phone || null,
        city: city || null,
        salonName: salonName || null,
        message: message || null,
        promoCode: appliedPromoCode,
        referralCode: referralCode || null,
        customerId,
        customerPhotos: customerPhotos.length > 0 ? JSON.stringify(customerPhotos) : null,
        shippingMethod: shippingMethod || null,
        paymentMethod: paymentMethod || null,
        packetaPointId: packetaPointId || null,
        packetaPointName: packetaPointName || null,
        packetaPointCity: packetaPointCity || null,
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

    // Track referral conversion
    if (referralCode) {
      const referral = await prisma.referral.findUnique({
        where: { code: referralCode.toUpperCase() },
      });
      if (referral && referral.active) {
        await prisma.referralConversion.create({
          data: {
            referralId: referral.id,
            refereeType: "INQUIRY",
            refereeInquiryId: inquiry.id,
            status: "PENDING",
          },
        });
        await prisma.referral.update({
          where: { id: referral.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Enrich items with SKU
    let itemsWithSku = items.map((i) => ({ ...i, sku: undefined as string | undefined }));
    if (items.length > 0) {
      const productIds = [...new Set(items.map((i) => i.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true, texture: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      itemsWithSku = items.map((i) => {
        const p = productMap.get(i.productId);
        return { ...i, sku: p ? generateSku(p.category, p.texture, i.color, i.lengthCm) : undefined };
      });
    }

    // Notify owner
    const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";
    const itemLines = items.length > 0
      ? itemsWithSku.map((i) => `  • ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}${i.sku ? ` (${i.sku})` : ""}`).join("\n")
      : "  (žádné produkty — žádost o poradenství / fotky)";

    await sendNotificationEmail({
      to: contactTo,
      subject: `[Hairland] ${items.length > 0 ? "Nová objednávka z webu" : "Žádost o poradenství"}: ${name}${salonName ? ` (${salonName})` : ""}`,
      body: [
        `${items.length > 0 ? "Nová objednávka z webu" : "Žádost o poradenství"} #${inquiry.id.slice(-6)}`,
        "",
        `Jméno: ${name}`,
        `Email: ${email}`,
        phone ? `Telefon: ${phone}` : null,
        salonName ? `Salon: ${salonName}` : null,
        appliedPromoCode ? `Slevový kód: ${appliedPromoCode}` : null,
        "",
        items.length > 0 ? `Položky (${items.length}):` : "Typ: Poradenství",
        itemLines,
        "",
        message ? `Poznámka: ${message}` : null,
        customerPhotos.length > 0 ? `\nFotky zákaznice: ${customerPhotos.length}` : null,
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
            title: `${items.length > 0 ? "Nová objednávka z webu" : "Žádost o poradenství"}: ${name}${salonName ? ` (${salonName})` : ""}`,
            message: items.length > 0
              ? `${name} objednává ${items.length} položek. ${items.map((i) => i.productName).join(", ")}`
              : `${name} žádá o poradenství${customerPhotos.length > 0 ? ` (${customerPhotos.length} fotek)` : ""}.`,
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
      items: itemsWithSku,
    }).catch(() => {});

    // Confirmation email to customer
    const inquiryEmailData = getInquiryConfirmationEmail(locale, {
      name,
      items: itemsWithSku,
      promoCode: appliedPromoCode ?? undefined,
      inquiryId: inquiry.id,
    });
    sendNotificationEmail({
      to: email,
      toName: name,
      subject: inquiryEmailData.subject,
      body: inquiryEmailData.text,
      html: inquiryEmailData.html,
    }).catch(() => {});

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (err) {
    console.error("Inquiry creation failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
