import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { supplierSchema } from "@/lib/validations/delivery";

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

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { deliveries: true } } },
  });

  if (!supplier)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(supplier);
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
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(supplier);
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

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { deliveries: true } } },
  });

  if (!supplier)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (supplier._count.deliveries > 0) {
    // Soft delete (archive)
    await prisma.supplier.update({
      where: { id },
      data: { archived: true },
    });
    return NextResponse.json({ archived: true });
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
