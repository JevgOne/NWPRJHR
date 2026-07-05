import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — referral stats for current salon user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSalon = session.user.role === "SALON" || session.user.role === "HAIRDRESSER";
  if (!isSalon || !session.user.salonId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const referral = await prisma.referral.findFirst({
    where: { referrerSalonId: session.user.salonId },
    include: {
      conversions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { conversions: true } },
    },
  });

  if (!referral) {
    return NextResponse.json({ hasReferral: false });
  }

  const completedCount = await prisma.referralConversion.count({
    where: { referralId: referral.id, status: "COMPLETED" },
  });

  const pendingCount = await prisma.referralConversion.count({
    where: { referralId: referral.id, status: "PENDING" },
  });

  return NextResponse.json({
    hasReferral: true,
    code: referral.code,
    shareUrl: `https://hairland.cz?ref=${referral.code}`,
    active: referral.active,
    totalConversions: referral._count.conversions,
    completedConversions: completedCount,
    pendingConversions: pendingCount,
    referrerRewardType: referral.referrerRewardType,
    referrerRewardValue: referral.referrerRewardValue,
    refereeDiscountType: referral.refereeDiscountType,
    refereeDiscountValue: referral.refereeDiscountValue,
    conversions: referral.conversions,
  });
}
