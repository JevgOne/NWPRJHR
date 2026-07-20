import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStockNumbers, invalidateStockCache } from "@/lib/stock";
import { upsertCustomerFromContact } from "@/lib/customer-upsert";
import { getShippingCost } from "@/lib/shipping";
import { generateOrderNumber } from "@/lib/order-to-sale";
import { createPayment } from "@/lib/comgate";
import { createNotificationForRole } from "@/lib/notifications";
import { sendNotificationEmail } from "@/lib/email";
import { getRetailOrderConfirmationEmail } from "@/lib/email-templates";

const publicOrderSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().max(200),
    phone: z.string().max(30).optional(),

    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          grams: z.number().int().min(0),
          pieces: z.number().int().min(0),
        })
      )
      .min(1)
      .max(50),

    shippingMethod: z.enum([
      "PACKETA",
      "PERSONAL_DELIVERY",
      "CZECH_POST",
      "PICKUP",
    ]),
    packetaPointId: z.string().max(50).optional(),
    packetaPointName: z.string().max(200).optional(),
    packetaPointCity: z.string().max(100).optional(),

    paymentMethod: z.enum(["TRANSFER", "CARD"]),

    promoCode: z.string().max(50).optional(),
    note: z.string().max(2000).optional(),
    locale: z.enum(["cs", "uk", "ru"]).optional().default("cs"),
  })
  .refine(
    (data) => {
      if (data.shippingMethod === "PACKETA" && !data.packetaPointId) {
        return false;
      }
      return true;
    },
    { message: "packetaPointId is required for PACKETA shipping" }
  );

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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = publicOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 1. Load variants + check stock
  const variantIds = data.items.map((i) => i.variantId);
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds }, active: true },
    include: { product: { select: { name: true } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of data.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      return NextResponse.json(
        { error: `Variant ${item.variantId} not found or inactive` },
        { status: 400 }
      );
    }

    const stock = await getStockNumbers(item.variantId);
    const isByPiece = variant.sellingMode === "BY_PIECE";

    if (isByPiece) {
      if (item.pieces > 0 && stock.availablePieces < item.pieces) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${variant.product.name}`,
            variantId: item.variantId,
          },
          { status: 409 }
        );
      }
    } else {
      if (item.grams > 0 && stock.availableGrams < item.grams) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${variant.product.name}`,
            variantId: item.variantId,
          },
          { status: 409 }
        );
      }
    }
  }

  // 2. Upsert customer
  const customerId = await upsertCustomerFromContact({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  });

  // 3. Calculate pricing (retail = full price, no B2B discount)
  let estimatedTotal = 0;
  const orderItems: {
    variantId: string;
    grams: number;
    pieces: number;
    pricePerGram: number;
    lineTotal: number;
    productName: string;
    lengthCm: number;
    color: string;
    sku: string | null;
  }[] = [];

  for (const item of data.items) {
    const variant = variantMap.get(item.variantId)!;
    const isByPiece = variant.sellingMode === "BY_PIECE";

    let pricePerUnit: number;
    let lineTotal: number;

    if (isByPiece) {
      pricePerUnit =
        variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
      lineTotal = pricePerUnit * item.pieces;
    } else {
      pricePerUnit = variant.retailPricePerGram;
      lineTotal = pricePerUnit * item.grams;
    }

    estimatedTotal += lineTotal;
    orderItems.push({
      variantId: item.variantId,
      grams: item.grams,
      pieces: item.pieces,
      pricePerGram: pricePerUnit,
      lineTotal,
      productName: variant.product.name,
      lengthCm: variant.lengthCm,
      color: variant.color,
      sku: null,
    });
  }

  // 4. Apply promo code
  let promoDiscount = 0;
  let appliedPromoCode: string | undefined;
  if (data.promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: data.promoCode.toUpperCase() },
    });
    if (promo && promo.active) {
      const now = new Date();
      const isValid =
        (!promo.validFrom || now >= promo.validFrom) &&
        (!promo.validTo || now <= promo.validTo) &&
        (!promo.maxUses || promo.usedCount < promo.maxUses) &&
        (!promo.minOrderValue || estimatedTotal >= promo.minOrderValue);

      if (isValid) {
        if (promo.discountType === "PERCENT") {
          promoDiscount = Math.round(
            (estimatedTotal * promo.discountValue) / 10000
          );
        } else {
          promoDiscount = Math.min(promo.discountValue, estimatedTotal);
        }
        appliedPromoCode = promo.code;
        estimatedTotal = Math.max(0, estimatedTotal - promoDiscount);
      }
    }
  }

  // 5. Shipping cost
  const shippingCost = getShippingCost(data.shippingMethod, estimatedTotal);
  const totalAmount = estimatedTotal + shippingCost;

  // 6. Create Order + Items + Reservations in transaction
  // Reservation expiry: CARD = 30 min, TRANSFER = 48 hours
  const reservationMinutes = data.paymentMethod === "CARD" ? 30 : 48 * 60;
  const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

  const order = await prisma.$transaction(
    async (tx) => {
      // Increment promo usage
      if (appliedPromoCode) {
        await tx.promoCode.update({
          where: { code: appliedPromoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Generate order number (race condition acceptable for MVP — @unique constraint guards)
      const orderNumber = await generateOrderNumber(tx);

      return tx.order.create({
        data: {
          orderNumber,
          customerId,
          contactEmail: data.email,
          contactPhone: data.phone ?? null,
          contactName: `${data.firstName} ${data.lastName}`,
          status: "AWAITING_PAYMENT",
          estimatedTotal,
          shippingCost,
          totalAmount,
          shippingMethod: data.shippingMethod,
          packetaPointId: data.packetaPointId ?? null,
          packetaPointName: data.packetaPointName ?? null,
          packetaPointCity: data.packetaPointCity ?? null,
          paymentMethod: data.paymentMethod,
          promoCode: appliedPromoCode ?? null,
          promoDiscount: promoDiscount || null,
          locale: data.locale,
          note: data.note ?? null,
          items: { create: orderItems },
          reservations: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              grams: item.grams,
              pieces: item.pieces,
              active: true,
              expiresAt,
            })),
          },
        },
        include: { items: true },
      });
    },
    { timeout: 15000 }
  );

  invalidateStockCache();

  // 7. Notify owners
  createNotificationForRole({
    role: "OWNER",
    type: "ORDER_CONFIRMED",
    title: `Nova objednavka ${order.orderNumber}`,
    message: `${data.firstName} ${data.lastName} — ${totalAmount / 100} CZK`,
    data: { orderId: order.id, orderNumber: order.orderNumber },
  }).catch(() => {});

  // 8. Send confirmation email
  try {
    const emailData = getRetailOrderConfirmationEmail(data.locale ?? "cs", {
      customerName: `${data.firstName} ${data.lastName}`,
      orderNumber: order.orderNumber ?? "",
      items: orderItems.map((i) => ({
        productName: i.productName,
        lengthCm: i.lengthCm,
        color: i.color,
        grams: i.grams,
        pieces: i.pieces,
        lineTotal: i.lineTotal,
      })),
      subtotal: estimatedTotal + promoDiscount,
      shippingCost,
      promoCode: appliedPromoCode,
      promoDiscount: promoDiscount || undefined,
      totalAmount,
      paymentMethod: data.paymentMethod,
      bankAccount: data.paymentMethod === "TRANSFER" ? "6424423004/5500" : undefined,
      variableSymbol: data.paymentMethod === "TRANSFER" ? (order.orderNumber ?? undefined) : undefined,
    });
    sendNotificationEmail({
      to: data.email,
      toName: `${data.firstName} ${data.lastName}`,
      subject: emailData.subject,
      body: emailData.text,
      html: emailData.html,
    }).catch((e) => console.error("[public/orders] Confirmation email failed:", e));
  } catch (e) {
    console.error("[public/orders] Email template error:", e);
  }

  // 9. Handle payment method
  if (data.paymentMethod === "CARD") {
    const comgateResult = await createPayment({
      price: totalAmount,
      label: `Obj ${order.orderNumber}`,
      refId: order.orderNumber ?? order.id,
      email: data.email,
      fullName: `${data.firstName} ${data.lastName}`,
      lang: data.locale,
    });

    if (!comgateResult.success) {
      console.error("[public/orders] Comgate create failed:", comgateResult.error);
      return NextResponse.json(
        { error: "Payment creation failed" },
        { status: 502 }
      );
    }

    // Store Comgate transId on order
    await prisma.order.update({
      where: { id: order.id },
      data: { comgateTransId: comgateResult.transId },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirect: comgateResult.redirect,
      },
      { status: 201 }
    );
  }

  // TRANSFER payment
  return NextResponse.json(
    {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentInfo: {
        bankAccount: "6424423004/5500",
        iban: "CZ5550000000006424423004",
        variableSymbol: order.orderNumber,
        amount: totalAmount / 100,
      },
    },
    { status: 201 }
  );
}
