import { getOriginFlag } from "./origin-flags";

interface PostProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  id: string;
  slug?: string | null;
  variants?: Array<{
    lengthCm: number;
    color: string;
    retailPricePerGram?: number;
    active: boolean;
  }>;
}

const CATEGORY_EMOJI: Record<string, string> = {
  VIRGIN: "\u{1F451}",
  PREMIUM: "\u{1F48E}",
  STANDARD: "\u{2728}",
  SALE: "\u{1F525}",
};

const PROCESSING_LABEL: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratin\u00e9",
  WEFT: "Tresov\u00e9",
  MICRO_RING: "Micro ring",
};

function getProductStats(variants: PostProductData["variants"]) {
  const active = (variants ?? []).filter((v) => v.active);
  if (active.length === 0) return null;

  const lengths = [...new Set(active.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );
  const colors = new Set(active.map((v) => v.color));
  const prices = active
    .map((v) => v.retailPricePerGram)
    .filter((p): p is number => p != null && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  return {
    minLength: lengths[0],
    maxLength: lengths[lengths.length - 1],
    colorCount: colors.size,
    // prices are in hal\u00e9\u0159e, convert to K\u010d
    minPriceKc: minPrice != null ? Math.round(minPrice / 100) : null,
  };
}

function buildProductUrl(product: { id: string; slug?: string | null }): string {
  return `https://www.hairland.cz/offer/${product.slug ?? product.id}`;
}

export function generateInstagramPost(product: PostProductData): string {
  const emoji = CATEGORY_EMOJI[product.category] ?? "\u{2728}";
  const processing =
    PROCESSING_LABEL[product.processingType] ??
    product.processingType.replace(/_/g, "-");
  const stats = getProductStats(product.variants);
  const flag = product.origin ? getOriginFlag(product.origin) : "";
  const originText = product.origin ? `${flag} ${product.origin}` : "";
  const url = buildProductUrl(product);

  const lines: string[] = [];
  lines.push(`${emoji} ${product.name}`);
  lines.push("");

  const infoParts = [processing];
  if (product.texture) infoParts.push(product.texture);
  if (originText) infoParts.push(originText);
  lines.push(infoParts.join(" | "));

  if (stats) {
    if (stats.minLength !== stats.maxLength) {
      lines.push(
        `\u{1F4CF} D\u00e9lky: ${stats.minLength}\u2013${stats.maxLength} cm`
      );
    } else {
      lines.push(`\u{1F4CF} D\u00e9lka: ${stats.minLength} cm`);
    }
    if (stats.colorCount > 0) {
      lines.push(`\u{1F3A8} ${stats.colorCount} odst\u00edn\u016f`);
    }
    if (stats.minPriceKc != null) {
      lines.push(`\u{1F4B0} od ${stats.minPriceKc} K\u010d/g`);
    }
  }

  lines.push("");
  lines.push("\u{1F4E6} Skladem v Praze");
  lines.push("\u{1F69A} Osobn\u00ed odb\u011Br i z\u00e1silka");
  lines.push("");
  lines.push(`\u{1F449} ${url}`);
  lines.push("");

  // hashtags
  const tags = ["#hairland", "#vlasy", "#prodlouzenivlasu", "#hairextensions"];
  const catTag = `#${product.category.toLowerCase()}hair`;
  tags.push(catTag);
  const procTag = `#${processing.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  tags.push(procTag);
  tags.push(
    "#vlasyprodlouzeni",
    "#praha",
    "#kadernictvi",
    "#krasa",
    "#beauty"
  );
  lines.push(tags.join(" "));

  return lines.join("\n");
}

export function generateFacebookPost(product: PostProductData): string {
  const emoji = CATEGORY_EMOJI[product.category] ?? "\u{2728}";
  const processing =
    PROCESSING_LABEL[product.processingType] ??
    product.processingType.replace(/_/g, "-");
  const stats = getProductStats(product.variants);
  const flag = product.origin ? getOriginFlag(product.origin) : "";
  const originText = product.origin ? `${flag} ${product.origin}` : "";
  const url = buildProductUrl(product);

  const lines: string[] = [];
  lines.push(`${emoji} Nov\u00e9 na sklad\u011b: ${product.name}!`);
  lines.push("");

  const infoParts = [processing];
  if (product.texture) infoParts.push(product.texture);
  if (originText) infoParts.push(originText);
  lines.push(infoParts.join(" | "));

  lines.push("");

  if (stats) {
    if (stats.minLength !== stats.maxLength) {
      lines.push(
        `\u{1F4CF} D\u00e9lky: ${stats.minLength}\u2013${stats.maxLength} cm`
      );
    } else {
      lines.push(`\u{1F4CF} D\u00e9lka: ${stats.minLength} cm`);
    }
    if (stats.colorCount > 0) {
      lines.push(
        `\u{1F3A8} ${stats.colorCount} odst\u00edn\u016f na v\u00fdb\u011br`
      );
    }
    if (stats.minPriceKc != null) {
      lines.push(`\u{1F4B0} Cena od ${stats.minPriceKc} K\u010d/g`);
    }
  }

  lines.push("");
  lines.push(
    "\u2705 Skladem, expedice do 24h"
  );
  lines.push(
    "\u{1F4CD} Osobn\u00ed odb\u011Br Praha | z\u00e1silka po cel\u00e9 \u010cR"
  );
  lines.push("");
  lines.push(`Objednejte zde \u{1F449} ${url}`);
  lines.push("");
  lines.push(
    "#hairland #vlasy #prodlouzenivlasu #hairextensions"
  );

  return lines.join("\n");
}
