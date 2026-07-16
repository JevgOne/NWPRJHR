export const SKU_CATEGORY_MAP: Record<string, string> = {
  VIRGIN: "V",
  LUXE: "L",
  STANDARD: "S",
  SALE: "X",
};
export const SKU_CATEGORY_REVERSE = Object.fromEntries(
  Object.entries(SKU_CATEGORY_MAP).map(([k, v]) => [v, k])
);

export const SKU_TEXTURE_MAP: Record<string, string> = {
  "Rovné": "RV",
  "Mírně vlnité": "MV",
  "Vlnité": "VL",
  "Kudrnaté": "KU",
};
export const SKU_TEXTURE_REVERSE = Object.fromEntries(
  Object.entries(SKU_TEXTURE_MAP).map(([k, v]) => [v, k])
);

export function generateSku(
  category: string,
  texture: string | null | undefined,
  color: string,
  lengthCm: number,
): string {
  const cat = SKU_CATEGORY_MAP[category] ?? "?";
  const tex = texture ? (SKU_TEXTURE_MAP[texture] ?? "XX") : "XX";
  const col = color.padStart(2, "0");
  const len = String(lengthCm);
  return `${cat}-${tex}-${col}-${len}`;
}

export function parseSku(sku: string): {
  category: string;
  texture: string;
  color: string;
  lengthCm: number;
} | null {
  const parts = sku.split("-");
  if (parts.length !== 4) return null;
  const [cat, tex, col, len] = parts;
  const category = SKU_CATEGORY_REVERSE[cat];
  const texture = SKU_TEXTURE_REVERSE[tex];
  const lengthCm = parseInt(len);
  if (!category || !texture || isNaN(lengthCm)) return null;
  return { category, texture, color: String(parseInt(col)), lengthCm };
}
