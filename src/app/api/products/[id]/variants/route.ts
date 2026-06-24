import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createVariantsSchema } from "@/lib/validations/product";
import { serializeVariantForRole } from "@/lib/api/product-serializer";
import { calculateRetailPrice } from "@/lib/pricing";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const variants = await prisma.variant.findMany({
    where: { productId: id },
    orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
  });

  const serialized = variants.map((v) =>
    serializeVariantForRole(v, session.user.role)
  );

  return NextResponse.json(serialized);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json();
  const parsed = createVariantsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Get markup for this product's category
  const priceSetting = await prisma.priceSettings.findUnique({
    where: { category: product.category },
  });
  const markupPercent = priceSetting?.markupPercent ?? 0;

  const created = await prisma.variant.createMany({
    data: parsed.data.variants.map((v) => ({
      productId,
      lengthCm: v.lengthCm,
      color: v.color,
      wholesalePricePerGram: v.wholesalePricePerGram,
      retailPricePerGram: calculateRetailPrice(
        v.wholesalePricePerGram,
        markupPercent
      ),
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ created: created.count }, { status: 201 });
}
