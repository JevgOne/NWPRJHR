import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const promo = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.discountType && { discountType: body.discountType }),
      ...(body.discountValue !== undefined && { discountValue: Math.round(body.discountValue) }),
      ...(body.minOrderValue !== undefined && { minOrderValue: body.minOrderValue ? Math.round(body.minOrderValue) : null }),
      ...(body.maxUses !== undefined && { maxUses: body.maxUses || null }),
      ...(body.validFrom !== undefined && { validFrom: body.validFrom ? new Date(body.validFrom) : null }),
      ...(body.validTo !== undefined && { validTo: body.validTo ? new Date(body.validTo) : null }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "PromoCode",
    entityId: id,
    detail: { code: promo.code, changes: body },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(promo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const promo = await prisma.promoCode.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "PromoCode",
    entityId: id,
    detail: { code: promo.code },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
