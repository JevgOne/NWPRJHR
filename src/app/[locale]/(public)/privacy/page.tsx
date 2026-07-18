import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: getAlternates("/privacy"),
    openGraph: {
      type: "website",
      title: `${t("privacyTitle")} | Hairland`,
      description: t("privacyDescription"),
      url: "https://www.hairland.cz/privacy",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-privacy.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("privacyTitle")} | Hairland`,
      description: t("privacyDescription"),
      images: ["https://www.hairland.cz/og/og-privacy.jpg"],
    },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const sections = [
    "dataCollected",
    "purpose",
    "storage",
    "rights",
    "cookies",
    "contact",
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-8">{t("title")}</h1>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section}>
            <h2 className="text-xl font-semibold text-ink mb-3">
              {t(`${section}.title`)}
            </h2>
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {t(`${section}.text`)}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
