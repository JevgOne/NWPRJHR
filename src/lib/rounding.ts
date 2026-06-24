/**
 * Centralized rounding for the entire application.
 * Rule: Halere round UP to whole CZK.
 */

/** Round halere UP to next whole CZK. Already-whole amounts stay. */
export function roundHalereUp(halere: number): number {
  return Math.ceil(halere / 100) * 100;
}

/** Convert CZK (possibly with halere) to display integer CZK, rounding UP */
export function toWholeCZK(czk: number): number {
  return Math.ceil(czk);
}
