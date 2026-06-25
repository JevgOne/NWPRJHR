/**
 * Hair extension color code map.
 *
 * Maps industry-standard color codes to hex values and Czech names.
 */

export interface HairColor {
  hex: string;
  name: string;
}

export const HAIR_COLORS: Record<string, HairColor> = {
  "1":   { hex: "#000000", name: "Černá (Jet Black)" },
  "1B":  { hex: "#1A1A1A", name: "Přírodní černá (Off Black)" },
  "2":   { hex: "#2A1A0C", name: "Nejtmavší hnědá" },
  "3":   { hex: "#3E2512", name: "Tmavě hnědá" },
  "4":   { hex: "#5C3A1E", name: "Středně hnědá" },
  "6":   { hex: "#7A5230", name: "Světle hnědá" },
  "8":   { hex: "#A07030", name: "Středně popelavě hnědá" },
  "10":  { hex: "#C49A48", name: "Světle hnědá / Tmavá blond" },
  "12":  { hex: "#D4B06A", name: "Zlatá blond" },
  "14":  { hex: "#C8A84E", name: "Tmavá blond" },
  "16":  { hex: "#C4B57A", name: "Popelavá blond" },
  "18":  { hex: "#B8A878", name: "Popelavá blond" },
  "22":  { hex: "#E8D5A8", name: "Světlá blond" },
  "24":  { hex: "#DCC06A", name: "Zlatá blond" },
  "27":  { hex: "#D4A44C", name: "Medová blond" },
  "30":  { hex: "#A05020", name: "Světle kaštanová" },
  "33":  { hex: "#803018", name: "Tmavě kaštanová" },
  "60":  { hex: "#F0E8D4", name: "Nejsvětlejší blond" },
  "613": { hex: "#FAF0DC", name: "Platinová blond" },
  "99J": { hex: "#6A0028", name: "Burgundská" },
};

const FALLBACK: HairColor = { hex: "#9CA3AF", name: "Ostatní" };

/**
 * Returns hex color and Czech name for a hair color code.
 * Falls back to a neutral gray for unknown codes.
 */
export function getHairColor(code: string): HairColor {
  return HAIR_COLORS[code.toUpperCase()] ?? HAIR_COLORS[code] ?? FALLBACK;
}
