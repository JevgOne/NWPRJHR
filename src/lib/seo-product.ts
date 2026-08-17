import { originGenitive } from "@/lib/origin-flags";

const CATEGORY_PREFIX: Record<string, string> = {
  VIRGIN: "Panenské",
  LUXE: "Luxusní",
  STANDARD: "Kvalitní",
  SALE: "Výprodej:",
};

const CATEGORY_DESC_PREFIX: Record<string, string> = {
  VIRGIN: "100% panenské",
  LUXE: "Luxusní",
  STANDARD: "Kvalitní",
  SALE: "Výprodejové",
};

/**
 * Build SEO title with category prefix.
 * Priority shortening: 1. drop category, 2. drop texture, 3. shorten color
 * Max 60 chars.
 */
export function buildSeoTitle(
  texture: string | null,
  lengths: number[],
  colorNames: string[],
  category?: string | null,
): string {
  const catPrefix = category && CATEGORY_PREFIX[category] ? `${CATEGORY_PREFIX[category]} ` : "";
  const textureStr = texture ? `${texture.charAt(0).toUpperCase() + texture.slice(1).toLowerCase()} ` : "";
  const lengthStr = lengths.length > 0
    ? " " + (lengths.length <= 3
      ? lengths.map((l) => `${l} cm`).join(", ")
      : `${lengths[0]}\u2013${lengths[lengths.length - 1]} cm`)
    : "";
  const colorStr = colorNames.length > 0 && colorNames.length <= 2 ? colorNames.join(", ") : "";

  // Full: "{Cat} {texture} vlasy k prodloužení {length} – {color}"
  const full = `${catPrefix}${textureStr}vlasy k prodloužení${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (full.length <= 60) return full;

  // Shortening 1: drop category
  const noCat = `${textureStr}vlasy k prodloužení${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (noCat.length <= 60) return noCat;

  // Shortening 2: drop texture
  const noTexture = `Vlasy k prodloužení${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (noTexture.length <= 60) return noTexture;

  // Shortening 3: shorten color to first word
  const shortColor = colorNames.length > 0 ? colorNames[0].split(/\s/)[0] : "";
  const shortened = `Vlasy k prodloužení${lengthStr}${shortColor ? ` \u2013 ${shortColor}` : ""}`;
  return shortened.slice(0, 60);
}

/**
 * Build SEO meta description.
 * Format: "{Cat} {texture} vlasy z {origin}, {length}, {color}. Od {price} Kč/g, zpracování na zakázku. Osobní odběr Praha zdarma, doručení do 7 dnů."
 * Max 155 chars.
 */
export function buildAutoDescription(
  product: { name: string; category: string; processingType: string; origin?: string | null; texture?: string | null },
  colorNames: string[],
  lengths: number[],
  variants: Array<{ retailPricePerGram: number; sellingMode: string; retailPricePerPiece?: number | null; pricePerPiece?: number | null; availableGrams?: number }>,
): string {
  const catPrefix = CATEGORY_DESC_PREFIX[product.category] ?? "";
  const textureStr = product.texture ? ` ${product.texture.toLowerCase()}` : "";
  const originStr = product.origin ? ` z ${originGenitive(product.origin)}` : "";

  let part1 = `${catPrefix}${textureStr} vlasy${originStr}`;
  // Capitalize first letter
  part1 = part1.charAt(0).toUpperCase() + part1.slice(1).trimStart();

  const specs: string[] = [];
  if (lengths.length > 0) {
    specs.push(
      lengths.length <= 3
        ? lengths.map((l) => `${l} cm`).join(", ")
        : `${lengths[0]}\u2013${lengths[lengths.length - 1]} cm`
    );
  }
  if (colorNames.length > 0 && colorNames.length <= 3) {
    specs.push(colorNames.join(", "));
  }
  if (specs.length > 0) part1 += ", " + specs.join(", ");

  // Price
  const priceParts: string[] = [];
  const minPpg = getMinPricePerGram(variants);
  if (minPpg) priceParts.push(`Od ${Math.round(minPpg / 100)} Kč/g`);
  priceParts.push("zpracování na zakázku");

  // CTA
  const cta = "Osobní odběr Praha zdarma, doručení do 7 dnů";

  const result = [part1, priceParts.join(", "), cta]
    .filter(Boolean)
    .join(". ") + ".";

  return result.slice(0, 155);
}

function getMinPricePerGram(
  variants: Array<{ retailPricePerGram: number; sellingMode: string }>,
): number | null {
  const prices = variants
    .filter((v) => v.sellingMode !== "BY_PIECE" && v.retailPricePerGram > 0)
    .map((v) => v.retailPricePerGram);
  return prices.length > 0 ? Math.min(...prices) : null;
}
