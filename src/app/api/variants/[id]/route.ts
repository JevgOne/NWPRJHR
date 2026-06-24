import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateVariantSchema } from "@/lib/validations/product";
import { calculateRetailPrice } from "@/lib/pricing";

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

  // If retail price set explicitly, mark as manual override
  if (parsed.data.retailPricePerGram !== undefined) {
    data.retailManualOverride = true;
  }

  // If wholesale changed and NOT manual override, recalculate retail
  if (
    parsed.data.wholesalePricePerGram !== undefined &&
    !parsed.data.retailManualOverride &&
    !existing.retailManualOverride
  ) {
    const priceSetting = await prisma.priceSettings.findUnique({
      where: { category: existing.product.category },
    });
    data.retailPricePerGram = calculateRetailPrice(
      parsed.data.wholesalePricePerGram,
      priceSetting?.markupPercent ?? 0
    );
  }

  const variant = await prisma.variant.update({
    where: { id },
    data,
  });

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

  return NextResponse.json(variant);
}
