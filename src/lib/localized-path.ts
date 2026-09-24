import { routing } from "@/i18n/routing";

/**
 * Resolve a localized path from the pathnames config.
 * Supports exact match and prefix match for sub-paths under catch-all routes.
 */
export function getLocalizedPath(internalPath: string, locale: string): string {
  const pathnames = (routing as any).pathnames;
  if (!pathnames) return internalPath;

  // Exact match
  const config = pathnames[internalPath];
  if (config) {
    if (typeof config === "string") return config;
    return config[locale] ?? internalPath;
  }

  // Prefix match for sub-paths under catch-all routes (e.g. /vlasy-k-prodlouzeni/barva/blond)
  for (const [key, value] of Object.entries(pathnames)) {
    if (key.includes("[...slug]")) {
      const prefix = key.replace("/[...slug]", "");
      if (internalPath.startsWith(prefix + "/")) {
        const suffix = internalPath.slice(prefix.length);
        const localizedPrefix = typeof value === "string"
          ? value.replace("/[...slug]", "")
          : ((value as Record<string, string>)[locale] ?? key).replace("/[...slug]", "");
        return localizedPrefix + suffix;
      }
    }
  }

  return internalPath;
}
