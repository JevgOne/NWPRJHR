/**
 * Convert text to URL-safe slug.
 * Handles Czech/Ukrainian diacritics via NFD normalization.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map color code → CZ color name for slug */
const COLOR_SLUG_MAP: Record<string, string> = {
  "1": "Platinová blond", "2": "Světlá blond", "3": "Zlatá blond",
  "4": "Medová blond", "5": "Karamelová", "6": "Světle hnědá",
  "7": "Středně hnědá", "8": "Tmavě hnědá", "9": "Kaštanová",
  "10": "Černá", "ombre": "Ombre",
};

/**
 * Builds product slug: {category}-{origin}-{texture}-{colorTone}-{lengthCm}cm
 * Example: luxe-ukrajina-rovne-svetle-hneda-60cm
 */
export function buildProductSlug(params: {
  category: string;
  origin?: string | null;
  texture?: string | null;
  colorTone?: string | null;
  colorCode?: string | null;
  lengthCm?: number | null;
}): string {
  const parts = [params.category];
  if (params.origin) parts.push(params.origin);
  if (params.texture) parts.push(params.texture);

  const colorText = params.colorTone
    ?? (params.colorCode ? COLOR_SLUG_MAP[params.colorCode] : null);
  if (colorText) parts.push(colorText);

  if (params.lengthCm && params.lengthCm > 0) parts.push(`${params.lengthCm}cm`);

  return slugify(parts.join("-"));
}

/**
 * Async unique slug with -2, -3 suffix.
 * excludeId: skip this product's own slug when checking uniqueness.
 * Accepts any object with product.findUnique (Prisma client).
 */
export async function uniqueSlug(
  base: string,
  db: { product: { findUnique: (args: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null> } },
  excludeId?: string,
): Promise<string> {
  const slug = slugify(base);
  const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!existing || existing.id === excludeId) return slug;
  for (let i = 2; i <= 200; i++) {
    const candidate = `${slug}-${i}`;
    const found = await db.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === excludeId) return candidate;
  }
  return `${slug}-${Date.now()}`;
}
