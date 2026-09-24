import { routing } from "@/i18n/routing";

/**
 * Resolve a localized path from the pathnames config.
 * Supports exact match and prefix match for sub-paths under dynamic routes ([slug], [...slug], [city]).
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

  // Prefix match for sub-paths under dynamic routes
  // Matches [slug], [...slug], [city] etc.
  const dynamicSegmentRe = /^(.+?)\/\[(?:\.\.\.)?(\w+)\]$/;
  for (const [key, value] of Object.entries(pathnames)) {
    const m = dynamicSegmentRe.exec(key);
    if (m) {
      const staticPrefix = m[1];
      if (internalPath.startsWith(staticPrefix + "/")) {
        const suffix = internalPath.slice(staticPrefix.length);
        const dynamicPart = key.slice(staticPrefix.length);
        const localizedPrefix = typeof value === "string"
          ? value.replace(dynamicPart, "")
          : ((value as Record<string, string>)[locale] ?? key).replace(dynamicPart, "");
        return localizedPrefix + suffix;
      }
    }
  }

  return internalPath;
}
