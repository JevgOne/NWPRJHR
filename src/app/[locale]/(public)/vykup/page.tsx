import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("buyback"), getLocale()]);
  const title = t("pageTitle");
  const desc = t("pageDescription");
  return {
    title,
    description: desc,
    alternates: getAlternates("/vykup"),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/vykup",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.png",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
      images: ["https://www.hairland.cz/hero-vzornik.png"],
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Výkup vlasů — Hairland",
  url: "https://www.hairland.cz/vykup",
  description:
    "Vykupujeme přírodní vlasy od 40 cm. Férové ceny, okamžitá platba.",
  provider: {
    "@type": "Organization",
    name: "Hairland",
    url: "https://www.hairland.cz",
  },
  areaServed: { "@type": "Country", name: "CZ" },
};

export default async function BuybackPage() {
  const t = await getTranslations("buyback");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      "@type": "Question",
      name: t(`faq${i}Q` as "faq1Q"),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq${i}A` as "faq1A"),
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-white pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Breadcrumbs items={[
            { label: "Domů", href: "/" },
            { label: t("heroTitle") },
          ]} />
          <h1 className="text-3xl lg:text-4xl font-bold text-ink mb-3">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-6">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t("heroBadge1")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t("heroBadge2")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t("heroBadge3")}
            </span>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 bg-nude-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">
            {t("reqTitle")}
          </h2>
          <p className="text-muted text-center mb-8 max-w-xl mx-auto">
            {t("reqSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl border border-line p-4"
              >
                <span className="text-green-500 mt-0.5 text-lg">&#10003;</span>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    {t(`req${i}Title` as "req1Title")}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {t(`req${i}Desc` as "req1Desc")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-sm text-amber-800">
            {t("reqNote")}
          </div>
        </div>
      </section>

      {/* Pricing table */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">
            {t("priceTitle")}
          </h2>
          <p className="text-muted text-center mb-8 max-w-xl mx-auto">
            {t("priceSubtitle")}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-nude-50">
                  <th className="text-left px-4 py-3 font-semibold text-ink rounded-tl-xl">
                    {t("priceColLength")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-ink">
                    {t("priceColBlonde")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-ink">
                    {t("priceColBrown")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-ink rounded-tr-xl">
                    {t("priceColDark")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  { len: "40 cm", blonde: "2 000", brown: "1 500", dark: "800" },
                  { len: "50 cm", blonde: "3 500", brown: "2 500", dark: "1 500" },
                  { len: "60 cm", blonde: "5 000", brown: "3 500", dark: "2 500" },
                  { len: "70 cm", blonde: "7 000", brown: "5 000", dark: "3 500" },
                  { len: "80+ cm", blonde: "9 000+", brown: "7 000+", dark: "5 000+" },
                ].map((row) => (
                  <tr key={row.len} className="hover:bg-nude-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{row.len}</td>
                    <td className="px-4 py-3 text-right text-ink">{row.blonde} Kč</td>
                    <td className="px-4 py-3 text-right text-ink">{row.brown} Kč</td>
                    <td className="px-4 py-3 text-right text-ink">{row.dark} Kč</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted text-center mt-4">
            {t("priceDisclaimer")}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-nude-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-8">
            {t("stepsTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-rose/10 text-rose font-bold flex items-center justify-center mx-auto mb-2">
                  {step}
                </div>
                <h3 className="font-semibold text-ink mb-1 text-sm">
                  {t(`step${step}Title` as "step1Title")}
                </h3>
                <p className="text-xs text-muted">
                  {t(`step${step}Desc` as "step1Desc")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-8">
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <details
                key={i}
                className="group bg-nude-50 rounded-xl border border-line"
              >
                <summary className="px-5 py-4 cursor-pointer font-semibold text-ink text-sm flex items-center justify-between">
                  {t(`faq${i}Q` as "faq1Q")}
                  <svg
                    className="w-4 h-4 text-muted group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted">
                  {t(`faq${i}A` as "faq1A")}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-nude-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">
            {t("ctaTitle")}
          </h2>
          <p className="text-muted mb-6 max-w-lg mx-auto">
            {t("ctaDesc")}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-rose hover:bg-rose-deep text-white font-medium rounded-lg transition-colors"
            >
              {t("ctaContact")}
            </Link>
            <Link
              href="/offer"
              className="px-6 py-3 bg-white text-rose border border-blush-200 hover:bg-blush-100 font-medium rounded-lg transition-colors"
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
