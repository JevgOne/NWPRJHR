export interface Article {
  slug: string;
  titleKey: string;
  descKey: string;
  category: "types" | "care" | "guide" | "quality";
  readMin: number;
}

export const articles: Article[] = [
  {
    slug: "typy-prodlouzeni",
    titleKey: "typesTitle",
    descKey: "typesDesc",
    category: "types",
    readMin: 5,
  },
  {
    slug: "clip-in-vs-tape-in",
    titleKey: "clipVsTapeTitle",
    descKey: "clipVsTapeDesc",
    category: "types",
    readMin: 4,
  },
  {
    slug: "jak-vybrat-barvu",
    titleKey: "colorGuideTitle",
    descKey: "colorGuideDesc",
    category: "guide",
    readMin: 4,
  },
  {
    slug: "jak-vybrat-delku",
    titleKey: "lengthGuideTitle",
    descKey: "lengthGuideDesc",
    category: "guide",
    readMin: 3,
  },
  {
    slug: "pece-o-prodlouzene-vlasy",
    titleKey: "careTitle",
    descKey: "careDesc",
    category: "care",
    readMin: 5,
  },
  {
    slug: "puvod-vlasu",
    titleKey: "originTitle",
    descKey: "originDesc",
    category: "quality",
    readMin: 4,
  },
  {
    slug: "virgin-vs-remy",
    titleKey: "virginVsRemyTitle",
    descKey: "virginVsRemyDesc",
    category: "quality",
    readMin: 3,
  },
  {
    slug: "jak-dlouho-vydrzi",
    titleKey: "durabilityTitle",
    descKey: "durabilityDesc",
    category: "care",
    readMin: 3,
  },
];
