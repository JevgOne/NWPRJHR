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

const CATEGORY_STORY: Record<string, string> = {
  VIRGIN: "Tyto vlasy vám zaručují absolutní jistotu kvality. Každý culík pochází od jedné ženy — nikdy nesmícháváme vlasy z různých zdrojů. Získáváte tak 100% panenské vlasy, které nikdy nebyly barvené ani chemicky ošetřené.",
  LUXE: "Luxusní vlasy s jemným šetrným ošetřením, které zachovává přirozenou strukturu a hedvábný vzhled. Ideální volba pro klientky, které chtějí luxusní výsledek za rozumnou cenu. Kvalitou se blíží panenskému vlasu, přitom nabízejí výborný poměr kvality a ceny.",
  STANDARD: "Kvalitní vlasy ošetřené moderními postupy pro přirozený vzhled a spolehlivou trvanlivost. Perfektní pro klientky, které hledají změnu bez velkých investic — ať už jde o první prodloužení nebo doplnění objemu.",
  SALE: "Vlasy za výhodnou akční cenu — skvělá příležitost vyzkoušet prodloužení nebo doplnit zásoby. Kvalita odpovídá vyšším kategoriím, cena je snížena díky omezené dostupnosti.",
};

const PROCESSING_STORY: Record<string, string> = {
  CLIP_IN: "Zpracování metodou **clip-in** umožňuje snadné nasazení i sundání během pár minut, bez jakéhokoliv poškození vlastních vlasů. Ráno nasadíte, večer sundáte.",
  TAPE_IN: "Metoda **tape-in** využívá ultratenké adhezivní pásky pro plochý a neviditelný spoj. Pohodlné celodenní nošení s přeaplikací každých 6–8 týdnů.",
  KERATIN: "Zakončeno: **keratinový spoj**, italský keratin. Spoj je téměř neviditelný — okolí nepozná, že máte prodloužené vlasy.",
  WEFT: "**Tresové zpracování** zajišťuje rychlou aplikaci s maximálním objemem a hustotou. Vhodné pro zkušené kadeřnice, které chtějí dosáhnout dramatického efektu.",
  MICRO_RING: "Metoda **micro ring** využívá mikroskopické kroužky pro šetrnou aplikaci bez tepla a lepidla. Maximálně šetrné k vlastním vlasům.",
  OTHER: "",
};

export function generateProductBio(data: BioProductData): string {
  const sections: string[] = [];

  // 1. Category story (why these hair)
  const story = CATEGORY_STORY[data.category];
  if (story) sections.push(story);

  // 2. Processing method story
  const procStory = PROCESSING_STORY[data.processingType];
  if (procStory) sections.push(procStory);

  return sections.join("\n\n");
}
