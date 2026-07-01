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

const CAT_LABEL: Record<string, string> = {
  VIRGIN: "panenské",
  PREMIUM: "prémiové",
  STANDARD: "kvalitní",
  SALE: "akční",
};

const PROC_LABEL: Record<string, string> = {
  CLIP_IN: "clip-in",
  TAPE_IN: "tape-in",
  KERATIN: "keratinové",
  WEFT: "tresové",
  MICRO_RING: "micro ring",
  OTHER: "",
};

const CATEGORY_STORY: Record<string, string> = {
  VIRGIN: "Tyto vlasy vám zaručují absolutní jistotu kvality. Každý culík pochází od jedné ženy — nikdy nesmícháváme vlasy z různých zdrojů. Získáváte tak 100% panenské vlasy, které nikdy nebyly barvené ani chemicky ošetřené.",
  PREMIUM: "Vlasy prošly šetrným procesem, který zachovává přirozenou strukturu a hedvábný vzhled. Ideální volba pro klientky, které chtějí luxusní výsledek za rozumnou cenu. Kvalitou se blíží panenskému vlasu, přitom nabízejí výborný poměr kvality a ceny.",
  STANDARD: "Kvalitní vlasy ošetřené moderními postupy pro přirozený vzhled a spolehlivou trvanlivost. Perfektní pro klientky, které hledají změnu bez velkých investic — ať už jde o první prodloužení nebo doplnění objemu.",
  SALE: "Vlasy za výhodnou akční cenu — skvělá příležitost vyzkoušet prodloužení nebo doplnit zásoby. Kvalita odpovídá vyšším kategoriím, cena je snížena díky omezené dostupnosti.",
};

const CATEGORY_BENEFITS: Record<string, string[]> = {
  VIRGIN: [
    "**Přirozenou jemnost a lesk**, který si zachovává původní strukturu",
    "**Nejkvalitnější vlasy** v naší nabídce — prémiový produkt pro náročné zákaznice",
    "**Možnost barvení** — vlasy lze barvit, tónovat i narovnat dle přání",
    "**Dlouhá životnost** — až 24 měsíců při správné péči",
    "**Možnost přeaplikace** — vlasy vydrží opakované použití",
  ],
  PREMIUM: [
    "**Jemně ošetřené** s maximálně zachovanou strukturou",
    "**Přirozený vzhled** nerozpoznatelný od vlastních vlasů",
    "**Snadná údržba** a dlouhá životnost",
    "**Vhodné pro barvení** a styling",
    "**Výborný poměr** kvality a ceny",
  ],
  STANDARD: [
    "**Přirozený vzhled** pro každodenní nošení",
    "**Spolehlivá trvanlivost** a odolnost",
    "**Snadná aplikace** a minimální údržba",
    "**Výborný poměr** cena/výkon",
  ],
  SALE: [
    "**Stejná kvalita** za zvýhodněnou cenu",
    "**Ideální pro první vyzkoušení** prodloužení",
    "**Omezená nabídka** — dokud jsou skladem",
  ],
};

const ORIGIN_STORY: Record<string, string> = {
  "Uzbekistán": "Uzbecké vlasy vynikají silnou strukturou, přirozenou hustotou a odolností. Skvěle drží tvar a barvu. Jsou oblíbené pro svou schopnost zvládnout i náročnější styling.",
  "Ukrajina": "Ukrajinské vlasy patří k nejkvalitnějším na světě. Jemné, hedvábné a s přirozeným leskem, který vydrží. Jsou ideální pro klientky, které hledají ten nejpřirozenější vzhled.",
  "Rusko": "Ruské vlasy jsou synonymem luxusu — jemná struktura, přirozený lesk a výjimečná trvanlivost. Každý pramen prošel pečlivým výběrem, aby splňoval ty nejpřísnější standardy.",
  "Kazachstán": "Kazašské vlasy se vyznačují silnou strukturou a vysokou odolností. Výborně drží barvu i tvar. Jsou skvělou volbou pro klientky, které preferují plnější a odolnější vlasy.",
  "Indie": "Indické vlasy nabízí skvělý poměr kvality a ceny. Hustá struktura a přirozený lesk jsou jejich poznávacím znakem.",
};

const PROCESSING_STORY: Record<string, string> = {
  CLIP_IN: "Zpracování metodou **clip-in** umožňuje snadné nasazení i sundání během pár minut, bez jakéhokoliv poškození vlastních vlasů. Ráno nasadíte, večer sundáte.",
  TAPE_IN: "Metoda **tape-in** využívá ultratenké adhezivní pásky pro plochý a neviditelný spoj. Pohodlné celodenní nošení s přeaplikací každých 6–8 týdnů.",
  KERATIN: "Zakončeno: **keratinový spoj**, italský keratin. Spoj je téměř neviditelný — okolí nepozná, že máte prodloužené vlasy.",
  WEFT: "**Tresové zpracování** zajišťuje rychlou aplikaci s maximálním objemem a hustotou. Vhodné pro zkušené kadeřnice, které chtějí dosáhnout dramatického efektu.",
  MICRO_RING: "Metoda **micro ring** využívá mikroskopické kroužky pro šetrnou aplikaci bez tepla a lepidla. Maximálně šetrné k vlastním vlasům.",
  OTHER: "",
};

const TEXTURE_NOTE: Record<string, string> = {
  "Rovné": "Rovná struktura — hladký, elegantní vzhled s přirozeným leskem.",
  "Mírně vlnité": "Mírně vlnitá struktura přidá jemný objem a přirozený pohyb. Vypadají jako vlasy po noci s copánky — effortless a žensky.",
  "Vlnité": "Vlnitá struktura dodá dramatický objem a romantický vzhled. Krásně drží tvar bez potřeby kulmy.",
  "Kudrnaté": "Kudrnatá struktura plná objemu a energie. Každý pramen je originál.",
};

export function generateProductBio(data: BioProductData): string {
  const sections: string[] = [];
  const cat = CAT_LABEL[data.category] ?? "";
  const proc = PROC_LABEL[data.processingType] ?? "";

  // 1. Title line
  const titleParts = [cat, proc, "vlasy"].filter(Boolean);
  if (data.origin) titleParts.push(`z ${data.origin}u`.replace("zánu", "zánu").replace("stánu", "stánu"));
  sections.push(`**${data.name}**`);

  // 2. Specs block
  const specs: string[] = [];
  if (data.colorTone) specs.push(`Barevný tón: ${data.colorTone}`);
  if (data.texture) specs.push(`Struktura: ${data.texture}`);
  if (data.lengths && data.lengths.length > 0) {
    specs.push(data.lengths.length > 1
      ? `Dostupné délky: ${data.lengths.join(", ")} cm`
      : `Délka: ${data.lengths[0]} cm`);
  }
  if (data.colorCount && data.colorCount > 1) {
    specs.push(`Dostupné odstíny: ${data.colorCount}`);
  }
  if (proc) {
    const procLine = PROCESSING_STORY[data.processingType];
    if (procLine) specs.push(procLine);
  }
  if (specs.length > 0) sections.push(specs.join("\n"));

  // 3. "Proč si vybrat právě tyto vlasy?"
  const story = CATEGORY_STORY[data.category];
  if (story) {
    sections.push(`**Proč si vybrat právě tyto vlasy?**\n${story}`);
  }

  // 4. Origin story
  if (data.origin) {
    const originStory = ORIGIN_STORY[data.origin];
    if (originStory) {
      sections.push(`**Proč právě ${data.origin}?**\n${originStory}`);
    }
  }

  // 5. Texture note
  if (data.texture) {
    const texNote = TEXTURE_NOTE[data.texture];
    if (texNote) sections.push(texNote);
  }

  // 6. "Co vás čeká:" — benefits
  const benefits = CATEGORY_BENEFITS[data.category];
  if (benefits && benefits.length > 0) {
    sections.push("**Co vás čeká:**\n" + benefits.map(b => `• ${b}`).join("\n"));
  }

  // 7. Satisfaction guarantee
  sections.push("**Záruka spokojenosti**\nPokud vlasy neodpovídají vašim představám, můžete je vrátit. Stačí, aby byly nepoužité a nepoškozené. Osobní odběr v Praze zdarma. Zpracování na zakázku do 7 dnů. Faktura pro firmy i kadeřnice.");

  return sections.join("\n\n");
}

export function generateProductBioShort(data: BioProductData): string {
  const parts: string[] = [];

  const cat = CAT_LABEL[data.category] ?? "";
  const proc = PROC_LABEL[data.processingType] ?? "";
  if (cat && proc) {
    parts.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} ${proc} vlasy`);
  } else if (cat) {
    parts.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} vlasy`);
  }

  if (data.texture) parts.push(data.texture.toLowerCase());
  if (data.colorTone) parts.push(data.colorTone.toLowerCase());
  if (data.origin) parts.push(data.origin);

  if (data.lengths && data.lengths.length > 1) {
    parts.push(`${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`);
  }

  return parts.join(" | ");
}
