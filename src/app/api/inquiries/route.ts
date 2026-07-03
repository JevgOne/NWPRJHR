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

  // Look up promo code discounts for inquiries that have one
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

  const result = inquiries.map((inq) => {
    const promo = inq.promoCode ? promoMap.get(inq.promoCode) : null;
    return {
      ...inq,
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
