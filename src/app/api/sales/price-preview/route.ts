import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pricePreviewSchema } from "@/lib/validations/sale";
import { getSalePrice } from "@/lib/sale-pricing";
import { roundHalereUp } from "@/lib/rounding";
import { getStockNumbers } from "@/lib/stock";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = pricePreviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const { variantId, customerType, salonId, grams, pieces } = parsed.data;

  const [pricing, stock] = await Promise.all([
    getSalePrice(variantId, customerType, salonId),
    getStockNumbers(variantId),
  ]);

  const availableStock = {
    grams: stock.availableGrams,
    pieces: stock.availablePieces,
  };

  if (pricing.sellingMode === "BY_PIECE") {
    // Check if there are non-exclusive grams available for partial gram sales
    const nonExclusiveStock = await prisma.delivery.aggregate({
      where: { variantId, exclusive: false, remainingGrams: { gt: 0 } },
      _sum: { remainingGrams: true },
    });
    const hasNonExclusiveGrams = (nonExclusiveStock._sum.remainingGrams ?? 0) > 0;

    const lineTotal = (pieces ?? 0) > 0
      ? roundHalereUp((pricing.pricePerPiece ?? 0) * (pieces ?? 0))
      : roundHalereUp(pricing.pricePerGram * grams);
    return NextResponse.json({
      sellingMode: "BY_PIECE",
      pricePerPiece: pricing.pricePerPiece,
      pricePerGram: pricing.pricePerGram,
      lineTotal,
      availableStock,
      hasNonExclusiveGrams,
    });
  }

  const lineTotal = roundHalereUp(pricing.pricePerGram * grams);
  return NextResponse.json({
    sellingMode: "BY_GRAM",
    pricePerGram: pricing.pricePerGram,
    lineTotal,
    availableStock,
  });
}
