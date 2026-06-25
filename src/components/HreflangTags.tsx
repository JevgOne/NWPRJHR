"use client";

import { usePathname } from "next/navigation";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://hairland.cz";

const LOCALES = ["cs", "uk", "ru"] as const;

export function HreflangTags() {
  const pathname = usePathname();
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
