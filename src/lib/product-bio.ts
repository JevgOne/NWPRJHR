import { originFromGenitive } from "@/lib/origin-flags";

interface BioProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  colorTone?: string | null;
  lengths?: number[];
  colorCount?: number;
}

const TEXTURE_ADJECTIVE: Record<string, string> = {
  "Rovné": "rovné",
  "Mírně vlnité": "mírně vlnité",
  "Vlnité": "vlnité",
  "Kudrnaté": "kudrnaté",
};

const PROCESSING_NOTE: Record<string, string> = {
  CLIP_IN: "Zpracování clip-in — nasadíte a sundáte během pár minut, vlastní vlasy zůstávají nepoškozené.",
  TAPE_IN: "Zpracování tape-in s ultratenkými adhezivními páskami pro plochý, neviditelný spoj.",
  KERATIN: "Keratinový spoj z italského keratinu — téměř neviditelný, okolí nepozná prodloužení.",
  WEFT: "Tresové zpracování pro rychlou aplikaci s maximálním objemem.",
  MICRO_RING: "Metoda micro ring bez tepla a lepidla, maximálně šetrná k vlastním vlasům.",
  OTHER: "",
};

export function generateProductBio(data: BioProductData): string {
  const origin = data.origin ? originFromGenitive(data.origin) : "";
  const texture = data.texture ? TEXTURE_ADJECTIVE[data.texture] ?? data.texture.toLowerCase() : "";
  const color = data.colorTone ?? "";
  const lengthStr = formatLengths(data.lengths);

  let bio = "";

  if (data.category === "VIRGIN") {
    bio = buildVirginBio(origin, texture, color, lengthStr);
  } else if (data.category === "LUXE") {
    bio = buildLuxeBio(origin, texture, color, lengthStr);
  } else if (data.category === "STANDARD") {
    bio = buildStandardBio(origin, texture, color, lengthStr);
  } else if (data.category === "SALE") {
    bio = buildSaleBio(origin, texture, color, lengthStr);
  } else {
    bio = buildGenericBio(data.name, origin, texture, color, lengthStr);
  }

  const proc = PROCESSING_NOTE[data.processingType];
  if (proc) bio += `\n\n${proc}`;

  return bio.trim();
}

function formatLengths(lengths?: number[]): string {
  if (!lengths || lengths.length === 0) return "";
  if (lengths.length === 1) return `${lengths[0]} cm`;
  return `${lengths[0]}–${lengths[lengths.length - 1]} cm`;
}

function buildVirginBio(origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [];

  // Opening sentence with origin
  if (origin) {
    parts.push(`100% panenské ${texture} vlasy ${origin}, v odstínu ${color || "přirozený"}.`);
  } else {
    parts.push(`100% panenské ${texture} vlasy v odstínu ${color || "přirozený"}.`);
  }

  parts.push("Nikdy nebarvené, nikdy chemicky ošetřené — každý culík pochází od jedné dárkyně, takže struktura je po celé délce rovnoměrná.");

  if (lengthStr) {
    parts.push(`Dostupné v délce ${lengthStr}.`);
  }

  parts.push("Při správné péči vydrží rok i déle a lze je barvit, kadeřit i žehlit bez omezení.");

  return parts.join(" ");
}

function buildLuxeBio(origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [];

  if (origin) {
    parts.push(`Luxusní ${texture} vlasy ${origin} v odstínu ${color || "přirozený"}.`);
  } else {
    parts.push(`Luxusní ${texture} vlasy v odstínu ${color || "přirozený"}.`);
  }

  parts.push("Šetrně ošetřené tak, aby si zachovaly přirozenou strukturu a hedvábný lesk. Kvalitou se blíží panenskému vlasu za výrazně příznivější cenu.");

  if (lengthStr) {
    parts.push(`Dostupné v délce ${lengthStr}.`);
  }

  parts.push("Ideální volba pro klientky, které chtějí prémiový výsledek bez kompromisů na vzhledu.");

  return parts.join(" ");
}

function buildStandardBio(origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [];

  if (origin) {
    parts.push(`Kvalitní ${texture} vlasy ${origin} v odstínu ${color || "přirozený"}.`);
  } else {
    parts.push(`Kvalitní ${texture} vlasy v odstínu ${color || "přirozený"}.`);
  }

  parts.push("Ošetřené moderními postupy pro přirozený vzhled a spolehlivou trvanlivost. Skvělá volba pro první prodloužení nebo doplnění objemu.");

  if (lengthStr) {
    parts.push(`Dostupné v délce ${lengthStr}.`);
  }

  return parts.join(" ");
}

function buildSaleBio(origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [];

  parts.push(`${texture ? texture.charAt(0).toUpperCase() + texture.slice(1) : "Vlasy"} v odstínu ${color || "přirozený"} za výprodejovou cenu.`);

  parts.push("Může jít o kusy, které nesplnily naše nejvyšší standardy, nebo o vlasy vrácené klientkami — pečlivě zastřižené, vyčesané a umyté.");

  if (lengthStr) {
    parts.push(`Délka ${lengthStr}.`);
  }

  parts.push("Na výprodejové vlasy neposkytujeme záruku.");

  return parts.join(" ");
}

function buildGenericBio(name: string, origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [name + "."];
  if (origin) parts.push(`Původ ${origin}.`);
  if (texture) parts.push(`Textura: ${texture}.`);
  if (color) parts.push(`Odstín: ${color}.`);
  if (lengthStr) parts.push(`Délka ${lengthStr}.`);
  return parts.join(" ");
}
