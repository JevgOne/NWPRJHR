import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateVariantSchema } from "@/lib/validations/product";
import { calculateRetailPrice } from "@/lib/pricing";
import { logAudit, getClientIp } from "@/lib/audit";

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
  const parsed = updateVariantSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.variant.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = { ...parsed.data };

  // Keep wholesalePricePerGram in sync with retailPricePerGram
  if (parsed.data.retailPricePerGram !== undefined) {
    data.wholesalePricePerGram = parsed.data.retailPricePerGram;
  }

  const variant = await prisma.variant.update({
    where: { id },
    data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Variant",
    entityId: id,
    detail: { changes: parsed.data, productId: existing.productId },
    ipAddress: getClientIp(request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(variant);
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
  const variant = await prisma.variant.update({
    where: { id },
    data: { active: false },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DEACTIVATE",
    entity: "Variant",
    entityId: id,
    ipAddress: getClientIp(_request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(variant);
}
