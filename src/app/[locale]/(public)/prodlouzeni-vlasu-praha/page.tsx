import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getCachedAllProducts } from "@/lib/cached-products";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("prahaLanding"),
    getLocale(),
  ]);
  const title = t("metaTitle");
  const desc = t("metaDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates("/prodlouzeni-vlasu-praha", locale),
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

const CATEGORIES = ["VIRGIN", "LUXE", "STANDARD"] as const;

function getMinPricePerGram(
  products: Awaited<ReturnType<typeof getCachedAllProducts>>,
  category: string,
): number {
  const prices = products
    .filter((p) => p.category === category)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0)
        .map((v) => v.retailPricePerGram),
    );
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export default async function ProdlouzeniVlasuPrahaPage() {
  const [t, session, products] = await Promise.all([
    getTranslations("prahaLanding"),
    auth(),
    getCachedAllProducts(),
  ]);

  // B2B pricing
  let userRole: string | null = null;
  let discountPct = 0;
  if (session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") {
    userRole = session.user.role;
    const b2bSettings = await getCachedB2BSettings();
    discountPct =
      userRole === "SALON"
        ? b2bSettings.salonDiscountPct
        : b2bSettings.hairdresserDiscountPct;
  }

  // Min price per gram per category (haléře → Kč)
  const minPrices = Object.fromEntries(
    CATEGORIES.map((cat) => [cat, Math.round(getMinPricePerGram(products, cat) / 100)]),
  );

  // Top products for grid (BY_GRAM, in stock, max 8)
  const topProducts = products
    .filter((p) =>
      p.variants.some(
        (v) =>
          v.sellingMode === "BY_GRAM" &&
          v.retailPricePerGram > 0 &&
          v.availableGrams > 0,
      ),
    )
    .slice(0, 8);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.hairland.cz/#local-business",
    name: "Hairland",
    url: "https://www.hairland.cz",
    telephone: "+420608553103",
    email: "info@hairland.cz",
    image: "https://www.hairland.cz/icons/icon-512x512.png",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Školská 660/3",
      addressLocality: "Praha",
      postalCode: "110 00",
      addressCountry: "CZ",
    },
    priceRange: "500 Kč - 17 000 Kč",
    description: t("metaDesc"),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: {
      "@type": "City",
      name: "Praha",
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: "https://www.hairland.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumb"),
        item: "https://www.hairland.cz/prodlouzeni-vlasu-praha",
      },
    ],
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

      {/* 2. Proč Hairland */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("whyTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("whyText1")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("whyText2")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          {t("whyText3")}
        </p>
      </section>

      {/* 3. Kategorie vlasů */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("categoriesTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/vlasy-k-prodlouzeni?category=VIRGIN"
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
            href="/vlasy-k-prodlouzeni?category=LUXE"
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

      {/* 4. Metody prodloužení */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("methodsTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Clip-in", href: "/clip-in" as const, text: t("methodClipIn") },
            { name: "Tape-in", href: "/tape-in" as const, text: t("methodTapeIn") },
            { name: "Keratin", href: "/keratin" as const, text: t("methodKeratin") },
            { name: "Micro ring", href: "/micro-ring" as const, text: t("methodMicroRing") },
            { name: "Tresy (weft)", href: "/tresove-vlasy" as const, text: t("methodWeft") },
          ].map((method) => (
            <Link
              key={method.href}
              href={method.href}
              className="bg-nude-50 rounded-xl border border-line p-4 hover:border-blush-200 transition-colors group"
            >
              <div className="text-sm font-semibold text-ink group-hover:text-rose transition-colors mb-1">
                {method.name}
              </div>
              <p className="text-xs text-muted leading-relaxed">{method.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4b. Typy vlasů — cross-links */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("typesLinkTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/panenske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-1">{t("typeVirginTitle")}</div>
            <p className="text-sm text-muted">{t("typeVirginShort")}</p>
          </Link>
          <Link
            href="/slovanske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-1">{t("typeSlavicTitle")}</div>
            <p className="text-sm text-muted">{t("typeSlavicShort")}</p>
          </Link>
          <Link
            href="/ukrajinske-vlasy"
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-1">{t("typeUkrainianTitle")}</div>
            <p className="text-sm text-muted">{t("typeUkrainianShort")}</p>
          </Link>
        </div>
      </section>

      {/* 5. Jak vybrat odstín a gramáž */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("colorTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("colorText")}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("gramText")}
        </p>
        <Link
          href="/pruvodce-gramazi"
          className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
        >
          {t("gramLink")} →
        </Link>
      </section>

      {/* 6. Cenový přehled */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("priceTitle")}
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">
          {t("priceText")}
        </p>
        <div className="bg-nude-50 rounded-xl border border-line p-5">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            {(["STANDARD", "LUXE", "VIRGIN"] as const).map((cat) => (
              <div key={cat}>
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  {cat === "VIRGIN"
                    ? t("catVirginTitle")
                    : cat === "LUXE"
                      ? t("catLuxeTitle")
                      : t("catStandardTitle")}
                </div>
                <div className="text-lg font-bold text-ink">
                  {minPrices[cat] > 0
                    ? `od ${minPrices[cat].toLocaleString("cs-CZ")} Kč/g`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/cenik-vlasy"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("priceLink")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Produkty z DB */}
      {topProducts.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-4">
            {t("productsTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flattenProductVariants(topProducts).map((p) => (
              <ProductGridCard
                key={p._variantKey}
                product={p}
                userRole={userRole}
                discountPct={discountPct}
              />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link
              href="/vlasy-k-prodlouzeni"
              className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
            >
              {t("productsLink")} →
            </Link>
          </div>
        </section>
      )}

      {/* 8. Osobní konzultace v Praze */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink mb-3">
            {t("consultTitle")}
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-4 max-w-2xl">
            {t("consultText1")}
          </p>
          <p className="text-sm text-muted leading-relaxed mb-6 max-w-2xl">
            {t("consultText2")}
          </p>
          <div className="text-sm text-ink space-y-1 mb-6">
            <div>Tel: +420 608 553 103</div>
            <div>E-mail: info@hairland.cz</div>
            <div>Školská 660/3, Praha 1, 110 00</div>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("consultCta")}
          </Link>
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

      {/* 10. Final CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/vlasy-k-prodlouzeni"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaNabidka")}
          </Link>
          <Link
            href="/cenik-vlasy"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaCenik")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaKonzultace")}
          </Link>
        </div>
      </div>
    </div>
  );
}
