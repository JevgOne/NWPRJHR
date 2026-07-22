import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSku } from "@/lib/sku";

/**
 * Search variants by query (matches product name, color).
 * Used by admin order edit to swap variants.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2)
    return NextResponse.json([]);

  const variants = await prisma.variant.findMany({
    where: {
      active: true,
      OR: [
        { color: { contains: q } },
        { product: { name: { contains: q } } },
      ],
    },
    include: {
      product: { select: { name: true, category: true, texture: true } },
    },
    take: 20,
    orderBy: [{ product: { name: "asc" } }, { lengthCm: "asc" }],
  });

  type VariantWithProduct = (typeof variants)[number];
  const results = variants.map((v: VariantWithProduct) => ({
    id: v.id,
    sku: generateSku(v.product.category, v.product.texture, v.color, v.lengthCm),
    productName: v.product.name,
    color: v.color,
    lengthCm: v.lengthCm,
    retailPricePerGram: v.retailPricePerGram,
    sellingMode: v.sellingMode,
  }));

  return NextResponse.json(results);
}
