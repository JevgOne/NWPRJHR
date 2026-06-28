/**
 * Hair extension color palette.
 *
 * Simple 1–10 scale from platinum blonde to black,
 * matching the gradient on the homepage.
 */

export interface HairColor {
  hex: string;
  /** i18n key under public.colors (e.g. "c1" -> t("colors.c1")) */
  nameKey: string;
}

export const HAIR_COLORS: Record<string, HairColor> = {
  "1":  { hex: "#F5E6C8", nameKey: "c1" },
  "2":  { hex: "#E6C47C", nameKey: "c2" },
  "3":  { hex: "#D4A84B", nameKey: "c3" },
  "4":  { hex: "#C08A3E", nameKey: "c4" },
  "5":  { hex: "#A0673A", nameKey: "c5" },
  "6":  { hex: "#8B5E3C", nameKey: "c6" },
  "7":  { hex: "#6B4226", nameKey: "c7" },
  "8":  { hex: "#4A2912", nameKey: "c8" },
  "9":  { hex: "#2C1608", nameKey: "c9" },
  "10": { hex: "#1A0E05", nameKey: "c10" },
};

/** Ordered list of all color codes for display */
export const COLOR_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const FALLBACK: HairColor = { hex: "#9CA3AF", nameKey: "other" };

/**
 * Returns hex color and i18n nameKey for a hair color code.
 * Falls back to a neutral gray for unknown codes.
 */
export function getHairColor(code: string): HairColor {
  return HAIR_COLORS[code] ?? FALLBACK;
}
