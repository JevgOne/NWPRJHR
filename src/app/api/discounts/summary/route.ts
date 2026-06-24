import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const discounts = await prisma.discount.findMany({
    where,
    include: {
      bearers: { include: { partner: true } },
      givenByUser: { select: { id: true, name: true } },
    },
  });

  // Aggregate by type
  const byType = { STANDARD: 0, MARKETING: 0, PERSONAL: 0 };
  let totalDiscountAmount = 0;

  for (const d of discounts) {
    byType[d.type] += d.amountHalere;
    totalDiscountAmount += d.amountHalere;
  }

  // Aggregate by partner (who bears discounts)
  const partnerMap = new Map<
    string,
    {
      partnerId: string;
      name: string;
      totalBorne: number;
      personalTotal: number;
    }
  >();

  for (const d of discounts) {
    for (const b of d.bearers) {
      const existing = partnerMap.get(b.partnerId) ?? {
        partnerId: b.partnerId,
        name: b.partner.name,
        totalBorne: 0,
        personalTotal: 0,
      };
      existing.totalBorne += b.shareAmount;
      if (d.type === "PERSONAL") {
        existing.personalTotal += b.shareAmount;
      }
      partnerMap.set(b.partnerId, existing);
    }
  }

  // Aggregate by user who gave discounts
  const givenByMap = new Map<
    string,
    { userId: string; name: string | null; totalGiven: number; count: number }
  >();

  for (const d of discounts) {
    const existing = givenByMap.get(d.givenByUserId) ?? {
      userId: d.givenByUserId,
      name: d.givenByUser.name,
      totalGiven: 0,
      count: 0,
    };
    existing.totalGiven += d.amountHalere;
    existing.count += 1;
    givenByMap.set(d.givenByUserId, existing);
  }

  return NextResponse.json({
    byType,
    byPartner: Array.from(partnerMap.values()),
    byUser: Array.from(givenByMap.values()),
    totalDiscountAmount,
    totalDiscounts: discounts.length,
  });
}
