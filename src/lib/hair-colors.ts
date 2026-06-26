/**
 * Hair extension color palette.
 *
 * Simple 1–10 scale from platinum blonde to black,
 * matching the gradient on the homepage.
 */

export interface HairColor {
  hex: string;
  name: string;
}

export const HAIR_COLORS: Record<string, HairColor> = {
  "1":  { hex: "#FAF0DC", name: "Platinová" },
  "2":  { hex: "#E8D5A8", name: "Světlá blond" },
  "3":  { hex: "#D4B06A", name: "Zlatá blond" },
  "4":  { hex: "#C49A48", name: "Medová" },
  "5":  { hex: "#A07030", name: "Karamelová" },
  "6":  { hex: "#7A5230", name: "Světle hnědá" },
  "7":  { hex: "#5C3A1E", name: "Středně hnědá" },
  "8":  { hex: "#3E2512", name: "Tmavě hnědá" },
  "9":  { hex: "#2A1A0C", name: "Tmavá" },
  "10": { hex: "#0F0A06", name: "Černá" },
};

/** Ordered list of all color codes for display */
export const COLOR_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const FALLBACK: HairColor = { hex: "#9CA3AF", name: "Ostatní" };

/**
 * Returns hex color and Czech name for a hair color code.
 * Falls back to a neutral gray for unknown codes.
 */
export function getHairColor(code: string): HairColor {
  return HAIR_COLORS[code] ?? FALLBACK;
}
