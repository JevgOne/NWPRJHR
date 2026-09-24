import { routing } from "@/i18n/routing";

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

/**
 * Resolve a localized path from the pathnames config.
 * Falls back to the original path if not found.
 */
function getLocalizedPath(internalPath: string, locale: string): string {
  const pathnames = (routing as any).pathnames;
  if (!pathnames) return internalPath;

  const config = pathnames[internalPath];
  if (!config) return internalPath;
  if (typeof config === "string") return config;
  return config[locale] ?? internalPath;
}

export function getOgUrl(path: string, locale: string = "cs"): string {
  const prefix = LOCALE_PREFIXES[locale] ?? "";
  const localizedPath = getLocalizedPath(path, locale);
  const fullPath = localizedPath === "/" ? (prefix || "/") : `${prefix}${localizedPath}`;
  return `${BASE_URL}${fullPath}`;
}

export function getAlternates(path: string, locale: string = "cs") {
  const languages: Record<string, string> = {};
  for (const [loc, prefix] of Object.entries(LOCALE_PREFIXES)) {
    const localizedPath = getLocalizedPath(path, loc);
    const fullPath = localizedPath === "/" ? (prefix || "/") : `${prefix}${localizedPath}`;
    languages[loc] = `${BASE_URL}${fullPath}`;
  }
  languages["x-default"] = `${BASE_URL}${path}`;

  // Self-referencing canonical for current locale
  const currentPrefix = LOCALE_PREFIXES[locale] ?? "";
  const localizedCurrent = getLocalizedPath(path, locale);
  const canonicalPath = localizedCurrent === "/" ? (currentPrefix || "/") : `${currentPrefix}${localizedCurrent}`;

  return {
    canonical: `${BASE_URL}${canonicalPath}`,
    languages,
  };
}
