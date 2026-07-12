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
 * B2B: discount from margin (margin = retail / 2 with 100% markup).
 * RETAIL: full retail price.
 */
export async function getSalePrice(
  variantId: string,
  customerType: CustomerType,
  salonId?: string
): Promise<SalePriceResult> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: variantId },
  });

  const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";

  // Get B2B discount from settings
  let discountPct = 0;
  if (customerType === "SALON" || customerType === "HAIRDRESSER") {
    const b2bSettings = await prisma.b2BSettings.findFirst();
    discountPct = customerType === "SALON"
      ? (b2bSettings?.salonDiscountPct ?? 3000)
      : (b2bSettings?.hairdresserDiscountPct ?? 2000);
  }

  // Discount from margin (margin = retail / 2 with 100% markup)
  let pricePerGram: number;
  if (customerType === "RETAIL" || discountPct === 0) {
    pricePerGram = variant.retailPricePerGram;
  } else {
    pricePerGram = roundHalereUp(
      variant.retailPricePerGram - (variant.retailPricePerGram * discountPct) / 20000
    );
  }

  if (sellingMode === "BY_PIECE") {
    const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
    let piecePrice: number;
    if (customerType === "RETAIL" || discountPct === 0) {
      piecePrice = retailPerPiece;
    } else {
      piecePrice = roundHalereUp(
        retailPerPiece - (retailPerPiece * discountPct) / 20000
      );
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
