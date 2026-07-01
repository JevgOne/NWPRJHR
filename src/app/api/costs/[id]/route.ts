import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateOperatingCostSchema } from "@/lib/validations/finance";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const cost = await prisma.operatingCost.findUnique({ where: { id } });
  if (!cost)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(cost);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOperatingCostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const existing = await prisma.operatingCost.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cost = await prisma.operatingCost.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}),
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "OperatingCost",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(cost);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.operatingCost.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.operatingCost.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "OperatingCost",
    entityId: id,
    detail: { category: existing.category, amountHalere: existing.amountHalere },
    ipAddress: getClientIp(_request),
  });

  return NextResponse.json({ success: true });
}
