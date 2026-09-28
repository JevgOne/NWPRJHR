/**
 * Industry-standard hair extension color palette.
 *
 * Codes follow the universal numbering system used by
 * Remypatra, Great Lengths, and other major suppliers.
 * Ordered from darkest to lightest, then specials.
 */

export interface HairColor {
  hex: string;
  /** i18n key under public.colors (e.g. "c1" -> t("colors.c1")) */
  nameKey: string;
}

export const HAIR_COLORS: Record<string, HairColor> = {
  // ── Blacks ──
  "1":    { hex: "#090806", nameKey: "c1" },
  "1B":   { hex: "#1C1512", nameKey: "c1B" },

  // ── Browns ──
  "2":    { hex: "#2C1B11", nameKey: "c2" },
  "3":    { hex: "#3B2314", nameKey: "c3" },
  "4":    { hex: "#4B3621", nameKey: "c4" },
  "5":    { hex: "#5A4232", nameKey: "c5" },
  "6":    { hex: "#71543D", nameKey: "c6" },
  "7":    { hex: "#8B7355", nameKey: "c7" },
  "8":    { hex: "#6F4A2B", nameKey: "c8" },
  "10":   { hex: "#8B6B3E", nameKey: "c10" },
  "12":   { hex: "#A08050", nameKey: "c12" },

  // ── Blondes ──
  "14":   { hex: "#B89B6A", nameKey: "c14" },
  "16":   { hex: "#C5A870", nameKey: "c16" },
  "18":   { hex: "#BDA88E", nameKey: "c18" },
  "24":   { hex: "#DBC07C", nameKey: "c24" },
  "27":   { hex: "#DDA15E", nameKey: "c27" },
  "613":  { hex: "#F0E2C8", nameKey: "c613" },
  "BL22": { hex: "#E8D5A8", nameKey: "cBL22" },
  "BL60": { hex: "#F0E8DC", nameKey: "cBL60" },

  // ── Reds / Auburn ──
  "30":   { hex: "#9A4B28", nameKey: "c30" },
  "33":   { hex: "#6B2A1A", nameKey: "c33" },
  "35":   { hex: "#A43820", nameKey: "c35" },
  "99J":  { hex: "#4A1A2E", nameKey: "c99J" },

  // ── Special ──
  "ombre": { hex: "#C8A87C", nameKey: "combre" },
  "grey":  { hex: "#B8B5B0", nameKey: "cgrey" },
};

/** Ordered list of all color codes for display (dark → light, then specials) */
export const COLOR_CODES = [
  // Blacks
  "1", "1B",
  // Browns
  "2", "3", "4", "5", "6", "7", "8", "10", "12",
  // Blondes
  "14", "16", "18", "24", "27", "613", "BL22", "BL60",
  // Reds / Auburn
  "30", "33", "35", "99J",
  // Special
  "ombre", "grey",
];

/** Group structure for visual display */
export const COLOR_GROUPS = [
  { label: "Black", codes: ["1", "1B"] },
  { label: "Brown", codes: ["2", "3", "4", "5", "6", "7", "8", "10", "12"] },
  { label: "Blonde", codes: ["14", "16", "18", "24", "27", "613", "BL22", "BL60"] },
  { label: "Red / Auburn", codes: ["30", "33", "35", "99J"] },
  { label: "Special", codes: ["ombre", "grey"] },
];

/**
 * Mapping from OLD internal codes to NEW industry codes.
 * Used for migrating existing product data.
 */
export const OLD_TO_NEW_COLOR_MAP: Record<string, string> = {
  "1":  "613",   // old "Platinová blond" → 613 Platinum Blonde
  "2":  "24",    // old "Světlá blond" → 24 Golden Blonde
  "3":  "16",    // old "Zlatá blond" → 16 Honey Blonde
  "4":  "14",    // old "Medová blond" → 14 Dark Blonde
  "5":  "10",    // old "Karamelová" → 10 Medium Golden Brown
  // "6" stays "6" — Light Brown in both systems
  "7":  "5",     // old "Středně hnědá" → 5 Medium Brown
  "8":  "3",     // old "Tmavě hnědá" → 3 Dark Brown
  "9":  "1B",    // old "Kaštanová" → 1B Off Black
  "10": "1",     // old "Černá" → 1 Jet Black
  // "ombre" stays "ombre"
  // "grey" stays "grey"
};

const FALLBACK: HairColor = { hex: "#9CA3AF", nameKey: "other" };

/**
 * Returns hex color and i18n nameKey for a hair color code.
 * Falls back to a neutral gray for unknown codes.
 */
export function getHairColor(code: string): HairColor {
  return HAIR_COLORS[code] ?? FALLBACK;
}
