import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getCachedAllProducts } from "@/lib/cached-products";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { CITIES, getCityBySlug } from "@/lib/city-landing-data";
import { PricingByOrigin, type OriginData } from "@/components/PricingByOrigin";

type Locale = "cs" | "uk" | "ru";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  const locale = (await getLocale()) as Locale;
  const cityName = city.name[locale] ?? city.name.cs;

  const products = await getCachedAllProducts();
  const allGramPrices = products.flatMap((p) =>
    p.variants.filter((v) => v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0).map((v) => v.retailPricePerGram),
  );
  const minPrice = allGramPrices.length > 0 ? Math.round(Math.min(...allGramPrices) / 100) : 0;

  const t = await getTranslations("cityLanding");
  const title = minPrice > 0
    ? t("metaTitlePrice", { city: cityName, price: minPrice })
    : t("metaTitle", { city: cityName });
  const desc = minPrice > 0
    ? t("metaDescPrice", { city: cityName, price: minPrice })
    : t("metaDesc", { city: cityName });

  return {
    title,
    description: desc,
    alternates: getAlternates(`/prodlouzeni-vlasu/${city.slug}`, locale),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: getOgUrl(`/prodlouzeni-vlasu/${city.slug}`, locale),
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
        .filter((v) => v.retailPricePerGram > 0)
        .map((v) => v.retailPricePerGram),
    );
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export default async function CityLandingPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const locale = (await getLocale()) as Locale;
  const cityName = city.name[locale] ?? city.name.cs;

  const [t, tPrice, session, products] = await Promise.all([
    getTranslations("cityLanding"),
    getTranslations("pricelist"),
    auth(),
    getCachedAllProducts(),
  ]);

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

  const minPrices = Object.fromEntries(
    CATEGORIES.map((cat) => [cat, Math.round(getMinPricePerGram(products, cat) / 100)]),
  );

  // Origin-based pricing for tabbed price table (two columns: natural vs colored/blond)
  const BLOND_TONES = new Set(["Platinová blond", "Světlá blond", "Zlatá blond", "Medová blond"]);
  const isBlond = (tone: string | null) => tone !== null && BLOND_TONES.has(tone);

  type ColPrices = { natural: Map<number, number[]>; colored: Map<number, number[]> };
  const originMap = new Map<string, { texture: string | null; hasBlond: boolean; cols: ColPrices }>();

  for (const p of products) {
    if (!p.origin) continue;
    if (!originMap.has(p.origin)) {
      originMap.set(p.origin, { texture: p.texture, hasBlond: false, cols: { natural: new Map(), colored: new Map() } });
    }
    const entry = originMap.get(p.origin)!;
    const col = isBlond(p.colorTone) ? "colored" : "natural";
    if (col === "colored") entry.hasBlond = true;
    for (const v of p.variants) {
      if (v.sellingMode !== "BY_GRAM" || v.retailPricePerGram <= 0) continue;
      const pricePer100g = Math.round(v.retailPricePerGram); // halere/gram = Kč/100g
      const map = entry.cols[col];
      const existing = map.get(v.lengthCm);
      if (existing) existing.push(pricePer100g);
      else map.set(v.lengthCm, [pricePer100g]);
    }
  }

  const ORIGIN_DISPLAY_KEY: Record<string, string> = {
    "Írán": "originIran", "Vietnam": "originVietnam", "Indie": "originIndia",
    "Ukrajina": "originUkraine", "Turecko": "originTurkey", "Čína": "originChina",
    "Mongolsko": "originMongolia", "Gruzie": "originGeorgia", "Sýrie": "originSyria",
    "Rusko": "originRussia", "Kazachstán": "originKazakhstan", "Uzbekistán": "originUzbekistan",
    "Bělorusko": "originBelarus", "Moldavsko": "originMoldova",
  };

  const originData: OriginData[] = [...originMap.entries()]
    .map(([origin, { texture, hasBlond, cols }]) => {
      const allLengths = [...new Set([...cols.natural.keys(), ...cols.colored.keys()])].sort((a, b) => a - b);
      const rows = allLengths.map((lengthCm) => {
        const natPrices = cols.natural.get(lengthCm);
        const colPrices = cols.colored.get(lengthCm);
        return {
          lengthCm,
          naturalPrice: natPrices ? Math.min(...natPrices) : null,
          coloredPrice: colPrices ? Math.min(...colPrices) : null,
        };
      });
      const allPrices = rows.flatMap((r) => [r.naturalPrice, r.coloredPrice].filter((p): p is number => p !== null));
      const displayKey = ORIGIN_DISPLAY_KEY[origin];
      return {
        origin,
        displayName: displayKey ? tPrice(displayKey as any) : origin,
        texture,
        coloredColumnLabel: hasBlond ? tPrice("blondHair") : tPrice("dyedHair"),
        rows,
        minPrice: allPrices.length > 0 ? Math.min(...allPrices) : 0,
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);

  const pricingLabels = {
    premiumQuality: tPrice("premiumQuality"),
    length: tPrice("lengthLabel"),
    naturalHair: tPrice("naturalHair"),
    pricePer100g: tPrice("pricePer100g"),
    priceSubtitle: tPrice("priceSubtitle"),
    footerNote: tPrice("pricingFooterNote"),
  };

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

  const deliveryNote = city.deliveryNote[locale] ?? city.deliveryNote.cs;
  const consultNote = city.consultNote[locale] ?? city.consultNote.cs;

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
    description: city.description[locale] ?? city.description.cs,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    areaServed: {
      "@type": "City",
      name: city.name[locale] ?? city.name.cs,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.geo.lat,
        longitude: city.geo.lng,
      },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: city.faq.map((faqItem) => ({
      "@type": "Question",
      name: faqItem.q[locale] ?? faqItem.q.cs,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqItem.a[locale] ?? faqItem.a.cs,
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
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          { label: t("hubBreadcrumb"), href: "/prodlouzeni-vlasu" },
          { label: cityName },
        ]}
      />

      {/* 1. Hero + H1 */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("pageH1", { city: cityName })}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          {city.description[locale] ?? city.description.cs}
        </p>
      </div>

      {/* 2. Proč Hairland */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("whyTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">{t("whyText1")}</p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">{t("whyText2")}</p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl">{t("whyText3")}</p>
      </section>

      {/* 3. Kategorie vlasů */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">{t("categoriesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['kategorie', 'virgin'] } }}
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">{t("catVirginTitle")}</div>
            <p className="text-sm text-muted leading-relaxed">{t("catVirginText")}</p>
          </Link>
          <Link
            href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['kategorie', 'luxe'] } }}
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">{t("catLuxeTitle")}</div>
            <p className="text-sm text-muted leading-relaxed">{t("catLuxeText")}</p>
          </Link>
          <Link
            href={{ pathname: '/vlasy-k-prodlouzeni/[...slug]' as any, params: { slug: ['kategorie', 'standard'] } }}
            className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
          >
            <div className="text-sm font-semibold text-ink mb-2">{t("catStandardTitle")}</div>
            <p className="text-sm text-muted leading-relaxed">{t("catStandardText")}</p>
          </Link>
        </div>
      </section>

      {/* 4. Metody prodloužení */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">{t("methodsTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Clip-in", href: "/clip-in-vlasy" as const, text: t("methodClipIn") },
            { name: "Tape-in", href: "/tape-in-vlasy" as const, text: t("methodTapeIn") },
            { name: "Keratin", href: "/keratinove-vlasy" as const, text: t("methodKeratin") },
            { name: "Micro ring", href: "/micro-ring-vlasy" as const, text: t("methodMicroRing") },
            { name: "Tresy (weft)", href: "/tresove-vlasy" as const, text: t("methodWeft") },
            { name: "Clip-in ofiny", href: "/ofiny" as const, text: t("methodOfiny") },
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

      {/* 4b. Typy vlasů */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("typesLinkTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/panenske-vlasy" className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors">
            <div className="text-sm font-semibold text-ink mb-1">{t("typeVirginTitle")}</div>
            <p className="text-sm text-muted">{t("typeVirginShort")}</p>
          </Link>
          <Link href="/slovanske-vlasy" className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors">
            <div className="text-sm font-semibold text-ink mb-1">{t("typeSlavicTitle")}</div>
            <p className="text-sm text-muted">{t("typeSlavicShort")}</p>
          </Link>
          <Link href="/ukrajinske-vlasy" className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors">
            <div className="text-sm font-semibold text-ink mb-1">{t("typeUkrainianTitle")}</div>
            <p className="text-sm text-muted">{t("typeUkrainianShort")}</p>
          </Link>
        </div>
      </section>

      {/* 5. Odstín a gramáž */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("colorTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">{t("colorText")}</p>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">{t("gramText")}</p>
        <Link
          href="/pruvodce-gramazi"
          className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors"
        >
          {t("gramLink")} →
        </Link>
      </section>

      {/* 6. Kolik stojí vlasy k prodloužení */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("priceTitle")}</h2>
        <p className="text-sm text-muted leading-relaxed max-w-3xl mb-4">{t("priceText")}</p>
        <PricingByOrigin origins={originData} cenikHref="/cenik-vlasy" cenikLabel={t("priceLink")} labels={pricingLabels} />
      </section>

      {/* 7. Produkty z DB */}
      {topProducts.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-ink mb-4">{t("productsTitle")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flattenProductVariants(topProducts).map((p) => (
              <ProductGridCard key={p._variantKey} product={p} userRole={userRole} discountPct={discountPct} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/vlasy-k-prodlouzeni" className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors">
              {t("productsLink")} →
            </Link>
          </div>
        </section>
      )}

      {/* 8. Doručení + Konzultace */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink mb-3">{t("consultTitle")}</h2>
          <p className="text-sm text-muted leading-relaxed mb-2 font-medium">{t("deliveryTitle")}: {deliveryNote}</p>
          <p className="text-sm text-muted leading-relaxed mb-4">{consultNote}</p>
          <p className="text-sm text-muted leading-relaxed mb-6">{t("consultText2")}</p>
          <div className="text-sm text-ink space-y-1 mb-6">
            <div>Tel: +420 608 553 103</div>
            <div>E-mail: info@hairland.cz</div>
            <div>Školská 660/3, Praha 1, 110 00</div>
          </div>
          <Link
            href="/kontakt"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("consultCta")}
          </Link>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">{t("faqTitle")} — {cityName}</h2>
        <div className="space-y-3">
          {city.faq.map((faqItem, i) => (
            <details
              key={i}
              className="group bg-nude-50 rounded-xl border border-line overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-nude-100 transition-colors">
                <span className="text-sm font-medium text-ink pr-4">
                  {faqItem.q[locale] ?? faqItem.q.cs}
                </span>
                <svg className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-line pt-3">
                {faqItem.a[locale] ?? faqItem.a.cs}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Final CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/vlasy-k-prodlouzeni" className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors">
            {t("ctaNabidka")}
          </Link>
          <Link href="/cenik-vlasy" className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors">
            {t("ctaCenik")}
          </Link>
          <Link href="/kontakt" className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors">
            {t("ctaKonzultace")}
          </Link>
        </div>
      </div>
    </div>
  );
}
