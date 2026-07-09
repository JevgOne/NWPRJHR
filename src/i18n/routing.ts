import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["cs", "uk", "ru"],
  defaultLocale: "cs",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      uk: "/ua",
      ru: "/rus",
    },
  },
  localeCookie: {
    name: "HAIRLAND_LOCALE",
  },
  localeDetection: true,
  alternateLinks: true,
});
