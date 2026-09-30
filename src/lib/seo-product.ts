import { originGenitive } from "@/lib/origin-flags";

type Locale = "cs" | "uk" | "ru" | "en";

const CATEGORY_PREFIX: Record<string, Record<Locale, string>> = {
  VIRGIN: { cs: "Panenské", uk: "Натуральне", ru: "Натуральные", en: "Virgin" },
  LUXE: { cs: "Luxusní", uk: "Люксове", ru: "Люксовые", en: "Luxe" },
  STANDARD: { cs: "Kvalitní", uk: "Якісне", ru: "Качественные", en: "Quality" },
  SALE: { cs: "Výprodej:", uk: "Розпродаж:", ru: "Распродажа:", en: "Sale:" },
};

const CATEGORY_DESC_PREFIX: Record<string, Record<Locale, string>> = {
  VIRGIN: { cs: "100% panenské", uk: "100% натуральне", ru: "100% натуральные", en: "100% virgin" },
  LUXE: { cs: "Luxusní", uk: "Люксове", ru: "Люксовые", en: "Luxe" },
  STANDARD: { cs: "Kvalitní", uk: "Якісне", ru: "Качественные", en: "Quality" },
  SALE: { cs: "Výprodejové", uk: "Розпродажне", ru: "Распродажные", en: "Sale" },
};

const HAIR_LABEL: Record<Locale, string> = {
  cs: "vlasy k prodloužení",
  uk: "волосся для нарощування",
  ru: "волосы для наращивания",
  en: "hair extensions",
};

const HAIR_SHORT: Record<Locale, string> = {
  cs: "vlasy",
  uk: "волосся",
  ru: "волосы",
  en: "hair",
};

const PROCESSING_CTA: Record<Locale, string> = {
  cs: "zprostředkování zpracování",
  uk: "організація обробки",
  ru: "организация обработки",
  en: "processing arrangement",
};

const PICKUP_CTA: Record<Locale, string> = {
  cs: "Osobní odběr Praha zdarma, doručení do 7 dnů",
  uk: "Безкоштовне отримання в Празі, доставка до 7 днів",
  ru: "Бесплатный самовывоз в Праге, доставка за 7 дней",
  en: "Free Prague pickup, delivery within 7 days",
};

const PREMIUM_SUFFIX: Record<Locale, string> = {
  cs: "Prémiová kvalita z přímého importu, osobní odběr Praha zdarma.",
  uk: "Преміальна якість з прямого імпорту, безкоштовне отримання в Празі.",
  ru: "Премиальное качество прямого импорта, бесплатный самовывоз в Праге.",
  en: "Premium quality direct import, free Prague pickup.",
};

const FROM_LABEL: Record<Locale, string> = {
  cs: "Od",
  uk: "Від",
  ru: "От",
  en: "From",
};

const ORIGIN_PREFIX: Record<Locale, string> = {
  cs: "z",
  uk: "з",
  ru: "из",
  en: "from",
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
  locale: string = "cs",
): string {
  const loc = (locale as Locale) || "cs";
  const hairLabel = HAIR_LABEL[loc] ?? HAIR_LABEL.cs;
  const catPrefixMap = category && CATEGORY_PREFIX[category];
  const catPrefix = catPrefixMap ? `${catPrefixMap[loc] ?? catPrefixMap.cs} ` : "";
  const textureStr = texture ? `${texture.charAt(0).toUpperCase() + texture.slice(1).toLowerCase()} ` : "";
  const lengthStr = lengths.length > 0
    ? " " + (lengths.length <= 3
      ? lengths.map((l) => `${l} cm`).join(", ")
      : `${lengths[0]}\u2013${lengths[lengths.length - 1]} cm`)
    : "";
  const colorStr = colorNames.length > 0 && colorNames.length <= 2 ? colorNames.join(", ") : "";

  // Full: "{Cat} {texture} vlasy k prodloužení {length} – {color}"
  const full = `${catPrefix}${textureStr}${hairLabel}${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (full.length <= 60) return full;

  // Shortening 1: drop category
  const noCat = `${textureStr}${hairLabel}${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (noCat.length <= 60) return noCat;

  // Shortening 2: drop texture
  const hairLabelCap = hairLabel.charAt(0).toUpperCase() + hairLabel.slice(1);
  const noTexture = `${hairLabelCap}${lengthStr}${colorStr ? ` \u2013 ${colorStr}` : ""}`;
  if (noTexture.length <= 60) return noTexture;

  // Shortening 3: shorten color to first word
  const shortColor = colorNames.length > 0 ? colorNames[0].split(/\s/)[0] : "";
  const shortened = `${hairLabelCap}${lengthStr}${shortColor ? ` \u2013 ${shortColor}` : ""}`;
  return shortened.slice(0, 60);
}

/**
 * Build SEO meta description.
 * Max 155 chars.
 */
export function buildAutoDescription(
  product: { name: string; category: string; processingType: string; origin?: string | null; texture?: string | null },
  colorNames: string[],
  lengths: number[],
  variants: Array<{ retailPricePerGram: number; sellingMode: string; retailPricePerPiece?: number | null; pricePerPiece?: number | null; availableGrams?: number }>,
  locale: string = "cs",
): string {
  const loc = (locale as Locale) || "cs";
  const catPrefix = CATEGORY_DESC_PREFIX[product.category]?.[loc] ?? CATEGORY_DESC_PREFIX[product.category]?.cs ?? "";
  const textureStr = product.texture ? ` ${product.texture.toLowerCase()}` : "";

  let originStr = "";
  if (product.origin) {
    if (loc === "cs") {
      originStr = ` z ${originGenitive(product.origin)}`;
    } else {
      originStr = ` ${ORIGIN_PREFIX[loc]} ${product.origin}`;
    }
  }

  const hairShort = HAIR_SHORT[loc] ?? HAIR_SHORT.cs;
  let part1 = `${catPrefix}${textureStr} ${hairShort}${originStr}`;
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
  if (minPpg) priceParts.push(`${FROM_LABEL[loc]} ${Math.round(minPpg / 100)} CZK/g`);
  priceParts.push(PROCESSING_CTA[loc]);

  // CTA
  const cta = PICKUP_CTA[loc];

  let result = [part1, priceParts.join(", "), cta]
    .filter(Boolean)
    .join(". ") + ".";

  if (result.length < 120) {
    result = result.replace(/\.$/, "") + ". " + PREMIUM_SUFFIX[loc];
  }

  return result.slice(0, 155);
}

function getMinPricePerGram(
  variants: Array<{ retailPricePerGram: number }>,
): number | null {
  const prices = variants
    .filter((v) => v.retailPricePerGram > 0)
    .map((v) => v.retailPricePerGram);
  return prices.length > 0 ? Math.min(...prices) : null;
}
