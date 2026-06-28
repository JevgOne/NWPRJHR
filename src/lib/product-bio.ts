interface BioProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  lengths?: number[];
  colorCount?: number;
}

const CATEGORY_QUALITY: Record<string, string> = {
  VIRGIN: "Nejvyšší kvalita panenských vlasů — 100% neošetřené, s kompletní kutikulou zachovanou ve správném směru",
  PREMIUM: "Prémiová kvalita vlasů s jemným ošetřením, zachovanou strukturou a přirozeným vzhledem",
  STANDARD: "Skvělý poměr cena/kvalita — ošetřené vlasy s přirozeným vzhledem a spolehlivou trvanlivostí",
  SALE: "Vlasy za zvýhodněnou cenu — ideální příležitost nakoupit výhodně",
};

const PROCESSING_DESC: Record<string, string> = {
  CLIP_IN: "Clip-in metoda — snadná aplikace bez poškození vlastních vlasů, ideální pro okamžitou změnu",
  TAPE_IN: "Tape-in metoda — tenké pásky pro plochý a neviditelný spoj, pohodlné celodenní nošení",
  KERATIN: "Keratinové prodloužení — jednotlivé pramínky s keratinovou vazbou pro nejpřirozenější výsledek",
  WEFT: "Tresové prodloužení — rychlá aplikace s maximálním objemem, vhodné pro zkušené kadeřnice",
  MICRO_RING: "Micro ring metoda — šetrná aplikace bez tepla a lepidla, snadno přeaplikovatelné",
  OTHER: "",
};

const TEXTURE_DESC: Record<string, string> = {
  "Rovné": "Rovná struktura pro hladký a elegantní vzhled",
  "Mírně vlnité": "Mírně vlnitá struktura dodá jemný objem a přirozený pohyb",
  "Vlnité": "Vlnitá struktura pro romantický a objemný efekt",
  "Kudrnaté": "Kudrnatá struktura pro výrazný objem a dynamický styl",
};

export function generateProductBio(data: BioProductData): string {
  const parts: string[] = [];

  const quality = CATEGORY_QUALITY[data.category];
  if (quality) parts.push(`${quality}.`);

  const processing = PROCESSING_DESC[data.processingType];
  if (processing) parts.push(`${processing}.`);

  if (data.texture) {
    const texDesc = TEXTURE_DESC[data.texture];
    if (texDesc) {
      parts.push(`${texDesc}.`);
    }
  }

  if (data.origin) {
    parts.push(`Původ: ${data.origin}.`);
  }

  if (data.lengths && data.lengths.length > 0) {
    const lengthRange = data.lengths.length > 1
      ? `${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`
      : `${data.lengths[0]} cm`;
    const colorInfo = data.colorCount && data.colorCount > 1
      ? `, ${data.colorCount} odstínů`
      : "";
    parts.push(`Dostupné délky: ${lengthRange}${colorInfo}. Skladem v Praze.`);
  }

  return parts.join(" ");
}

export function generateProductBioShort(data: BioProductData): string {
  const parts: string[] = [];

  const catLabel: Record<string, string> = {
    VIRGIN: "Panenské",
    PREMIUM: "Prémiové",
    STANDARD: "Kvalitní",
    SALE: "Akční",
  };
  const procLabel: Record<string, string> = {
    CLIP_IN: "clip-in",
    TAPE_IN: "tape-in",
    KERATIN: "keratinové",
    WEFT: "tresové",
    MICRO_RING: "micro ring",
    OTHER: "",
  };

  const cat = catLabel[data.category] ?? "";
  const proc = procLabel[data.processingType] ?? "";
  if (cat && proc) {
    parts.push(`${cat} ${proc} vlasy`);
  } else if (cat) {
    parts.push(`${cat} vlasy`);
  }

  if (data.texture) parts.push(data.texture.toLowerCase());
  if (data.origin) parts.push(data.origin);

  if (data.lengths && data.lengths.length > 1) {
    parts.push(`${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`);
  }

  return parts.join(" | ");
}
