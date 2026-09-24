import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { getCachedAllProducts } from "@/lib/cached-products";
import { PricingByOrigin, type OriginData } from "@/components/PricingByOrigin";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale, products] = await Promise.all([getTranslations("metadata"), getLocale(), getCachedAllProducts()]);
  const allGramPrices = products.flatMap((p) =>
    p.variants.filter((v) => v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0).map((v) => v.retailPricePerGram),
  );
  const minPrice = allGramPrices.length > 0 ? Math.round(Math.min(...allGramPrices) / 100) : 0;

  const title = minPrice > 0
    ? `Ceník vlasů k prodloužení 2026 — ceny od ${minPrice} Kč/g | Hairland`
    : t("cenikTitle");
  const description = t("cenikDescription");
  return {
    title,
    description,
    alternates: getAlternates("/cenik-vlasy", locale),
    openGraph: {
      type: "website",
      title,
      description,
      url: getOgUrl("/cenik-vlasy", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [{ url: "https://www.hairland.cz/og/og-home.jpg", width: 1200, height: 630, alt: "Hairland — ceník vlasů" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.hairland.cz/og/og-home.jpg"],
    },
  };
}

export default async function CenikVlasyPage() {
  const [t, tPt, locale, products] = await Promise.all([
    getTranslations("pricelist"),
    getTranslations("processingType"),
    getLocale(),
    getCachedAllProducts(),
  ]);

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
        displayName: displayKey ? t(displayKey as any) : origin,
        texture,
        coloredColumnLabel: hasBlond ? t("blondHair") : t("dyedHair"),
        rows,
        minPrice: allPrices.length > 0 ? Math.min(...allPrices) : 0,
      };
    })
    .sort((a, b) => a.minPrice - b.minPrice);

  const pricingLabels = {
    premiumQuality: t("premiumQuality"),
    length: t("lengthLabel"),
    naturalHair: t("naturalHair"),
    pricePer100g: t("pricePer100g"),
    priceSubtitle: t("priceSubtitle"),
    footerNote: t("pricingFooterNote"),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("title"),
    description: t("subtitle"),
    url: "https://www.hairland.cz/cenik-vlasy",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hairland", item: "https://www.hairland.cz" },
        { "@type": "ListItem", position: 2, name: t("title"), item: "https://www.hairland.cz/cenik-vlasy" },
      ],
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={[{ label: "Hairland", href: "/" }, { label: t("title") }]} />

      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-3">
          {t("title")}
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* ── SEO: Cost question ── */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ink mb-2">{t("costQuestion")}</h2>
          <p className="text-sm text-muted leading-relaxed max-w-2xl">{t("costAnswer")}</p>
        </div>
      </section>

      {/* ── SECTION 1: Hair prices by origin ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("hairPricesTitle")}</h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">{t("hairPricesDesc")}</p>

        <PricingByOrigin origins={originData} cenikHref="/vlasy-k-prodlouzeni" cenikLabel={t("showProducts")} labels={pricingLabels} />

        <div className="mt-4 bg-nude-50 rounded-xl border border-line p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <p className="text-xs text-muted leading-relaxed">{t("singleDonorNote")}</p>
        </div>
      </section>

      {/* ── SECTION 2: Extension services ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("extensionTitle")}</h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">{t("extensionDesc")}</p>

        <div className="bg-white rounded-2xl border border-nude-200 overflow-hidden shadow-sm">
          {/* Extension header */}
          <div className="bg-gradient-to-r from-espresso to-espresso/90 px-6 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80 mb-0.5">
              {t("indicativePricing")}
            </div>
            <h3 className="text-base font-bold text-white">{t("extensionApplication")}</h3>
          </div>

          {/* Extension rows */}
          <div className="divide-y divide-line/50">
            {[
              { label: t("upTo50g"), price: t("extensionPrice50") },
              { label: t("upTo100g"), price: t("extensionPrice100") },
              { label: t("upTo150g"), price: t("extensionPrice150") },
              { label: t("upTo200g"), price: t("extensionPrice200") },
            ].map(({ label, price }, i) => (
              <div key={label} className={`flex items-center justify-between px-6 py-3 ${i % 2 === 0 ? "bg-white" : "bg-nude-50/50"}`}>
                <span className="text-sm font-medium text-espresso">{label}</span>
                <span className="text-sm font-bold text-ink">{price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-3 bg-white">
              <span className="text-sm font-medium text-espresso">{t("shortCut")}</span>
              <span className="text-sm font-bold text-ink">{t("extensionPriceShortCut")}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="px-6 py-4 bg-nude-50/80 border-t border-nude-200">
            <p className="text-xs text-muted leading-relaxed">
              {t("extensionDisclaimer")}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted mt-3 max-w-2xl">{t("extensionNote")}</p>
      </section>

      {/* ── SECTION 3: Other services ── */}
      <section className="mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Other services card */}
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <h3 className="text-base font-semibold text-ink mb-4">{t("otherServicesTitle")}</h3>
            <div className="space-y-0">
              {[
                { label: t("removal"), price: t("priceFrom1000") },
                { label: t("removalOther"), price: t("priceFrom1000") },
                { label: t("braiding"), price: t("priceFrom1000PerHour", { perHour: t("perHour") }) },
                { label: t("headWash"), price: t("priceFrom300") },
              ].map(({ label, price }, i) => (
                <div key={i} className="flex items-center py-2.5">
                  <span className="text-sm text-ink">{label}</span>
                  <span className="flex-1 mx-3 border-b border-dotted border-line/60" />
                  <span className="text-sm font-bold text-ink whitespace-nowrap">{price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coloring card */}
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <h3 className="text-base font-semibold text-ink mb-4">{t("coloringTitle")}</h3>
            <div className="space-y-0">
              <div className="flex items-center py-2.5">
                <span className="text-sm text-ink">{t("rootColoring")}</span>
                <span className="flex-1 mx-3 border-b border-dotted border-line/60" />
                <span className="text-sm font-bold text-ink whitespace-nowrap">{t("priceFrom2000")}</span>
              </div>
              <div className="flex items-center py-2.5">
                <div className="min-w-0">
                  <span className="text-sm text-ink">{t("otherColoring")}</span>
                  <p className="text-[11px] text-muted mt-0.5">{t("otherColoringNote")}</p>
                </div>
                <span className="flex-1 mx-3 border-b border-dotted border-line/60" />
                <span className="text-sm text-muted italic whitespace-nowrap">{t("afterConsultation")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Processing types ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("processingTitle")}</h2>
        <p className="text-sm text-muted mb-5 max-w-2xl">{t("processingDesc")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {([
            { key: "clip-in", href: "/clip-in-vlasy" },
            { key: "tape-in", href: "/tape-in-vlasy" },
            { key: "keratin", href: "/keratinove-vlasy" },
            { key: "micro-ring", href: "/micro-ring-vlasy" },
            { key: "weft", href: "/tresove-vlasy" },
          ] as const).map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-nude-50 border border-line text-espresso hover:border-blush-200 hover:bg-blush-100 hover:text-rose-deep transition-all text-sm font-medium"
            >
              {tPt(`${key}.name` as any)}
            </Link>
          ))}
        </div>
      </section>

      {/* ── B2B ── */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-espresso/5 to-nude-100 rounded-2xl border border-line p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink mb-2">{t("b2bTitle")}</h2>
          <p className="text-sm text-muted mb-4 max-w-xl">{t("b2bDesc")}</p>
          <Link href="/pro" className="inline-flex items-center gap-1.5 px-4 py-2 bg-espresso text-white text-sm font-medium rounded-lg hover:bg-espresso/80 transition-colors">
            {t("b2bLink")} →
          </Link>
        </div>
      </section>

      {/* ── Useful links ── */}
      <section className="mb-14">
        <h2 className="text-base font-semibold text-ink mb-4">{t("usefulLinksTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            { href: "/pruvodce-gramazi" as any, label: t("linkGrams"), key: "grams" },
            { href: "/prodlouzeni-vlasu-praha" as any, label: t("linkPraha"), key: "praha" },
            { href: { pathname: '/poradna/[slug]' as any, params: { slug: 'typy-prodlouzeni' } }, label: t("linkTypes"), key: "types" },
            { href: { pathname: '/poradna/[slug]' as any, params: { slug: 'jak-dlouho-vydrzi' } }, label: t("linkDurability"), key: "durability" },
          ]).map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-line bg-white hover:bg-nude-50 hover:border-blush-200 transition-all text-sm text-espresso font-medium group"
            >
              <svg className="w-4 h-4 text-rose/60 flex-shrink-0 group-hover:text-rose transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-8">
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/vlasy-k-prodlouzeni" className="inline-flex items-center justify-center px-6 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors">
            {t("ctaOffer")}
          </Link>
          <Link href="/kontakt" className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-espresso border border-line hover:bg-nude-50 text-sm font-medium rounded-lg transition-colors">
            {t("ctaContact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
