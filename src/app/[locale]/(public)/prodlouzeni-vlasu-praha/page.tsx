import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";
import { getCachedAllProducts } from "@/lib/cached-products";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("pragueLP"), getLocale()]);
  const title = t("metaTitle");
  const desc = t("metaDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates("/prodlouzeni-vlasu-praha"),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/prodlouzeni-vlasu-praha",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-home.jpg",
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
      images: ["https://www.hairland.cz/og/og-home.jpg"],
    },
  };
}

const METHODS = [
  { key: "clipIn", href: "/clip-in", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { key: "tapeIn", href: "/tape-in", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { key: "keratin", href: "/keratin", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { key: "microRing", href: "/micro-ring", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "weft", href: "/tresove-vlasy", icon: "M4 6h16M4 12h16M4 18h16" },
] as const;

export default async function ProdlouzeniVlasuPrahaPage() {
  const [t, products] = await Promise.all([
    getTranslations("pragueLP"),
    getCachedAllProducts(),
  ]);

  const inStockProducts = products.filter((p) =>
    p.variants.some((v) =>
      (v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0 && v.availableGrams > 0) ||
      (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0 && (v.availablePieces ?? 0) > 0),
    ),
  );

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Hairland",
    description: t("metaDesc"),
    url: "https://www.hairland.cz",
    telephone: "+420777888999",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Školská 660/3",
      addressLocality: "Praha",
      postalCode: "110 00",
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 50.0796,
      longitude: 14.4262,
    },
    areaServed: {
      "@type": "City",
      name: "Praha",
    },
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Breadcrumbs items={[
        { label: "Hairland", href: "/" },
        { label: t("breadcrumb") },
      ]} />

      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("h1")}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          {t("heroText")}
        </p>
      </div>

      {/* Section 1: Pravé vlasy k prodloužení */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("realHairTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("realHairText1")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          {t("realHairText2")}
        </p>
      </section>

      {/* Section 2: Typy vlasů — panenské, slovanské, ukrajinské */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("typesTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-6">
          {t("typesIntro")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["virgin", "slavic", "european"] as const).map((type) => (
            <div key={type} className="bg-nude-50 rounded-xl border border-line p-5">
              <div className="text-sm font-semibold text-ink mb-2">
                {t(`type_${type}_title`)}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {t(`type_${type}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Metody prodloužení */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("methodsTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-6">
          {t("methodsIntro")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {METHODS.map(({ key, href, icon }) => (
            <Link
              key={key}
              href={href}
              className="flex items-start gap-3 bg-nude-50 rounded-xl border border-line p-4 hover:border-blush-200 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-blush-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-rose-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink group-hover:text-rose transition-colors">
                  {t(`method_${key}_title` as "method_clipIn_title")}
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {t(`method_${key}_desc` as "method_clipIn_desc")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 4: Jak vybrat odstín a gramáž */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("chooseTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">{t("chooseColorTitle")}</div>
            <p className="text-sm text-muted leading-relaxed">{t("chooseColorText")}</p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">{t("chooseGramsTitle")}</div>
            <p className="text-sm text-muted leading-relaxed mb-3">{t("chooseGramsText")}</p>
            <Link
              href="/pruvodce-gramazi"
              className="inline-flex items-center text-xs text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("chooseGramsCta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Cenový přehled */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("pricingTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("pricingText")}
        </p>
        <div className="bg-nude-50 rounded-xl border border-line p-5">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            {(["standard", "luxe", "virgin"] as const).map((cat) => (
              <div key={cat}>
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  {t(`price_${cat}_label`)}
                </div>
                <div className="text-lg font-bold text-ink">
                  {t(`price_${cat}_value`)}
                </div>
                <div className="text-[10px] text-muted">{t("pricePerGram")}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/cenik-vlasy"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("pricingCta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Products from DB */}
      {inStockProducts.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-2">
            {t("productsTitle")}
          </h2>
          <p className="text-sm text-muted mb-6 max-w-2xl">
            {t("productsSubtitle")}
          </p>
          <HeroProductSlider products={inStockProducts} />
          <div className="text-center mt-4">
            <Link
              href="/offer"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("productsViewAll")} →
            </Link>
          </div>
        </section>
      )}

      {/* Section 7: Osobní výběr v Praze */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink mb-3">
            {t("consultTitle")}
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-4 max-w-2xl">
            {t("consultText")}
          </p>
          <ul className="space-y-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <svg className="w-4 h-4 text-rose flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t(`consultBullet${i}` as "consultBullet1")}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
            >
              {t("consultCta")}
            </Link>
            <Link
              href="/kadernice"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
            >
              {t("consultStylists")}
            </Link>
          </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-line pt-3">
                {t(`faq${i}a` as "faq1a")}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <h2 className="text-lg font-semibold text-ink mb-2">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/offer"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaOffer")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </div>
    </div>
  );
}
