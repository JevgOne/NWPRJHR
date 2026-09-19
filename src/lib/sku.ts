export const SKU_CATEGORY_MAP: Record<string, string> = {
  VIRGIN: "V",
  LUXE: "L",
  STANDARD: "S",
  SALE: "X",
  ACCESSORY: "A",
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

export const SKU_ORIGIN_MAP: Record<string, string> = {
  "Ukrajina": "UA",
  "Bělorusko": "BY",
  "Moldavsko": "MD",
  "Rusko": "RU",
  "Kazachstán": "KZ",
  "Uzbekistán": "UZ",
  "Turecko": "TR",
  "Írán": "IR",
  "Indie": "IN",
  "Vietnam": "VN",
  "Sýrie": "SY",
  "Čína": "CN",
  "Mongolsko": "MN",
  "Gruzie": "GE",
  "Mix": "MX",
};
export const SKU_ORIGIN_REVERSE = Object.fromEntries(
  Object.entries(SKU_ORIGIN_MAP).map(([k, v]) => [v, k])
);

export function generateSku(
  category: string,
  texture: string | null | undefined,
  color: string,
  lengthCm: number,
  options?: { orderOnly?: boolean; origin?: string | null },
): string {
  const cat = SKU_CATEGORY_MAP[category] ?? "?";
  const tex = texture ? (SKU_TEXTURE_MAP[texture] ?? "XX") : "XX";
  const col = color.padStart(2, "0");
  const len = String(lengthCm);

  if (options?.orderOnly) {
    const orig = options.origin ? (SKU_ORIGIN_MAP[options.origin] ?? "XX") : "XX";
    return `OBJ-${cat}-${orig}-${tex}-${col}-${len}`;
  }

  return `${cat}-${tex}-${col}-${len}`;
}

/**
 * Find the next global sequence number across all variants.
 * Looks at all SKUs ending with a 5-digit number and returns max + 1.
 */
async function nextGlobalSeq(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any,
): Promise<number> {
  const variants = await prismaClient.variant.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });

  let maxSeq = 0;
  for (const v of variants) {
    const match = (v.sku as string | null)?.match(/-(\d{5})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return maxSeq + 1;
}

/**
 * Generate a unique SKU for a variant.
 * Format: {base}-{00001} where the 5-digit number is a global sequence.
 */
export async function uniqueSku(
  category: string,
  texture: string | null | undefined,
  color: string,
  lengthCm: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any,
  options?: { orderOnly?: boolean; origin?: string | null },
): Promise<string> {
  const base = generateSku(category, texture, color, lengthCm, options);
  const seq = await nextGlobalSeq(prismaClient);
  return `${base}-${String(seq).padStart(5, "0")}`;
}

export function parseSku(sku: string): {
  category: string;
  texture: string;
  color: string;
  lengthCm: number;
  seq?: number;
  orderOnly?: boolean;
  origin?: string;
} | null {
  const parts = sku.split("-");

  // Order-only format: OBJ-L-UA-RV-09-60-00001 (7 parts) or OBJ-L-UA-RV-09-60 (6 parts)
  if (parts[0] === "OBJ" && (parts.length === 6 || parts.length === 7)) {
    const [, cat, orig, tex, col, len] = parts;
    const category = SKU_CATEGORY_REVERSE[cat];
    const origin = SKU_ORIGIN_REVERSE[orig];
    const texture = SKU_TEXTURE_REVERSE[tex];
    const lengthCm = parseInt(len);
    if (!category || !texture || isNaN(lengthCm)) return null;
    const seq = parts.length === 7 ? parseInt(parts[6], 10) : undefined;
    return { category, texture, color: col, lengthCm, orderOnly: true, origin, seq };
  }

  // Standard format: L-RV-09-60-00001 (5 parts) or L-RV-09-60 (4 parts, legacy)
  if (parts.length === 4 || parts.length === 5) {
    const [cat, tex, col, len] = parts;
    const category = SKU_CATEGORY_REVERSE[cat];
    const texture = SKU_TEXTURE_REVERSE[tex];
    const lengthCm = parseInt(len);
    if (!category || !texture || isNaN(lengthCm)) return null;
    const parsed = parseInt(col);
    const seq = parts.length === 5 ? parseInt(parts[4], 10) : undefined;
    return { category, texture, color: isNaN(parsed) ? col : String(parsed), lengthCm, seq };
  }

  return null;
}
