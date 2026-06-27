import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyDiscount } from "@/lib/loyalty";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: session.user.salonId },
    select: {
      id: true,
      name: true,
      tier: true,
      points: true,
      totalRevenue: true,
      language: true,
      contactPerson: true,
      email: true,
      phone: true,
      city: true,
      address: true,
    },
  });

  const discountPercent = await getLoyaltyDiscount(salon.tier);

  // Get next tier info
  const allSettings = await prisma.loyaltySettings.findMany({
    orderBy: { revenueThreshold: "asc" },
  });

  const currentIdx = allSettings.findIndex((s) => s.tier === salon.tier);
  const nextTier =
    currentIdx < allSettings.length - 1
      ? allSettings[currentIdx + 1]
      : null;

  return NextResponse.json({
    ...salon,
    discountPercent,
    nextTier: nextTier
      ? {
          tier: nextTier.tier,
          revenueThreshold: nextTier.revenueThreshold,
          remaining: Math.max(0, nextTier.revenueThreshold - salon.totalRevenue),
          discountPercent: nextTier.discountPercent,
        }
      : null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { language } = await request.json();
  if (!["cs", "uk", "ru"].includes(language))
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  const salon = await prisma.salon.update({
    where: { id: session.user.salonId },
    data: { language },
  });

  return NextResponse.json({ language: salon.language });
}
