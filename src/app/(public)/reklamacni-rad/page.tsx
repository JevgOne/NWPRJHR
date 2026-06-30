import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Reklamační řád",
  description:
    "Reklamační řád e-shopu Hairland.cz — postup při reklamaci, práva kupujícího, lhůty a podmínky pro prémiové vlasy.",
  alternates: { canonical: "/reklamacni-rad" },
  openGraph: {
    type: "website",
    title: "Reklamační řád",
    description:
      "Reklamační řád e-shopu Hairland.cz — postup při reklamaci, práva kupujícího, lhůty a podmínky.",
    url: "https://www.hairland.cz/reklamacni-rad",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reklamační řád",
    description:
      "Reklamační řád e-shopu Hairland.cz — postup při reklamaci, práva kupujícího, lhůty a podmínky.",
  },
};

const sections = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default async function ReklamacniRadPage() {
  const t = await getTranslations("public.complaints");

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
    </div>
  );
}
