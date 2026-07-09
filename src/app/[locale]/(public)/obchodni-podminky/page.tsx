import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("obchodniTitle"),
    description: t("obchodniDescription"),
    alternates: getAlternates("/obchodni-podminky"),
    openGraph: {
      type: "website",
      title: `${t("obchodniTitle")} | Hairland`,
      description: t("obchodniDescription"),
      url: "https://www.hairland.cz/obchodni-podminky",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.jpg",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("obchodniTitle")} | Hairland`,
      description: t("obchodniDescription"),
      images: ["https://www.hairland.cz/hero-vzornik.jpg"],
    },
  };
}

export default async function ObchodniPodminkyPage() {
  const t = await getTranslations("public.terms");

  const sectionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8">
        {t("subtitle")}
      </p>

      <div className="space-y-8">
        {sectionNumbers.map((num) => (
          <section key={num}>
            <h2 className="text-lg font-semibold text-ink mb-2">
              {t(`section${num}Title`)}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {t(`section${num}Text`)}
            </p>
            {num === 6 && (
              <Link
                href="/reklamacni-rad"
                className="inline-block mt-2 text-sm text-rose hover:text-rose-deep underline"
              >
                {t("section6Link")}
              </Link>
            )}
            {num === 9 && (
              <Link
                href="/privacy"
                className="inline-block mt-2 text-sm text-rose hover:text-rose-deep underline"
              >
                {t("section9Link")}
              </Link>
            )}
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
