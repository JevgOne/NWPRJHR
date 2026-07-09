// === COLOR TONE ===
export const COLOR_TONE_SLUG_MAP: Record<string, string> = {
  "blond": "Blond",
  "hneda": "Hnědá",
  "tmave-hneda": "Tmavě hnědá",
  "zrzava": "Zrzavá",
};
export const COLOR_TONE_REVERSE_MAP = Object.fromEntries(
  Object.entries(COLOR_TONE_SLUG_MAP).map(([k, v]) => [v, k])
);

// === TEXTURE ===
export const TEXTURE_SLUG_MAP: Record<string, string> = {
  "rovne": "Rovné",
  "mirne-vlnite": "Mírně vlnité",
  "vlnite": "Vlnité",
  "kudrnate": "Kudrnaté",
};
export const TEXTURE_REVERSE_MAP = Object.fromEntries(
  Object.entries(TEXTURE_SLUG_MAP).map(([k, v]) => [v, k])
);

// === CATEGORY (product quality) ===
export const CATEGORY_SLUG_MAP_SEO: Record<string, string> = {
  "virgin": "VIRGIN",
  "premium": "PREMIUM",
  "standard": "STANDARD",
};

// === PROCESSING TYPE ===
export const PROCESSING_SLUG_MAP: Record<string, string> = {
  "clip-in": "CLIP_IN",
  "tape-in": "TAPE_IN",
  "keratin": "KERATIN",
  "micro-ring": "MICRO_RING",
  "weft": "WEFT",
};

// === ORIGIN ===
export const ORIGIN_SLUG_MAP: Record<string, string> = {
  "ukrajina": "Ukrajina",
  "belorusko": "Bělorusko",
  "moldavsko": "Moldavsko",
  "rusko": "Rusko",
  "kazachstan": "Kazachstán",
  "uzbekistan": "Uzbekistán",
  "turecko": "Turecko",
  "iran": "Írán",
  "indie": "Indie",
  "vietnam": "Vietnam",
  "syrie": "Sýrie",
  "cina": "Čína",
  "mongolsko": "Mongolsko",
  "gruzie": "Gruzie",
};

// === LENGTH ===
export function parseLengthSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)cm$/);
  return match ? parseInt(match[1]) : null;
}

export function lengthToSlug(cm: number): string {
  return `${cm}cm`;
}

// === ATTRIBUTE TYPE DETECTION ===
export type AttributeType = "colorTone" | "texture" | "category" | "origin" | "length";

export const ATTRIBUTE_PREFIX_MAP: Record<string, AttributeType> = {
  "barva": "colorTone",
  "delka": "length",
  "textura": "texture",
  "kategorie": "category",
  "zeme": "origin",
};

export function resolveAttributeSlug(prefix: string, value: string): {
  type: AttributeType;
  dbValue: string | number;
} | null {
  const attrType = ATTRIBUTE_PREFIX_MAP[prefix];
  if (!attrType) return null;

  switch (attrType) {
    case "colorTone":
      return COLOR_TONE_SLUG_MAP[value]
        ? { type: "colorTone", dbValue: COLOR_TONE_SLUG_MAP[value] }
        : null;
    case "texture":
      return TEXTURE_SLUG_MAP[value]
        ? { type: "texture", dbValue: TEXTURE_SLUG_MAP[value] }
        : null;
    case "category":
      if (CATEGORY_SLUG_MAP_SEO[value]) {
        return { type: "category", dbValue: CATEGORY_SLUG_MAP_SEO[value] };
      }
      if (PROCESSING_SLUG_MAP[value]) {
        return { type: "category", dbValue: PROCESSING_SLUG_MAP[value] };
      }
      return null;
    case "origin":
      return ORIGIN_SLUG_MAP[value]
        ? { type: "origin", dbValue: ORIGIN_SLUG_MAP[value] }
        : null;
    case "length": {
      const cm = parseLengthSlug(value);
      return cm ? { type: "length", dbValue: cm } : null;
    }
  }
}
