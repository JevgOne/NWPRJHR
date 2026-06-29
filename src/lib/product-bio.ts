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
  VIRGIN: "Panenské vlasy nejvyšší kvality — 100% neošetřené, s kompletní kutikulou zachovanou ve správném směru. Díky tomu se netřepí, nezamotávají a vydrží krásné až 2 roky při správné péči.",
  PREMIUM: "Prémiové vlasy s jemným ošetřením, zachovanou strukturou a přirozeným vzhledem. Kombinace kvality a dostupnosti — ideální volba pro klientky, které chtějí luxusní výsledek za rozumnou cenu.",
  STANDARD: "Kvalitní vlasy se skvělým poměrem cena/kvalita. Ošetřené vlasy s přirozeným vzhledem a spolehlivou trvanlivostí — perfektní pro klientky, které hledají změnu bez velkých investic.",
  SALE: "Vlasy za výhodnou akční cenu — skvělá příležitost vyzkoušet prodloužení nebo doplnit zásoby za zlomek běžné ceny.",
};

const CATEGORY_BENEFITS: Record<string, string[]> = {
  VIRGIN: [
    "Zachovaná kutikula ve správném směru — minimální zamotávání",
    "Přirozený lesk a hedvábný povrch",
    "Možnost barvení, tónování i ondulace",
    "Životnost až 24 měsíců při správné péči",
  ],
  PREMIUM: [
    "Jemně ošetřené s maximálně zachovanou strukturou",
    "Přirozený vzhled nerozpoznatelný od vlastních vlasů",
    "Snadná údržba a dlouhá životnost",
    "Vhodné pro barvení a styling",
  ],
  STANDARD: [
    "Ošetřené vlasy s přirozeným vzhledem",
    "Spolehlivá trvanlivost pro každodenní nošení",
    "Snadná aplikace a údržba",
    "Výborný poměr cena/výkon",
  ],
  SALE: [
    "Stejná kvalita za zvýhodněnou cenu",
    "Ideální pro první vyzkoušení prodloužení",
    "Omezená nabídka — dokud jsou skladem",
  ],
};

const PROCESSING_DESC: Record<string, string> = {
  CLIP_IN: "Zpracování metodou clip-in — klipsy umožňují snadné nasazení i sundání během pár minut, bez jakéhokoliv poškození vlastních vlasů. Ideální pro speciální příležitosti i každodenní nošení.",
  TAPE_IN: "Zpracování metodou tape-in — ultratenké adhezivní pásky vytváří plochý a neviditelný spoj. Pohodlné celodenní nošení, přeaplikace každých 6–8 týdnů.",
  KERATIN: "Keratinové prodloužení — jednotlivé pramínky spojené keratinovou vazbou pro nejpřirozenější a nejdiskrétnější výsledek. Spoj je téměř neviditelný a nehmotný.",
  WEFT: "Tresové zpracování — rychlá aplikace s maximálním objemem a hustotou. Vhodné pro zkušené kadeřnice, které chtějí dosáhnout dramatického efektu.",
  MICRO_RING: "Metoda micro ring — šetrná aplikace pomocí mikroskopických kroužků, bez tepla a lepidla. Snadno přeaplikovatelné, šetrné k vlastním vlasům.",
  OTHER: "",
};

const TEXTURE_DESC: Record<string, string> = {
  "Rovné": "Rovná struktura dodává hladký, elegantní a sofistikovaný vzhled. Vlasy krásně splývají a odrážejí světlo pro maximální lesk.",
  "Mírně vlnité": "Mírně vlnitá struktura přidá jemný objem a přirozený pohyb. Vypadají jako vlasy po noci s copánky — effortless a žensky.",
  "Vlnité": "Vlnitá struktura pro romantický, objemný efekt plný života. Dodají účesu dynamiku a hravost bez nutnosti denního stylingu.",
  "Kudrnaté": "Kudrnatá struktura pro výrazný objem a energický styl. Přirozené kudrliny, které drží tvar a dodávají osobitost.",
};

const ORIGIN_DESC: Record<string, string> = {
  "Ukrajina": "Vlasy z Ukrajiny jsou ceněné pro svou jemnost, přirozený lesk a výbornou kompatibilitu s evropským typem vlasů.",
  "Uzbekistán": "Uzbecké vlasy vynikají silnou strukturou, přirozenou hustotou a odolností. Skvěle drží tvar a barvu.",
  "Kazachstán": "Kazašské vlasy nabízejí unikátní kombinaci pevnosti a hedvábného povrchu. Oblíbené pro svou trvanlivost.",
  "Rusko": "Ruské vlasy patří mezi nejžádanější na světě — jemné, hedvábné a dokonale přirozené pro evropský typ.",
  "Indie": "Indické vlasy jsou známé svou všestranností a přirozenou silou. Vhodné pro různé typy zpracování.",
  "Čína": "Čínské vlasy vynikají svou silou a objemem. Po zpracování dosahují krásného přirozeného vzhledu.",
};

export function generateProductBio(data: BioProductData): string {
  const sections: string[] = [];

  // 1. Category intro
  const intro = CATEGORY_INTRO[data.category];
  if (intro) sections.push(intro);

  // 2. Processing method
  const processing = PROCESSING_DESC[data.processingType];
  if (processing) sections.push(processing);

  // 3. Texture
  if (data.texture) {
    const texDesc = TEXTURE_DESC[data.texture];
    if (texDesc) sections.push(texDesc);
  }

  // 4. Origin
  if (data.origin) {
    const originDesc = ORIGIN_DESC[data.origin];
    if (originDesc) {
      sections.push(originDesc);
    } else {
      sections.push(`Původ: ${data.origin}.`);
    }
  }

  // 5. Color tone
  if (data.colorTone) {
    sections.push(`Barevný tón: ${data.colorTone} — přirozený odstín, který lze dále upravit barvením nebo tónováním dle přání klientky.`);
  }

  // 6. Availability
  const avail: string[] = [];
  if (data.lengths && data.lengths.length > 0) {
    const lengthRange = data.lengths.length > 1
      ? `${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`
      : `${data.lengths[0]} cm`;
    avail.push(`Dostupné délky: ${lengthRange}`);
  }
  if (data.colorCount && data.colorCount > 1) {
    avail.push(`${data.colorCount} barevných odstínů`);
  }
  avail.push("Skladem v Praze");
  avail.push("osobní odběr zdarma");
  sections.push(avail.join(" · ") + ".");

  // 7. Benefits list
  const benefits = CATEGORY_BENEFITS[data.category];
  if (benefits && benefits.length > 0) {
    sections.push("Proč si vybrat právě tyto vlasy?\n" + benefits.map(b => `• ${b}`).join("\n"));
  }

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
