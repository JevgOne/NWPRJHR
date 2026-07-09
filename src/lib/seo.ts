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

export function getAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const [locale, prefix] of Object.entries(LOCALE_PREFIXES)) {
    languages[locale] = `${BASE_URL}${prefix}${path}`;
  }
  return {
    canonical: path || "/",
    languages,
  };
}
