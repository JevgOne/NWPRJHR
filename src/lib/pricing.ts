/**
 * Calculate retail price from wholesale price + category markup.
 * All amounts in halere (integer).
 *
 * Formula: retailPrice = wholesalePrice * (1 + markupPercent / 100)
 */
export function calculateRetailPrice(
  wholesalePriceHalere: number,
  markupPercent: number
): number {
  return Math.round(wholesalePriceHalere * (1 + markupPercent / 100));
}

/**
 * Format halere to CZK display string.
 * 123500 -> "1 235 Kč"
 */
export function formatCZK(halere: number): string {
  const czk = halere / 100;
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(czk);
}

/** Convert halere to CZK number for display */
export function halereToCZK(halere: number): number {
  return halere / 100;
}

/** Convert CZK number to halere */
export function czkToHalere(czk: number): number {
  return Math.round(czk * 100);
}
