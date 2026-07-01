import { NextRequest, NextResponse } from "next/server";
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
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const ticket = await prisma.complaintTicket.findUnique({ where: { id } });
  if (!ticket)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.complaintTicket.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.adminNote !== undefined && { adminNote: body.adminNote }),
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "ComplaintTicket",
    entityId: id,
    detail: { status: body.status, ticketNumber: ticket.ticketNumber },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(updated);
}
