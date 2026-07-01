import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loyaltySettingsSchema } from "@/lib/validations/salon";
import { calculateTier, invalidateLoyaltyCache } from "@/lib/loyalty";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salonType = request.nextUrl.searchParams.get("salonType") ?? undefined;

  const settings = await prisma.loyaltySettings.findMany({
    where: salonType ? { salonType: salonType as "SALON" | "HAIRDRESSER" } : undefined,
    orderBy: { revenueThreshold: "asc" },
  });

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = loyaltySettingsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  const { tier, salonType, revenueThreshold, discountPercent } = parsed.data;

  invalidateLoyaltyCache();
  const setting = await prisma.loyaltySettings.upsert({
    where: { tier_salonType: { tier, salonType } },
    update: { revenueThreshold, discountPercent },
    create: { tier, salonType, revenueThreshold, discountPercent },
  });

  // Recalculate tiers only for matching salon type
  const salons = await prisma.salon.findMany({
    where: { archived: false, type: salonType },
    select: { id: true, totalRevenue: true, tier: true },
  });

  for (const salon of salons) {
    const newTier = await calculateTier(salon.totalRevenue, salonType);
    if (newTier !== salon.tier) {
      await prisma.salon.update({
        where: { id: salon.id },
        data: { tier: newTier },
      });
    }
  }

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "LoyaltySettings",
    detail: { tier, salonType, revenueThreshold, discountPercent },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(setting);
}
