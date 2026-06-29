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

const CATEGORY_INTRO: Record<string, string> = {
  VIRGIN: "Panenské vlasy nejvyšší kvality — 100% neošetřené, s kompletní kutikulou zachovanou ve správném směru. Díky tomu se netřepí, nezamotávají a vydrží krásné až 2 roky při správné péči. Každý pramen je pečlivě vybraný a kontrolovaný, aby splňoval ty nejpřísnější standardy kvality.",
  PREMIUM: "Prémiové vlasy s jemným ošetřením, které zachovává přirozenou strukturu a hedvábný vzhled. Ideální volba pro klientky, které chtějí luxusní výsledek za rozumnou cenu. Vlasy procházejí šetrným procesem, který zajišťuje dlouhou životnost a snadnou údržbu.",
  STANDARD: "Kvalitní vlasy se skvělým poměrem cena/kvalita. Ošetřené moderními postupy pro přirozený vzhled a spolehlivou trvanlivost. Perfektní pro klientky, které hledají změnu bez velkých investic — ať už jde o první prodloužení nebo doplnění objemu.",
  SALE: "Vlasy za výhodnou akční cenu — skvělá příležitost vyzkoušet prodloužení nebo doplnit zásoby. Kvalita odpovídá vyšším kategoriím, cena je snížena díky omezené dostupnosti nebo sezonnímu výprodeji.",
};

const PROCESSING_DESC: Record<string, string> = {
  CLIP_IN: "Zpracování metodou clip-in umožňuje snadné nasazení i sundání během pár minut, bez jakéhokoliv poškození vlastních vlasů. Ideální pro speciální příležitosti i každodenní nošení — ráno nasadíte, večer sundáte.",
  TAPE_IN: "Tape-in metoda využívá ultratenké adhezivní pásky, které vytváří plochý a neviditelný spoj. Pohodlné celodenní nošení s přeaplikací každých 6–8 týdnů. Jedna z nejšetrnějších metod prodloužení.",
  KERATIN: "Keratinové prodloužení spojuje jednotlivé pramínky keratinovou vazbou pro nejpřirozenější a nejdiskrétnější výsledek. Spoj je téměř neviditelný — okolí nepozná, že máte prodloužené vlasy.",
  WEFT: "Tresové zpracování zajišťuje rychlou aplikaci s maximálním objemem a hustotou. Vhodné pro zkušené kadeřnice, které chtějí dosáhnout dramatického efektu během jednoho sezení.",
  MICRO_RING: "Metoda micro ring využívá mikroskopické kroužky pro šetrnou aplikaci bez tepla a lepidla. Snadno přeaplikovatelné, maximálně šetrné k vlastním vlasům a s přirozeným výsledkem.",
  OTHER: "",
};

const CATEGORY_BENEFITS: Record<string, string[]> = {
  VIRGIN: [
    "Zachovaná kutikula — minimální zamotávání a třepení",
    "Přirozený lesk a hedvábný povrch bez chemického ošetření",
    "Možnost barvení, tónování, ondulace i narovnání",
    "Životnost až 24 měsíců při správné péči",
    "Možnost opakované přeaplikace",
  ],
  PREMIUM: [
    "Jemně ošetřené s maximálně zachovanou strukturou",
    "Přirozený vzhled nerozpoznatelný od vlastních vlasů",
    "Snadná údržba a dlouhá životnost",
    "Vhodné pro barvení a styling",
    "Výborný poměr kvality a ceny",
  ],
  STANDARD: [
    "Přirozený vzhled pro každodenní nošení",
    "Spolehlivá trvanlivost a odolnost",
    "Snadná aplikace a minimální údržba",
    "Výborný poměr cena/výkon",
  ],
  SALE: [
    "Stejná kvalita za zvýhodněnou cenu",
    "Ideální pro první vyzkoušení prodloužení",
    "Omezená nabídka — dokud jsou skladem",
  ],
};

export function generateProductBio(data: BioProductData): string {
  const sections: string[] = [];

  // 1. Category intro — quality description
  const intro = CATEGORY_INTRO[data.category];
  if (intro) sections.push(intro);

  // 2. Processing method
  const processing = PROCESSING_DESC[data.processingType];
  if (processing) sections.push(processing);

  // 3. Benefits list
  const benefits = CATEGORY_BENEFITS[data.category];
  if (benefits && benefits.length > 0) {
    sections.push("Proč si vybrat právě tyto vlasy?\n" + benefits.map(b => `• ${b}`).join("\n"));
  }

  // 4. CTA
  sections.push("Osobní odběr v Praze zdarma. Zpracování na zakázku do 7 dnů. Faktura pro firmy i kadeřnice.");

  return sections.join("\n\n");
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
  if (data.colorTone) parts.push(data.colorTone.toLowerCase());
  if (data.origin) parts.push(data.origin);

  if (data.lengths && data.lengths.length > 1) {
    parts.push(`${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`);
  }

  return parts.join(" | ");
}
