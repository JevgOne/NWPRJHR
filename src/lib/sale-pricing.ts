import type { CustomerType } from "@prisma/client";
import { prisma } from "./db";
import { roundHalereUp } from "./rounding";
import { getLoyaltyDiscount } from "./loyalty";

export interface SalePriceResult {
  pricePerGram: number;
  pricePerPiece: number | null;
  sellingMode: "BY_GRAM" | "BY_PIECE";
}

/**
 * Get effective price for a sale, supporting both BY_GRAM and BY_PIECE modes.
 * SALON/HAIRDRESSER: retail price minus loyalty tier discount.
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

  // Get loyalty discount for B2B customers
  let discountPct = 0;
  if ((customerType === "SALON" || customerType === "HAIRDRESSER") && salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { tier: true, type: true },
    });
    if (salon) {
      discountPct = await getLoyaltyDiscount(salon.tier, salon.type);
    }
  }

  // Always compute pricePerGram from retail price
  let pricePerGram: number;
  if (customerType === "RETAIL" || discountPct === 0) {
    pricePerGram = variant.retailPricePerGram;
  } else {
    pricePerGram = roundHalereUp(
      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
    );
  }

  if (sellingMode === "BY_PIECE") {
    const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
    let piecePrice: number;
    if (customerType === "RETAIL" || discountPct === 0) {
      piecePrice = retailPerPiece;
    } else {
      piecePrice = roundHalereUp(
        (retailPerPiece * (10000 - discountPct)) / 10000
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
