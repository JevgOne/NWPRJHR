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
  "1":  { hex: "#FAF0DC", nameKey: "c1" },
  "2":  { hex: "#E8D5A8", nameKey: "c2" },
  "3":  { hex: "#D4B06A", nameKey: "c3" },
  "4":  { hex: "#C49A48", nameKey: "c4" },
  "5":  { hex: "#A07030", nameKey: "c5" },
  "6":  { hex: "#7A5230", nameKey: "c6" },
  "7":  { hex: "#5C3A1E", nameKey: "c7" },
  "8":  { hex: "#3E2512", nameKey: "c8" },
  "9":  { hex: "#2A1A0C", nameKey: "c9" },
  "10": { hex: "#0F0A06", nameKey: "c10" },
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
