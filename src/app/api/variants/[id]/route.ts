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

  // Recalculate retail price when cost price changes (unless manually overridden)
  if (parsed.data.costPricePerGram !== undefined && !existing.retailManualOverride) {
    const priceSetting = await prisma.priceSettings.findUnique({
      where: { category: existing.product.category },
    });
    const markupPercent = priceSetting?.markupPercent ?? 100;
    const newRetail = Math.round(
      parsed.data.costPricePerGram * (10000 + markupPercent * 100) / 10000
    );
    data.retailPricePerGram = newRetail;
    data.wholesalePricePerGram = newRetail;
  }

  // Validate uniqueness when lengthCm or color changes
  if (parsed.data.lengthCm !== undefined || parsed.data.color !== undefined) {
    const newLength = parsed.data.lengthCm ?? existing.lengthCm;
    const newColor = parsed.data.color ?? existing.color;
    const duplicate = await prisma.variant.findUnique({
      where: {
        productId_lengthCm_color: {
          productId: existing.productId,
          lengthCm: newLength,
          color: newColor,
        },
      },
    });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json(
        { error: "Variant with this length and color already exists" },
        { status: 409 }
      );
    }
  }

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
