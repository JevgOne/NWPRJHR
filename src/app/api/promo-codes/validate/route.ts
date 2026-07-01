import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, orderTotal } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promo || !promo.active) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    return NextResponse.json({ valid: false, reason: "not_yet_valid" });
  }
  if (promo.validTo && now > promo.validTo) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, reason: "max_uses" });
  }
  if (promo.minOrderValue && orderTotal && orderTotal < promo.minOrderValue) {
    return NextResponse.json({ valid: false, reason: "min_order" });
  }

  // Calculate discount
  let discountAmount = 0;
  if (promo.discountType === "PERCENT" && orderTotal) {
    discountAmount = Math.round((orderTotal * promo.discountValue) / 10000);
  } else if (promo.discountType === "FIXED") {
    discountAmount = promo.discountValue;
  }

  return NextResponse.json({
    valid: true,
    promoId: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount,
    description: promo.description,
  });
}
