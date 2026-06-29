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

const CATEGORY_LABEL: Record<string, string> = {
  VIRGIN: "Panensk\u00e9 vlasy",
  PREMIUM: "Premium vlasy",
  STANDARD: "Standard vlasy",
  SALE: "V\u00fdprodej",
};

const CATEGORY_BENEFITS: Record<string, string[]> = {
  VIRGIN: [
    "\u2705 100% p\u0159\u00edrodn\u00ed, nezpracovan\u00e9 vlasy",
    "\u2705 Zachovan\u00e1 kutikulov\u00e1 vrstva \u2014 maxim\u00e1ln\u00ed lesk",
    "\u2705 Vydr\u017e\u00ed 1\u20132 roky p\u0159i spr\u00e1vn\u00e9 p\u00e9\u010di",
    "\u2705 Lze barvit, stri\u017ehat i natá\u010det",
    "\u2705 P\u0159irozen\u00fd pohyb a hebkost",
  ],
  PREMIUM: [
    "\u2705 Vysoce kvalitn\u00ed vlasy s p\u0159irozen\u00fdm vzhledem",
    "\u2705 Skv\u011bl\u00fd pom\u011br cena/v\u00fdkon",
    "\u2705 Vydr\u017e\u00ed 12\u201318 m\u011bs\u00edc\u016f",
    "\u2705 Jemn\u00e9 na dotek, snadn\u00e1 \u00fadr\u017eba",
    "\u2705 Lze stri\u017ehat a tvarovat",
  ],
  STANDARD: [
    "\u2705 V\u00fdborn\u00fd pom\u011br cena/kvalita",
    "\u2705 P\u0159irozen\u00fd vzhled a snadn\u00e1 \u00fadr\u017eba",
    "\u2705 Vydr\u017e\u00ed 6\u201312 m\u011bs\u00edc\u016f",
    "\u2705 Dostupn\u00e9 ve v\u00edce d\u00e9lk\u00e1ch a odst\u00ednech",
  ],
  SALE: [
    "\u{1F525} Zv\u00fdhodn\u011bn\u00e1 cena \u2014 sleva na sklad!",
    "\u2705 Omezen\u00e9 mno\u017estv\u00ed",
    "\u2705 Stejn\u00e1 kvalita za ni\u017e\u0161\u00ed cenu",
  ],
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
    minPriceKc: minPrice != null ? Math.round(minPrice / 100) : null,
  };
}

function buildProductUrl(product: { id: string; slug?: string | null }): string {
  return `https://www.hairland.cz/offer/${product.slug ?? product.id}`;
}

function getProcessingLabel(type: string): string | null {
  const label = PROCESSING_LABEL[type];
  if (label) return label;
  if (type === "OTHER") return null;
  return type.replace(/_/g, "-");
}

function getTextureLabel(texture: string | null | undefined): string | null {
  if (!texture) return null;
  return texture;
}

export function generateInstagramPost(product: PostProductData): string {
  const emoji = CATEGORY_EMOJI[product.category] ?? "\u{2728}";
  const catLabel = CATEGORY_LABEL[product.category] ?? product.name;
  const processing = getProcessingLabel(product.processingType);
  const texture = getTextureLabel(product.texture);
  const stats = getProductStats(product.variants);
  const benefits = CATEGORY_BENEFITS[product.category] ?? CATEGORY_BENEFITS.STANDARD;
  const url = buildProductUrl(product);

  const lines: string[] = [];

  // Header
  lines.push(`${emoji} ${catLabel} ${emoji}`);
  if (texture) {
    lines.push(`${texture}${processing ? ` | ${processing}` : ""}`);
  } else if (processing) {
    lines.push(processing);
  }
  lines.push("");

  // Stats
  if (stats) {
    if (stats.minLength !== stats.maxLength) {
      lines.push(`\u{1F4CF} D\u00e9lky: ${stats.minLength}\u2013${stats.maxLength} cm`);
    } else {
      lines.push(`\u{1F4CF} D\u00e9lka: ${stats.minLength} cm`);
    }
    if (stats.colorCount > 0) {
      lines.push(`\u{1F3A8} ${stats.colorCount} odst\u00edn\u016f na v\u00fdb\u011br`);
    }
    if (stats.minPriceKc != null) {
      lines.push(`\u{1F4B0} od ${stats.minPriceKc} K\u010d/g`);
    }
    lines.push("");
  }

  // Benefits
  lines.push(...benefits);
  lines.push("");

  // Delivery & availability
  lines.push("\u{1F4CD} Osobn\u00ed odb\u011br v Praze \u2014 ZDARMA");
  lines.push("\u{1F4AC} Bezplatn\u00e1 konzultace p\u0159i v\u00fdb\u011bru");
  lines.push("\u{1F4E6} Mo\u017enost z\u00e1silky po cel\u00e9 \u010cR");
  lines.push("");

  // CTA
  lines.push("\u{1F449} V\u00edce info a objedn\u00e1n\u00ed:");
  lines.push(url);
  lines.push("\u{1F4F1} +420 608 553 103");
  lines.push("");

  // Hashtags
  const tags = [
    "#hairland", "#hairlandcz", "#vlasy", "#prodlouzenivlasu",
    "#hairextensions", "#remyhair", "#naturalhair",
  ];
  if (product.category === "VIRGIN") tags.push("#virginhair", "#panenskevlasy");
  if (product.category === "PREMIUM") tags.push("#premiumhair", "#premiumvlasy");
  if (processing) {
    const procTag = `#${processing.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    tags.push(procTag);
  }
  if (texture) {
    const texTag = `#${texture.toLowerCase().replace(/[^a-z0-9\u00e9\u00ed\u00e1\u00e8\u0159\u0161\u017e\u00fa\u016f\u00fd\u010d]/g, "")}vlasy`;
    tags.push(texTag);
  }
  tags.push(
    "#vlasyprodlouzeni", "#praha", "#kadernictvi",
    "#kadernice", "#krasa", "#beauty", "#hair",
    "#hairstyle", "#longhair", "#hairgoals",
    "#czechhair", "#kvalitni vlasy",
  );
  lines.push(tags.join(" "));

  return lines.join("\n");
}

export function generateFacebookPost(product: PostProductData): string {
  const emoji = CATEGORY_EMOJI[product.category] ?? "\u{2728}";
  const catLabel = CATEGORY_LABEL[product.category] ?? product.name;
  const processing = getProcessingLabel(product.processingType);
  const texture = getTextureLabel(product.texture);
  const stats = getProductStats(product.variants);
  const benefits = CATEGORY_BENEFITS[product.category] ?? CATEGORY_BENEFITS.STANDARD;
  const url = buildProductUrl(product);

  const lines: string[] = [];

  // Header
  lines.push(`${emoji} Nov\u00e9 na sklad\u011b: ${catLabel}!`);
  lines.push("");

  // Description
  const descParts: string[] = [];
  if (texture) descParts.push(texture.toLowerCase());
  if (processing) descParts.push(processing.toLowerCase());
  if (descParts.length > 0) {
    lines.push(`Pr\u00e1v\u011b naskladn\u011bno \u2014 ${descParts.join(", ")} vlasy v \u0161pi\u010dkov\u00e9 kvalit\u011b.`);
  } else {
    lines.push(`Pr\u00e1v\u011b naskladn\u011bno \u2014 vlasy v \u0161pi\u010dkov\u00e9 kvalit\u011b.`);
  }
  lines.push("");

  // Stats
  if (stats) {
    if (stats.minLength !== stats.maxLength) {
      lines.push(`\u{1F4CF} D\u00e9lky: ${stats.minLength}\u2013${stats.maxLength} cm`);
    } else {
      lines.push(`\u{1F4CF} D\u00e9lka: ${stats.minLength} cm`);
    }
    if (stats.colorCount > 0) {
      lines.push(`\u{1F3A8} ${stats.colorCount} odst\u00edn\u016f na v\u00fdb\u011br`);
    }
    if (stats.minPriceKc != null) {
      lines.push(`\u{1F4B0} Cena od ${stats.minPriceKc} K\u010d/g`);
    }
    lines.push("");
  }

  // Benefits
  lines.push("Co z\u00edsk\u00e1te:");
  lines.push(...benefits);
  lines.push("");

  // Delivery & availability
  lines.push("\u{1F4CD} Osobn\u00ed odb\u011br v Praze \u2014 ZDARMA");
  lines.push("\u{1F4AC} R\u00e1di porad\u00edme s v\u00fdb\u011brem \u2014 napi\u0161te n\u00e1m!");
  lines.push("\u{1F4E6} Mo\u017enost z\u00e1silky po cel\u00e9 \u010cR");
  lines.push("");

  // CTA
  lines.push(`\u{1F449} Objednejte zde: ${url}`);
  lines.push(`\u{1F4F1} Telefon: +420 608 553 103`);
  lines.push("");

  // Hashtags
  lines.push("#hairland #vlasy #prodlouzenivlasu #hairextensions #remyhair #praha #kadernictvi #beauty #longhair");

  return lines.join("\n");
}
