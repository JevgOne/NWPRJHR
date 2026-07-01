import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      sale: { select: { saleNumber: true } },
      salon: { select: { id: true, name: true } },
      delivery: {
        select: {
          id: true,
          barcode: true,
          supplier: { select: { name: true } },
        },
      },
      creditNote: { select: { id: true, number: true } },
      createdByUser: { select: { name: true } },
    },
  });

  if (!complaint)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(complaint);
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

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.supplierNote && { supplierNote: body.supplierNote }),
      ...(body.status === "RESOLVED" && { resolvedAt: new Date() }),
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Complaint",
    entityId: id,
    detail: { status: body.status },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(complaint);
}
