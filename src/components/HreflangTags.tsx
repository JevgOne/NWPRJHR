import { headers } from "next/headers";

const SITE_URL = "https://www.hairland.cz";

const LOCALES = ["cs", "uk", "ru"] as const;

export async function HreflangTags() {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "/";
  const url = `${SITE_URL}${pathname}`;

  return (
    <>
      {LOCALES.map((locale) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />
    </>
  );
}
