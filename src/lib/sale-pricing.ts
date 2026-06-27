import type { CustomerType } from "@prisma/client";
import { prisma } from "./db";
import { roundHalereUp } from "./rounding";

/**
 * Get effective price per gram for a sale.
 * SALON: wholesale price (loyalty discount applied in Step 6 when tiers are implemented).
 * HAIRDRESSER: retail price minus hairdresser discount from B2BSettings.
 * RETAIL: retail price.
 */
export async function getSalePrice(
  variantId: string,
  customerType: CustomerType,
  _salonId?: string
): Promise<{ pricePerGram: number }> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: variantId },
  });

  if (customerType === "RETAIL") {
    return { pricePerGram: variant.retailPricePerGram };
  }

  if (customerType === "HAIRDRESSER") {
    const settings = await prisma.b2BSettings.findFirst();
    const discountPct = settings?.hairdresserDiscountPct ?? 2000;
    const price = roundHalereUp(
      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
    );
    return { pricePerGram: price };
  }

  // SALON: wholesale price (loyalty discounts will be added in Step 6)
  return { pricePerGram: variant.wholesalePricePerGram };
}

/**
 * Calculate line total for an item.
 */
export function calculateLineTotal(
  pricePerGram: number,
  grams: number
): number {
  return roundHalereUp(pricePerGram * grams);
}
