import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getCachedAllProducts } from "@/lib/cached-products";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";
import { selectHeroProducts } from "@/lib/flatten-variants";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

const NAMESPACE = "ukrainianLP";
const PATH = "/ukrajinske-vlasy";

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
    alternates: getAlternates(PATH),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: `https://www.hairland.cz${PATH}`,
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

export default async function UkrajinskVlasyPage() {
  const [t, products] = await Promise.all([
    getTranslations(NAMESPACE),
    getCachedAllProducts(),
  ]);

  const filteredProducts = products.filter(
    (p) =>
      p.origin === "Ukrajina" &&
      p.variants.some(
        (v) =>
          (v.sellingMode === "BY_GRAM" &&
            v.retailPricePerGram > 0 &&
            v.availableGrams > 0) ||
          (v.sellingMode === "BY_PIECE" &&
            (v.retailPricePerPiece ?? 0) > 0 &&
            (v.availablePieces ?? 0) > 0),
      ),
  );

  const minPricePerGram = Math.min(
    ...filteredProducts
      .flatMap((p) =>
        p.variants
          .filter((v) => v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0)
          .map((v) => v.retailPricePerGram),
      ),
  );
  const minPriceKc = minPricePerGram > 0 && isFinite(minPricePerGram)
    ? Math.round(minPricePerGram / 100)
    : null;

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
        name: t("h1"),
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
          { label: t("home"), href: "/" },
          { label: t("breadcrumb") },
        ]}
      />

      {/* 1. Hero + H1 */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("h1")}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">{t("heroText")}</p>
      </div>

      {/* 2. Proč ukrajinské vlasy */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("whyTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("whyText1")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          {t("whyText2")}
        </p>
      </section>

      {/* 3. Přímý dovoz */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("importTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          {t("importText")}
        </p>
      </section>

      {/* 4. Kategorie vlasů z Ukrajiny */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("categoriesTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/panenske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">
              {t("catVirginTitle")}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("catVirginText")}
            </p>
          </Link>
          <Link
            href="/slovanske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">
              {t("catLuxeTitle")}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("catLuxeText")}
            </p>
          </Link>
          <Link
            href="/vlasy-k-prodlouzeni?category=STANDARD"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">
              {t("catStandardTitle")}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("catStandardText")}
            </p>
          </Link>
        </div>
      </section>

      {/* 5. Metody zpracování */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("methodsTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("methodsIntro")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: "clipIn", href: "/clip-in" as const },
            { key: "tapeIn", href: "/tape-in" as const },
            { key: "keratin", href: "/keratin" as const },
            { key: "microRing", href: "/micro-ring" as const },
            { key: "weft", href: "/tresove-vlasy" as const },
          ].map((method) => (
            <Link
              key={method.href}
              href={method.href}
              className="bg-nude-50 rounded-xl border border-line p-4 hover:border-blush-200 transition-colors group"
            >
              <div className="text-sm font-semibold text-ink group-hover:text-rose transition-colors mb-1">
                {t(`method_${method.key}_title` as "method_clipIn_title")}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t(`method_${method.key}_desc` as "method_clipIn_desc")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Cenový přehled */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("pricingTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("pricingText")}
        </p>
        <div className="bg-nude-50 rounded-xl border border-line p-5">
          <div className="text-center mb-4">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              {t("pricingLabel")}
            </div>
            <div className="text-lg font-bold text-ink">
              {minPriceKc ? `od ${minPriceKc.toLocaleString("cs-CZ")} Kč/g` : t("pricingValue")}
            </div>
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

      {/* 7. Produkty skladem */}
      {filteredProducts.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-2">
            {t("productsTitle")}
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
            {t("productsSubtitle")}
          </p>
          <HeroProductSlider products={selectHeroProducts(filteredProducts)} />
          <div className="text-center mt-4">
            <Link
              href="/vlasy-k-prodlouzeni?origin=Ukrajina"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("productsViewAll")} →
            </Link>
          </div>
        </section>
      )}

      {/* 8. Jak vybrat */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("chooseTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">
              {t("chooseColorTitle")}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("chooseColorText")}
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-2">
              {t("chooseGramsTitle")}
            </div>
            <p className="text-sm text-muted leading-relaxed mb-3">
              {t("chooseGramsText")}
            </p>
            <Link
              href="/pruvodce-gramazi"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("chooseGramsCta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">{t("faqTitle")}</h2>
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

      {/* 10. Cross-links */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("crossLinkTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/slovanske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-1">
              {t("crossSlavicTitle")}
            </div>
            <p className="text-sm text-muted">{t("crossSlavicText")}</p>
          </Link>
          <Link
            href="/panenske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-1">
              {t("crossVirginTitle")}
            </div>
            <p className="text-sm text-muted">{t("crossVirginText")}</p>
          </Link>
        </div>
      </section>

      {/* 11. CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("ctaTitle")}</h2>
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/vlasy-k-prodlouzeni?origin=Ukrajina"
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
