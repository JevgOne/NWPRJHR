import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePriceSettingsSchema } from "@/lib/validations/product";
import { calculateRetailPrice } from "@/lib/pricing";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.priceSettings.findMany({
    orderBy: { category: "asc" },
  });

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updatePriceSettingsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, markupPercent } = parsed.data;

  // Update setting and recalculate all non-overridden variants in this category
  const setting = await prisma.priceSettings.upsert({
    where: { category },
    update: { markupPercent },
    create: { category, markupPercent },
  });

  // Find all variants in this category without manual override
  const products = await prisma.product.findMany({
    where: { category },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  const variants = await prisma.variant.findMany({
    where: {
      productId: { in: productIds },
      retailManualOverride: false,
    },
  });

  // Batch update retail prices
  for (const variant of variants) {
    await prisma.variant.update({
      where: { id: variant.id },
      data: {
        retailPricePerGram: calculateRetailPrice(
          variant.wholesalePricePerGram,
          markupPercent
        ),
      },
    });
  }

  return NextResponse.json({
    setting,
    recalculated: variants.length,
  });
}
