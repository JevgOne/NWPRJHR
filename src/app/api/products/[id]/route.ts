import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations/product";
import { serializeProductForRole } from "@/lib/api/product-serializer";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: [{ lengthCm: "asc" }, { color: "asc" }] } },
  });

  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializeProductForRole(product, session.user.role));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Product",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(product);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.update({
    where: { id },
    data: { archived: true },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "ARCHIVE",
    entity: "Product",
    entityId: id,
    ipAddress: getClientIp(_request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(product);
}
