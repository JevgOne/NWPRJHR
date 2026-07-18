import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ComplaintForm } from "./ComplaintForm";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("reklamacniTitle"),
    description: t("reklamacniDescription"),
    alternates: getAlternates("/reklamacni-rad"),
    openGraph: {
      type: "website",
      title: `${t("reklamacniTitle")} | Hairland`,
      description: t("reklamacniDescription"),
      url: "https://www.hairland.cz/reklamacni-rad",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-reklamacni-rad.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("reklamacniTitle")} | Hairland`,
      description: t("reklamacniDescription"),
      images: ["https://www.hairland.cz/og/og-reklamacni-rad.jpg"],
    },
  };
}

const sections = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default async function ReklamacniRadPage() {
  const t = await getTranslations("public.complaints");
  const tForm = await getTranslations("public.complaintForm");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">{t("title")}</h1>
      <p className="text-sm text-muted mb-8">{t("subtitle")}</p>

      <div className="space-y-8">
        {sections.map((num) => (
          <section key={num}>
            <h2 className="text-lg font-semibold text-ink mb-2">
              {t(`section${num}Title`)}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {t(`section${num}Text`)}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">{t("lastUpdated")}</p>

      {/* Complaint submission form */}
      <div id="formular" className="mt-16 border-t border-line pt-12">
        <h2 className="text-2xl font-bold text-ink mb-2">{tForm("formTitle")}</h2>
        <p className="text-sm text-muted mb-6">{tForm("formSubtitle")}</p>
        <div className="bg-white rounded-2xl border border-line p-6">
          <ComplaintForm />
        </div>
      </div>
    </div>
  );
}
