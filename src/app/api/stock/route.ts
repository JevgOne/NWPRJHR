import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStockNumbers, getAllStockNumbers } from "@/lib/stock";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const variantId = searchParams.get("variantId");
  const productId = searchParams.get("productId");
  const role = session.user.role;

  // Single variant stock
  if (variantId) {
    const stock = await getStockNumbers(variantId);

    if (role === "SALON" || role === "HAIRDRESSER") {
      return NextResponse.json({
        variantId,
        availableGrams: stock.availableGrams,
        availablePieces: stock.availablePieces,
      });
    }

    if (role === "EMPLOYEE") {
      return NextResponse.json({
        variantId,
        physicalGrams: stock.physicalGrams,
        physicalPieces: stock.physicalPieces,
        availableGrams: stock.availableGrams,
        availablePieces: stock.availablePieces,
      });
    }

    // OWNER: full detail
    return NextResponse.json({ variantId, ...stock });
  }

  // All variants stock overview
  const allStock = await getAllStockNumbers();

  // Get variant info for display
  const variantWhere: Record<string, unknown> = { active: true };
  if (productId) variantWhere.productId = productId;

  const variants = await prisma.variant.findMany({
    where: variantWhere,
    include: { product: { select: { id: true, name: true, category: true, processingType: true } } },
    orderBy: [{ product: { name: "asc" } }, { lengthCm: "asc" }, { color: "asc" }],
  });

  const result = variants.map((v) => {
    const stock = allStock.get(v.id) ?? {
      physicalGrams: 0,
      physicalPieces: 0,
      reservedGrams: 0,
      reservedPieces: 0,
      availableGrams: 0,
      availablePieces: 0,
    };

    const base = {
      variantId: v.id,
      product: v.product,
      lengthCm: v.lengthCm,
      color: v.color,
    };

    if (role === "SALON" || role === "HAIRDRESSER") {
      return {
        ...base,
        availableGrams: stock.availableGrams,
        availablePieces: stock.availablePieces,
      };
    }

    if (role === "EMPLOYEE") {
      return {
        ...base,
        physicalGrams: stock.physicalGrams,
        physicalPieces: stock.physicalPieces,
        availableGrams: stock.availableGrams,
        availablePieces: stock.availablePieces,
      };
    }

    // OWNER
    return { ...base, ...stock };
  });

  return NextResponse.json(result);
}
