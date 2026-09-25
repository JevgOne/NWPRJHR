import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";

const NAMESPACE = "vlasovePasky";
const PATH = "/vlasove-pasky";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations(NAMESPACE),
    getLocale(),
  ]);
  const title = t("metaTitle");
  const desc = t("metaDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates(PATH, locale),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: getOgUrl(PATH, locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-offer.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
      images: ["https://www.hairland.cz/og/og-offer.jpg"],
    },
  };
}

export default async function VlasovePaskyPage() {
  const [t, tNav, products] = await Promise.all([
    getTranslations(NAMESPACE),
    getTranslations("public.nav"),
    getCachedAllProducts(),
  ]);

  const tapeProducts = products
    .filter((p) => p.processingType === "TAPE_IN")
    .slice(0, 6);
  const flattened = flattenProductVariants(tapeProducts);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((i) => ({
      "@type": "Question",
      name: t(`faq${i}q` as "faq1q"),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq${i}a` as "faq1a"),
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hairland",
        item: "https://www.hairland.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("title"),
        item: `https://www.hairland.cz${PATH}`,
      },
    ],
  };

  const comparisonMethods = [
    { key: "TapeIn", highlight: true },
    { key: "Keratin", highlight: false },
    { key: "ClipIn", highlight: false },
    { key: "MicroRing", highlight: false },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: tNav("home"), href: "/" },
          { label: t("title") },
        ]}
      />

      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("title")}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">{t("subtitle")}</p>
      </div>

      {/* Co jsou vlasové pásky */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("whatTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("whatText")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          {t("whatText2")}
        </p>
      </section>

      {/* Výhody */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("benefitsTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-nude-50 rounded-xl border border-line p-5"
            >
              <div className="text-sm font-semibold text-ink mb-2">
                {t(`benefit${i}Title` as "benefit1Title")}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t(`benefit${i}Text` as "benefit1Text")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Srovnání metod */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("comparisonTitle")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("compMethod")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("compApplication")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("compLifespan")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("compMaintenance")}
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("compSuitability")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonMethods.map(({ key, highlight }) => (
                <tr
                  key={key}
                  className={`border-b border-line ${highlight ? "bg-rose/5 font-medium" : ""}`}
                >
                  <td className="p-3 text-ink">
                    {t(`comp${key}` as "compTapeIn")}
                  </td>
                  <td className="p-3 text-muted">
                    {t(`comp${key}App` as "compTapeInApp")}
                  </td>
                  <td className="p-3 text-muted">
                    {t(`comp${key}Life` as "compTapeInLife")}
                  </td>
                  <td className="p-3 text-muted">
                    {t(`comp${key}Maint` as "compTapeInMaint")}
                  </td>
                  <td className="p-3 text-muted">
                    {t(`comp${key}Suit` as "compTapeInSuit")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Produkty */}
      {flattened.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-6">
            {t("productsTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {flattened.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link
              href="/tape-in-vlasy"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("productsAllCta")} →
            </Link>
          </div>
        </section>
      )}

      {/* Pro koho */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("forWhomTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-nude-50 rounded-xl border border-line p-5"
            >
              <div className="text-sm font-semibold text-ink mb-2">
                {t(`forWhom${i}Title` as "forWhom1Title")}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t(`forWhom${i}Text` as "forWhom1Text")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("faqTitle")}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <details
              key={i}
              className="group bg-nude-50 rounded-xl border border-line overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-nude-100 transition-colors">
                <span className="text-sm font-medium text-ink pr-4">
                  {t(`faq${i}q` as "faq1q")}
                </span>
                <svg
                  className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-line pt-3">
                {t(`faq${i}a` as "faq1a")}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/tape-in-vlasy"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaCta")}
          </Link>
          <a
            href={`tel:${t("ctaPhone")}`}
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaPhone")}
          </a>
        </div>
      </div>
    </div>
  );
}
