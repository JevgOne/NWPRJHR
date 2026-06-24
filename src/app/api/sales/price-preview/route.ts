import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pricePreviewSchema } from "@/lib/validations/sale";
import { getSalePrice, calculateLineTotal } from "@/lib/sale-pricing";
import { getStockNumbers } from "@/lib/stock";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = pricePreviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const { variantId, customerType, salonId, grams } = parsed.data;

  const { pricePerGram } = await getSalePrice(variantId, customerType, salonId);
  const lineTotal = calculateLineTotal(pricePerGram, grams);
  const stock = await getStockNumbers(variantId);

  return NextResponse.json({
    pricePerGram,
    lineTotal,
    availableStock: {
      grams: stock.availableGrams,
      pieces: stock.availablePieces,
    },
  });
}
