import { roundHalereUp } from "./rounding";

/**
 * Calculate retail price from wholesale price + category markup.
 * All amounts in halere (integer).
 *
 * Formula: retailPrice = wholesalePrice * (1 + markupPercent / 100)
 * Then round halere UP to whole CZK.
 */
export function calculateRetailPrice(
  wholesalePriceHalere: number,
  markupPercent: number
): number {
  const raw = wholesalePriceHalere * (1 + markupPercent / 100);
  return roundHalereUp(raw);
}

/**
 * Format halere to CZK display string.
 * 123500 -> "1 235 Kc"
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
