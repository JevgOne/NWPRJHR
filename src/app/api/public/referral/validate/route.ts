import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — public validation of referral code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ valid: false, error: "Missing code" }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      referrerSalon: { select: { name: true } },
      referrerCustomer: { select: { name: true } },
    },
  });

  if (!referral || !referral.active) {
    return NextResponse.json({ valid: false });
  }

  if (referral.maxUses && referral.usedCount >= referral.maxUses) {
    return NextResponse.json({ valid: false });
  }

  const referrerName = referral.referrerSalon?.name ?? referral.referrerCustomer?.name ?? "Hairland";

  return NextResponse.json({
    valid: true,
    referrerName,
    discountType: referral.refereeDiscountType,
    discountValue: referral.refereeDiscountValue,
  });
}
