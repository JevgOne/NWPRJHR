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

export function generateProductBio(data: BioProductData): string {
  const origin = data.origin ? originFromGenitive(data.origin) : "";
  const texture = data.texture?.toLowerCase() ?? "";
  const color = data.colorTone ?? "";
  const lengthStr = formatLengths(data.lengths);

  type TemplateFn = (o: string, t: string, c: string, l: string) => string;
  let templates: TemplateFn[];

  if (data.category === "VIRGIN") {
    templates = VIRGIN_TEMPLATES;
  } else if (data.category === "LUXE") {
    templates = LUXE_TEMPLATES;
  } else if (data.category === "STANDARD") {
    templates = STANDARD_TEMPLATES;
  } else if (data.category === "SALE") {
    templates = SALE_TEMPLATES;
  } else {
    return buildGenericBio(data.name, origin, texture, color, lengthStr);
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(origin, texture, color, lengthStr).trim();
}

function formatLengths(lengths?: number[]): string {
  if (!lengths || lengths.length === 0) return "";
  const unique = [...new Set(lengths)].sort((a, b) => a - b);
  if (unique.length === 1) return `${unique[0]} cm`;
  return `${unique[0]}\u2013${unique[unique.length - 1]} cm`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- VIRGIN (3 variants) ---

const VIRGIN_TEMPLATES = [
  // V1: Emphasis on purity
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${o ? `${capitalize(o)} p` : "P"}anenské ${t} vlasy k prodloužení${c ? ` v odstínu ${c}` : ""}.`,
      "Neošetřené, z jedné dárkyně \u2014 rovnoměrná struktura od kořínků ke konečkům.",
      l ? `Délka ${l}, zpracování na zakázku do 7 pracovních dnů.` : "Zpracování na zakázku do 7 pracovních dnů.",
      "Při správné péči vydrží rok i déle.",
    ];
    return parts.join(" ");
  },
  // V2: Emphasis on premium feel
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `Prémiové ${t} vlasy${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 100 % panenský vlas bez chemie.`,
      "Každý culík pochází od jedné dárkyně, takže textura je po celé délce stejnoměrná.",
      l ? `K dispozici v délce ${l}.` : "",
      "Vhodné k barvení, kadeření i žehlení. Osobní ukázka v Praze zdarma.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V3: Emphasis on processing options
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `100% panenské ${t} vlasy${o ? ` ${o}` : ""}${c ? ` (${c})` : ""} pro náročné klientky.`,
      "Nikdy nebarvené, nikdy chemicky ošetřené. Hedvábný lesk a přirozený pohyb.",
      l ? `Délka ${l}.` : "",
      "Zpracujeme clip-in, tape-in, keratin nebo micro ring \u2014 přesně podle vašeho přání.",
    ];
    return parts.filter(Boolean).join(" ");
  },
];

// --- LUXE (3 variants) ---

const LUXE_TEMPLATES = [
  // V1: Quality/price ratio
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `Luxusní ${t} vlasy${o ? ` ${o}` : ""}${c ? ` v odstínu ${c}` : ""}.`,
      "Šetrně ošetřené tak, aby si zachovaly přirozenou strukturu a hedvábný lesk. Kvalitou se blíží panenskému vlasu za příznivější cenu.",
      l ? `Délka ${l}.` : "",
      "Zpracování na zakázku, osobní odběr v Praze zdarma.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V2: Result-focused
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${capitalize(t || "Vlasy")} vlasy luxe kvality${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 prémiový výsledek bez kompromisů na vzhledu.`,
      "Pečlivě vybrané a šetrně ošetřené pro maximální přirozenost.",
      l ? `Délka ${l}.` : "",
      "Připravíme clip-in, tape-in nebo keratin do 7 pracovních dnů.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V3: Natural feel
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Vlasy")} vlasy v luxe kvalitě${c ? `, ${c}` : ""}.`,
      "Zachovaná přirozená struktura, hedvábný omak a zdravý lesk.",
      l ? `Délka ${l}.` : "",
      "Ideální pro klientky, které chtějí nejlepší poměr kvality a ceny. Osobní ukázka po Praze zdarma.",
    ];
    return parts.filter(Boolean).join(" ");
  },
];

// --- STANDARD (3 variants) ---

const STANDARD_TEMPLATES = [
  // V1: First extension
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `Kvalitní ${t} vlasy${o ? ` ${o}` : ""}${c ? ` v odstínu ${c}` : ""} \u2014 spolehlivá volba pro první prodloužení nebo doplnění objemu.`,
      "Ošetřené moderními postupy pro přirozený vzhled.",
      l ? `Délka ${l}.` : "",
      "Zpracujeme na zakázku, doručení do 7 dnů.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V2: Affordability
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${capitalize(t || "Vlasy")} vlasy${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} v osvědčené kvalitě za dostupnou cenu.`,
      "Přirozený vzhled a spolehlivá trvanlivost.",
      l ? `Délka ${l}.` : "",
      "Zpracování clip-in, tape-in nebo keratin. Osobní odběr v Praze zdarma.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V3: Versatility
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Vlasy")} vlasy${c ? ` (${c})` : ""} pro každodenní nošení.`,
      "Moderní zpracování zajišťuje přirozený vzhled a snadnou údržbu.",
      l ? `Délka ${l}.` : "",
      "Skvělá volba pro objem i délku. Do 7 pracovních dnů připravené k vyzvednutí.",
    ];
    return parts.filter(Boolean).join(" ");
  },
];

// --- SALE (3 variants) ---

const SALE_TEMPLATES = [
  // V1
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${capitalize(t || "Vlasy")}${c ? ` ${c}` : ""} za výprodejovou cenu.`,
      "Pečlivě zastřižené, vyčesané a umyté \u2014 připravené k okamžitému zpracování.",
      l ? `Délka ${l}.` : "",
      "Na výprodejové vlasy neposkytujeme záruku.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V2
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `Zvýhodněné ${t} vlasy${c ? `, ${c}` : ""}.`,
      "Ideální příležitost vyzkoušet prodloužení za zlomek běžné ceny.",
      l ? `Délka ${l}.` : "",
      "Omezená dostupnost \u2014 pouze do vyprodání zásob.",
    ];
    return parts.filter(Boolean).join(" ");
  },
  // V3
  (o: string, t: string, c: string, l: string) => {
    const parts = [
      `${capitalize(t || "Vlasy")} vlasy${c ? ` ${c}` : ""} v akci.`,
      "Kusy, které nesplnily naše nejvyšší standardy kvality \u2014 stále plně použitelné pro prodloužení.",
      l ? `Délka ${l}.` : "",
      "Bez záruky.",
    ];
    return parts.filter(Boolean).join(" ");
  },
];

function buildGenericBio(name: string, origin: string, texture: string, color: string, lengthStr: string): string {
  const parts: string[] = [name + "."];
  if (origin) parts.push(`Původ ${origin}.`);
  if (texture) parts.push(`Textura: ${texture}.`);
  if (color) parts.push(`Odstín: ${color}.`);
  if (lengthStr) parts.push(`Délka ${lengthStr}.`);
  return parts.join(" ");
}
