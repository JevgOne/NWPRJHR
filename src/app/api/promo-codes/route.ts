import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { code, description, discountType, discountValue, minOrderValue, maxUses, validFrom, validTo } = body;

  if (!code || !discountType || !discountValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check unique code
  const exists = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
  if (exists) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      discountType,
      discountValue: Math.round(discountValue),
      minOrderValue: minOrderValue ? Math.round(minOrderValue) : null,
      maxUses: maxUses || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "PromoCode",
    entityId: promo.id,
    detail: { code: promo.code, discountType, discountValue },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(promo, { status: 201 });
}
