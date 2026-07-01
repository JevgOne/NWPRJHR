import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { companySchema } from "@/lib/validations/invoice";
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
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(company);
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
  const parsed = companySchema.partial().safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.isDefault) {
    await prisma.company.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const company = await prisma.company.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Company",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(company);
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

  const invoiceCount = await prisma.invoice.count({
    where: { companyId: id },
  });

  if (invoiceCount > 0) {
    await prisma.company.update({
      where: { id },
      data: { active: false },
    });

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "ARCHIVE",
      entity: "Company",
      entityId: id,
      ipAddress: getClientIp(_request),
    });

    return NextResponse.json({ archived: true });
  }

  await prisma.company.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "Company",
    entityId: id,
    ipAddress: getClientIp(_request),
  });

  return NextResponse.json({ deleted: true });
}
