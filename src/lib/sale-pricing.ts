import type { CustomerType } from "@prisma/client";
import { prisma } from "./db";
import { roundHalereUp } from "./rounding";

export interface SalePriceResult {
  pricePerGram: number;
  pricePerPiece: number | null;
  sellingMode: "BY_GRAM" | "BY_PIECE";
}

/**
 * Get effective price for a sale, supporting both BY_GRAM and BY_PIECE modes.
 * Returns sellingMode so callers know which price to use for lineTotal.
 */
export async function getSalePrice(
  variantId: string,
  customerType: CustomerType,
  _salonId?: string
): Promise<SalePriceResult> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: variantId },
  });

  const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";

  // Always compute pricePerGram (needed for COGS even in BY_PIECE mode)
  let pricePerGram: number;
  if (customerType === "RETAIL") {
    pricePerGram = variant.retailPricePerGram;
  } else if (customerType === "HAIRDRESSER") {
    const settings = await prisma.b2BSettings.findFirst();
    const discountPct = settings?.hairdresserDiscountPct ?? 2000;
    pricePerGram = roundHalereUp(
      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
    );
  } else {
    // SALON: wholesale price
    pricePerGram = variant.wholesalePricePerGram;
  }

  if (sellingMode === "BY_PIECE") {
    let piecePrice: number;
    if (customerType === "RETAIL") {
      piecePrice = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
    } else if (customerType === "HAIRDRESSER") {
      const settings = await prisma.b2BSettings.findFirst();
      const discountPct = settings?.hairdresserDiscountPct ?? 2000;
      const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
      piecePrice = roundHalereUp(
        (retailPerPiece * (10000 - discountPct)) / 10000
      );
    } else {
      // SALON: wholesale per piece
      piecePrice = variant.pricePerPiece ?? 0;
    }
    return { pricePerGram, pricePerPiece: piecePrice, sellingMode: "BY_PIECE" };
  }

  return { pricePerGram, pricePerPiece: null, sellingMode: "BY_GRAM" };
}

/**
 * Calculate line total for an item. Supports both selling modes.
 */
export function calculateLineTotal(
  pricePerGram: number,
  grams: number,
  sellingMode?: "BY_GRAM" | "BY_PIECE",
  pricePerPiece?: number | null,
  pieces?: number
): number {
  if (sellingMode === "BY_PIECE" && pricePerPiece != null && pieces) {
    return roundHalereUp(pricePerPiece * pieces);
  }
  return roundHalereUp(pricePerGram * grams);
}
