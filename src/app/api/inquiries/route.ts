import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;

  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Look up promo code discounts
  const promoCodes = new Set(
    inquiries.map((i) => i.promoCode).filter(Boolean) as string[]
  );
  const promoMap = new Map<string, { discountType: string; discountValue: number }>();
  if (promoCodes.size > 0) {
    const promos = await prisma.promoCode.findMany({
      where: { code: { in: [...promoCodes] } },
      select: { code: true, discountType: true, discountValue: true },
    });
    for (const p of promos) {
      promoMap.set(p.code, { discountType: p.discountType, discountValue: p.discountValue });
    }
  }

  // Look up variant prices for all items
  const allProductIds = [
    ...new Set(inquiries.flatMap((inq) => inq.items.map((i) => i.productId))),
  ];
  const variants = allProductIds.length > 0
    ? await prisma.variant.findMany({
        where: { productId: { in: allProductIds } },
        select: {
          productId: true,
          lengthCm: true,
          color: true,
          retailPricePerGram: true,
          wholesalePricePerGram: true,
        },
      })
    : [];

  // Key: productId-lengthCm-color
  const variantPriceMap = new Map<string, { retail: number; wholesale: number }>();
  for (const v of variants) {
    variantPriceMap.set(`${v.productId}-${v.lengthCm}-${v.color}`, {
      retail: v.retailPricePerGram,
      wholesale: v.wholesalePricePerGram,
    });
  }

  const result = inquiries.map((inq) => {
    const promo = inq.promoCode ? promoMap.get(inq.promoCode) : null;
    const discountPercent =
      promo?.discountType === "PERCENT" ? promo.discountValue / 100 : 0;

    const itemsWithPrices = inq.items.map((item) => {
      const key = `${item.productId}-${item.lengthCm}-${item.color}`;
      const prices = variantPriceMap.get(key);
      const pricePerGram = prices?.retail ?? 0;
      const itemTotal = pricePerGram * item.quantity;
      return {
        ...item,
        pricePerGram,
        itemTotal,
      };
    });

    const subtotal = itemsWithPrices.reduce((s, i) => s + i.itemTotal, 0);
    const discountAmount = discountPercent > 0
      ? Math.ceil((subtotal * discountPercent) / 100)
      : 0;
    const estimatedTotal = subtotal - discountAmount;

    return {
      ...inq,
      items: itemsWithPrices,
      subtotal,
      discountAmount,
      estimatedTotal,
      promoDiscount: promo
        ? {
            type: promo.discountType,
            value: promo.discountValue,
            label:
              promo.discountType === "PERCENT"
                ? `${promo.discountValue / 100}%`
                : `${(promo.discountValue / 100).toLocaleString("cs-CZ")} Kč`,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
