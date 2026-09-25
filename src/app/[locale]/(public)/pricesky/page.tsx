import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";

const NAMESPACE = "pricesky";
const PATH = "/pricesky";

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

export default async function PriceskyPage() {
  const [t, tNav, products] = await Promise.all([
    getTranslations(NAMESPACE),
    getTranslations("public.nav"),
    getCachedAllProducts(),
  ]);

  const priceskProducts = products.filter(
    (p) =>
      p.processingType === "BANGS" ||
      p.variants.some((v) => v.sellingMode === "BY_PIECE"),
  );
  const flattened = flattenProductVariants(priceskProducts);

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

      {/* Typy příčesků */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("typesTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "type1", href: "/ofiny" as const },
            { key: "type2", href: "/vlasy-k-prodlouzeni" as const },
            { key: "type3", href: "/tresove-vlasy" as const },
          ].map((type) => (
            <Link
              key={type.key}
              href={type.href}
              className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors group"
            >
              <div className="text-sm font-semibold text-ink group-hover:text-rose transition-colors mb-2">
                {t(`${type.key}Title` as "type1Title")}
              </div>
              <p className="text-xs text-muted leading-relaxed mb-3">
                {t(`${type.key}Desc` as "type1Desc")}
              </p>
              <span className="text-xs text-rose font-medium">
                {t(`${type.key}Cta` as "type1Cta")} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Výhody */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("benefitsTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-nude-50 rounded-xl border border-line p-4 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-rose/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3.5 h-3.5 text-rose"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm text-ink leading-relaxed">
                {t(`benefit${i}` as "benefit1")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Produkty */}
      {flattened.length > 0 ? (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-6">
            {t("productsTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {flattened.slice(0, 6).map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-4">
            {t("productsTitle")}
          </h2>
          <p className="text-sm text-muted">{t("noProducts")}</p>
        </section>
      )}

      {/* Jak objednat */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("howTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-nude-50 rounded-xl border border-line p-5 text-center"
            >
              <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-bold text-rose">{i}</span>
              </div>
              <div className="text-sm font-semibold text-ink mb-2">
                {t(`step${i}Title` as "step1Title")}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t(`step${i}Text` as "step1Text")}
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
          <a
            href={`tel:${t("ctaPhone")}`}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaPhone")}
          </a>
          <a
            href={`https://wa.me/420608553103`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaWhatsApp")}
          </a>
        </div>
      </div>
    </div>
  );
}
