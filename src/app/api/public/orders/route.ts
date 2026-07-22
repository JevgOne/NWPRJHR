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
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { roundHalereUp } from "@/lib/rounding";

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
    ]),
    shippingStreet: z.string().max(200).optional(),
    shippingCity: z.string().max(100).optional(),
    shippingZip: z.string().max(20).optional(),
    packetaPointId: z.string().max(50).optional(),
    packetaPointName: z.string().max(200).optional(),
    packetaPointCity: z.string().max(100).optional(),

    paymentMethod: z.enum(["TRANSFER", "CARD", "CASH"]),

    promoCode: z.string().max(50).optional(),
    note: z.string().max(2000).optional(),
    locale: z.enum(["cs", "uk", "ru"]).optional().default("cs"),
    salonId: z.string().optional(),

    wantsBilling: z.boolean().optional().default(false),
    billingName: z.string().max(200).optional(),
    billingIco: z.string().max(20).optional(),
    billingDic: z.string().max(20).optional(),
    billingStreet: z.string().max(200).optional(),
    billingCity: z.string().max(100).optional(),
    billingZip: z.string().max(20).optional(),
    noSurvey: z.boolean().optional().default(false),
    noNewsletter: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.shippingMethod === "PACKETA" && !data.packetaPointId) {
        return false;
      }
      return true;
    },
    { message: "packetaPointId is required for PACKETA shipping" }
  )
  .refine(
    (data) => {
      if (
        (data.shippingMethod === "PERSONAL_DELIVERY" || data.shippingMethod === "CZECH_POST") &&
        (!data.shippingStreet || !data.shippingCity || !data.shippingZip)
      ) {
        return false;
      }
      return true;
    },
    { message: "shippingStreet, shippingCity, and shippingZip are required for PERSONAL_DELIVERY and CZECH_POST" }
  );

// Rate limit: 20 per hour per IP (relaxed for dev/testing)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3600_000;
const RATE_LIMIT_MAX = 20;

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

  // B2B validation
  let salonId: string | null = null;
  let b2bDiscountPct = 0;

  if (data.salonId) {
    const session = await auth();
    if (!session?.user?.salonId || session.user.salonId !== data.salonId) {
      return NextResponse.json({ error: "Unauthorized B2B request" }, { status: 403 });
    }
    if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") {
      return NextResponse.json({ error: "Not a B2B account" }, { status: 403 });
    }

    const [salon, b2bSettings] = await Promise.all([
      prisma.salon.findUnique({ where: { id: data.salonId }, select: { type: true, archived: true } }),
      getCachedB2BSettings(),
    ]);
    if (!salon || salon.archived) {
      return NextResponse.json({ error: "Salon not found or archived" }, { status: 400 });
    }

    salonId = data.salonId;
    b2bDiscountPct = salon.type === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
  }

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
      const retailPrice = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
      pricePerUnit = b2bDiscountPct > 0
        ? roundHalereUp(retailPrice - (retailPrice * b2bDiscountPct) / 20000)
        : retailPrice;
      lineTotal = roundHalereUp(pricePerUnit * item.pieces);
    } else {
      const retailPrice = variant.retailPricePerGram;
      pricePerUnit = b2bDiscountPct > 0
        ? roundHalereUp(retailPrice - (retailPrice * b2bDiscountPct) / 20000)
        : retailPrice;
      lineTotal = roundHalereUp(pricePerUnit * item.grams);
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

  // 5. Shipping cost + cash surcharge
  const shippingCost = getShippingCost(data.shippingMethod, estimatedTotal);
  const cashSurcharge = data.paymentMethod === "CASH" ? 5000 : 0; // +50 Kč
  const totalAmount = estimatedTotal + shippingCost + cashSurcharge;

  // 6. Create Order + Items + Reservations in transaction
  // Reservation expiry: CARD = 30 min, CASH/TRANSFER = 48 hours
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
          ...(salonId
            ? { salonId }
            : { customerId }),
          contactEmail: data.email,
          contactPhone: data.phone ?? null,
          contactName: `${data.firstName} ${data.lastName}`,
          status: "AWAITING_PAYMENT",
          estimatedTotal,
          shippingCost,
          totalAmount,
          shippingMethod: data.shippingMethod,
          shippingStreet: data.shippingStreet ?? null,
          shippingCity: data.shippingCity ?? null,
          shippingZip: data.shippingZip ?? null,
          packetaPointId: data.packetaPointId ?? null,
          packetaPointName: data.packetaPointName ?? null,
          packetaPointCity: data.packetaPointCity ?? null,
          paymentMethod: data.paymentMethod,
          promoCode: appliedPromoCode ?? null,
          promoDiscount: promoDiscount || null,
          wantsBilling: data.wantsBilling,
          billingName: data.billingName ?? null,
          billingIco: data.billingIco ?? null,
          billingDic: data.billingDic ?? null,
          billingStreet: data.billingStreet ?? null,
          billingCity: data.billingCity ?? null,
          billingZip: data.billingZip ?? null,
          noSurvey: data.noSurvey ?? false,
          noNewsletter: data.noNewsletter ?? false,
          accessToken: crypto.randomUUID(),
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

  // 8. Send confirmation email (only for TRANSFER — CARD emails are sent after payment callback)
  if (data.paymentMethod !== "CARD") {
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
        bankAccount: "6424423004/5500",
        variableSymbol: order.orderNumber ?? undefined,
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
      // Release reservations and cancel the order
      await prisma.$transaction(async (tx) => {
        await tx.reservation.updateMany({
          where: { orderId: order.id, active: true },
          data: { active: false },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
      });
      invalidateStockCache();
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
        accessToken: order.accessToken,
        redirect: comgateResult.redirect,
      },
      { status: 201 }
    );
  }

  // CASH or TRANSFER payment — no online payment needed
  return NextResponse.json(
    {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      ...(data.paymentMethod === "TRANSFER"
        ? {
            paymentInfo: {
              bankAccount: "6424423004/5500",
              iban: "CZ5555000000006424423004",
              variableSymbol: order.orderNumber,
              amount: totalAmount / 100,
            },
          }
        : {}),
    },
    { status: 201 }
  );
}
