import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) {
    data.status = body.status;
    if (body.status === "CONTACTED" && !inquiry.contactedAt) {
      data.contactedAt = new Date();
    }
    if (body.status === "COMPLETED" && !inquiry.completedAt) {
      data.completedAt = new Date();
    }
  }
  if (body.assignedTo !== undefined) {
    data.assignedTo = body.assignedTo || null;
    if (body.assignedTo && !inquiry.assignedAt) {
      data.assignedAt = new Date();
    }
  }
  if (body.internalNote !== undefined) {
    data.internalNote = body.internalNote || null;
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data,
    include: { items: true },
  });

  if (body.status) {
    revalidateTag("badges");
  }

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Inquiry",
    entityId: id,
    detail: { status: body.status },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(updated);
}
