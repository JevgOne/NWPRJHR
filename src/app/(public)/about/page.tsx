import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "O nás — prémiové vlasy z přímého importu",
  description:
    "Hairland — prémiové přírodní vlasy k prodloužení. Přímý import z Ukrajiny, Ruska a Kazachstánu. Kvalita, důvěra a osobní přístup.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: "O nás — prémiové vlasy z přímého importu | Hairland",
    description:
      "Hairland — prémiové přírodní vlasy k prodloužení. Přímý import z Ukrajiny, Ruska a Kazachstánu. Kvalita, důvěra a osobní přístup.",
    url: "https://www.hairland.cz/about",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "O nás — prémiové vlasy z přímého importu | Hairland",
    description:
      "Hairland — prémiové přírodní vlasy k prodloužení. Přímý import z Ukrajiny, Ruska a Kazachstánu. Kvalita, důvěra a osobní přístup.",
  },
};

export default async function AboutPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-8">
        {t("about.title")}
      </h1>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("about.missionTitle")}
        </h2>
        <p className="text-muted leading-relaxed">
          {t("about.missionText")}
        </p>
      </section>

      {/* Values */}
      <section>
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("about.valuesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              "about.valueQuality",
              "about.valueTrust",
              "about.valuePartnership",
              "about.valueTransparency",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="p-4 bg-nude-50 rounded-lg border border-line"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blush-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-rose"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-ink">
                  {t(key)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
