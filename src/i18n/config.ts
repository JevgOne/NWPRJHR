export const locales = ["cs", "uk", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "cs";
