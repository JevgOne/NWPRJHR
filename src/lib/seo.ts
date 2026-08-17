const BASE_URL = "https://www.hairland.cz";

const LOCALE_PREFIXES: Record<string, string> = {
  cs: "",
  uk: "/ua",
  ru: "/rus",
};

export const OG_LOCALES: Record<string, string> = {
  cs: "cs_CZ",
  uk: "uk_UA",
  ru: "ru_RU",
};

export function getAlternates(path: string, locale: string = "cs") {
  const languages: Record<string, string> = {};
  for (const [loc, prefix] of Object.entries(LOCALE_PREFIXES)) {
    const fullPath = path === "/" ? (prefix || "/") : `${prefix}${path}`;
    languages[loc] = `${BASE_URL}${fullPath}`;
  }
  languages["x-default"] = `${BASE_URL}${path}`;

  // Self-referencing canonical for current locale
  const currentPrefix = LOCALE_PREFIXES[locale] ?? "";
  const canonicalPath = path === "/" ? (currentPrefix || "/") : `${currentPrefix}${path}`;

  return {
    canonical: `${BASE_URL}${canonicalPath}`,
    languages,
  };
}
