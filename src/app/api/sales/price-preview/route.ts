import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pricePreviewSchema } from "@/lib/validations/sale";
import { getSalePrice } from "@/lib/sale-pricing";
import { roundHalereUp } from "@/lib/rounding";
import { getStockNumbers } from "@/lib/stock";

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
    const lineTotal = roundHalereUp((pricing.pricePerPiece ?? 0) * (pieces ?? 0));
    return NextResponse.json({
      sellingMode: "BY_PIECE",
      pricePerPiece: pricing.pricePerPiece,
      pricePerGram: pricing.pricePerGram,
      lineTotal,
      availableStock,
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
