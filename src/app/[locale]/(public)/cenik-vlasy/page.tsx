import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";
import { getCachedAllProducts } from "@/lib/cached-products";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("cenikTitle"),
    description: t("cenikDescription"),
    alternates: getAlternates("/cenik-vlasy"),
    openGraph: {
      type: "website",
      title: `${t("cenikTitle")} | Hairland`,
      description: t("cenikDescription"),
      url: "https://www.hairland.cz/cenik-vlasy",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [{ url: "https://www.hairland.cz/og/og-home.jpg", width: 1200, height: 630, alt: "Hairland — ceník vlasů" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("cenikTitle")} | Hairland`,
      description: t("cenikDescription"),
      images: ["https://www.hairland.cz/og/og-home.jpg"],
    },
  };
}

const CATEGORY_ORDER = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;
const TEXTURE_ORDER = ["Rovné", "Mírně vlnité", "Vlnité"] as const;

const CATEGORY_STYLES: Record<string, { pill: string; card: string }> = {
  VIRGIN: { pill: "bg-amber-100 text-amber-800", card: "border-amber-200/60" },
  LUXE: { pill: "bg-violet-100 text-violet-800", card: "border-violet-200/60" },
  STANDARD: { pill: "bg-emerald-100 text-emerald-800", card: "border-emerald-200/60" },
  SALE: { pill: "bg-rose-100 text-rose-800", card: "border-rose-200/60" },
};

const TEXTURE_ICONS: Record<string, string> = {
  "Rovné": "━━━",
  "Mírně vlnité": "〜〜",
  "Vlnité": "∿∿∿",
};

type PriceRow = {
  lengthCm: number;
  colorTone: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
};

type TextureGroup = {
  texture: string;
  rows: PriceRow[];
};

type CategoryData = {
  category: string;
  textures: TextureGroup[];
  productCount: number;
};

function fmtPrice(halere: number): string {
  return Math.round(halere / 100).toLocaleString("cs-CZ");
}

function buildPriceData(
  products: Awaited<ReturnType<typeof getCachedAllProducts>>,
): CategoryData[] {
  const result: CategoryData[] = [];

  for (const cat of CATEGORY_ORDER) {
    const catProducts = products.filter(
      (p) => p.category === cat && p.variants.some((v) => v.retailPricePerGram > 0 && v.sellingMode === "BY_GRAM"),
    );
    if (catProducts.length === 0) continue;

    // Group by texture → length+colorTone
    const textureMap = new Map<string, Map<string, { prices: number[]; hasStock: boolean }>>();

    for (const p of catProducts) {
      const texture = p.texture || "Rovné";
      if (!textureMap.has(texture)) textureMap.set(texture, new Map());
      const lengthMap = textureMap.get(texture)!;

      for (const v of p.variants) {
        if (v.sellingMode !== "BY_GRAM" || v.retailPricePerGram <= 0) continue;
        const colorTone = p.colorTone || "—";
        const key = `${v.lengthCm}|${colorTone}`;
        const existing = lengthMap.get(key);
        if (existing) {
          existing.prices.push(v.retailPricePerGram);
          if (v.availableGrams > 0) existing.hasStock = true;
        } else {
          lengthMap.set(key, { prices: [v.retailPricePerGram], hasStock: v.availableGrams > 0 });
        }
      }
    }

    const textures: TextureGroup[] = [];
    for (const tex of TEXTURE_ORDER) {
      const lengthMap = textureMap.get(tex);
      if (!lengthMap || lengthMap.size === 0) continue;

      const rows: PriceRow[] = [...lengthMap.entries()]
        .map(([key, data]) => {
          const [lengthStr, colorTone] = key.split("|");
          const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
          return {
            lengthCm: Number(lengthStr),
            colorTone,
            avgPrice: Math.round(avg),
            minPrice: Math.min(...data.prices),
            maxPrice: Math.max(...data.prices),
            inStock: data.hasStock,
          };
        })
        .sort((a, b) => a.lengthCm - b.lengthCm || a.colorTone.localeCompare(b.colorTone));

      textures.push({ texture: tex, rows });
    }

    // Also pick up textures not in the standard order
    for (const [tex, lengthMap] of textureMap) {
      if (TEXTURE_ORDER.includes(tex as any) || lengthMap.size === 0) continue;
      const rows: PriceRow[] = [...lengthMap.entries()]
        .map(([key, data]) => {
          const [lengthStr, colorTone] = key.split("|");
          const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
          return {
            lengthCm: Number(lengthStr),
            colorTone,
            avgPrice: Math.round(avg),
            minPrice: Math.min(...data.prices),
            maxPrice: Math.max(...data.prices),
            inStock: data.hasStock,
          };
        })
        .sort((a, b) => a.lengthCm - b.lengthCm);
      textures.push({ texture: tex, rows });
    }

    if (textures.length === 0) continue;
    result.push({ category: cat, textures, productCount: catProducts.length });
  }

  return result;
}

export default async function CenikVlasyPage() {
  const [t, tCat, tPt, locale, products] = await Promise.all([
    getTranslations("pricelist"),
    getTranslations("category"),
    getTranslations("processingType"),
    getLocale(),
    getCachedAllProducts(),
  ]);

  const priceData = buildPriceData(products);

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

      {/* Hero — logo + title */}
      <div className="text-center mb-10">
        <Image
          src="/logo-light.svg"
          alt="Hairland"
          width={80}
          height={80}
          className="h-14 w-auto mx-auto mb-5"
          unoptimized
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-2">
          {t("title")}
        </h1>
        <p className="text-muted max-w-lg mx-auto text-sm leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* ── SECTION 1: Hair prices ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("hairPricesTitle")}</h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">{t("hairPricesDesc")}</p>

        <div className="space-y-6">
          {priceData.map(({ category, textures, productCount }) => {
            const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.STANDARD;
            return (
              <div key={category} className={`bg-white rounded-xl border ${style.card} p-5`}>
                {/* Category header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.pill}`}>
                      {tCat(category.toLowerCase())}
                    </span>
                    <span className="text-xs text-muted">{productCount} {t("products")}</span>
                  </div>
                  <Link
                    href={`/offer?category=${category}`}
                    className="text-xs text-rose hover:text-rose-deep font-medium transition-colors"
                  >
                    {t("showProducts")} →
                  </Link>
                </div>

                {/* Texture sub-sections */}
                <div className="space-y-5">
                  {textures.map(({ texture, rows }) => (
                    <div key={texture}>
                      {/* Texture label */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-sm text-muted font-mono tracking-wider" aria-hidden>
                          {TEXTURE_ICONS[texture] ?? "—"}
                        </span>
                        <span className="text-sm font-semibold text-ink">{texture}</span>
                      </div>

                      {/* Price rows */}
                      <div className="divide-y divide-nude-100/80">
                        {rows.map((row, i) => {
                          const pricePer100 = row.minPrice === row.maxPrice
                            ? `${fmtPrice(row.avgPrice * 100)} Kč`
                            : `${fmtPrice(row.minPrice * 100)}–${fmtPrice(row.maxPrice * 100)} Kč`;

                          return (
                            <div key={`${row.lengthCm}-${row.colorTone}-${i}`} className="flex items-center justify-between py-2.5 group">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-sm font-medium text-ink w-14 flex-shrink-0">{row.lengthCm} cm</span>
                                <span className="text-xs text-espresso/50 truncate">{row.colorTone}</span>
                                {row.inStock ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title={t("inStock")} />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title={t("toOrder")} />
                                )}
                              </div>
                              <span className="flex-1 mx-3 border-b border-dotted border-nude-200/60" />
                              <span className="text-sm font-bold text-ink flex-shrink-0">{pricePer100}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted mt-4 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          {t("priceNote")}
        </p>
      </section>

      {/* ── SECTION 2: Extension & services ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("extensionTitle")}</h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">{t("extensionDesc")}</p>

        <div className="bg-white rounded-xl border border-line p-5 mb-4">
          {[
            { label: "do 50 g", price: "4 000 Kč" },
            { label: "do 100 g", price: "5 500 Kč" },
            { label: "do 150 g", price: "6 500 Kč" },
            { label: "do 200 g", price: "7 500 Kč" },
          ].map(({ label, price }, i) => (
            <div key={label} className={`flex items-center py-2.5 ${i > 0 ? "mt-1" : ""}`}>
              <span className="text-sm text-ink">{label}</span>
              <span className="flex-1 mx-3 border-b border-dotted border-nude-300/50" />
              <span className="text-sm font-bold text-ink">{price}</span>
            </div>
          ))}
          <div className="flex items-center py-2.5 mt-1">
            <span className="text-sm text-ink">{t("shortCut")}</span>
            <span className="flex-1 mx-3 border-b border-dotted border-nude-300/50" />
            <span className="text-sm font-bold text-ink">9 000 Kč</span>
          </div>
        </div>
        <p className="text-xs text-muted mb-8 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          {t("extensionNote")}
        </p>

        {/* Other services */}
        <h3 className="text-base font-semibold text-ink mb-3">{t("otherServicesTitle")}</h3>
        <div className="bg-white rounded-xl border border-line p-5 mb-6">
          {[
            { label: t("removal"), price: "1 000 Kč" },
            { label: t("removalOther"), price: "1 000 Kč" },
            { label: t("braiding"), price: `1 000 Kč / ${t("perHour")}` },
            { label: t("headWash"), price: "300 Kč" },
          ].map(({ label, price }, i) => (
            <div key={i} className={`flex items-center py-2.5 ${i > 0 ? "mt-1" : ""}`}>
              <span className="text-sm text-ink">{label}</span>
              <span className="flex-1 mx-3 border-b border-dotted border-nude-300/50" />
              <span className="text-sm font-bold text-ink whitespace-nowrap">{price}</span>
            </div>
          ))}
        </div>

        {/* Coloring */}
        <h3 className="text-base font-semibold text-ink mb-3">{t("coloringTitle")}</h3>
        <div className="bg-white rounded-xl border border-line p-5">
          <div className="flex items-center py-2.5">
            <span className="text-sm text-ink">{t("rootColoring")}</span>
            <span className="flex-1 mx-3 border-b border-dotted border-nude-300/50" />
            <span className="text-sm font-bold text-ink whitespace-nowrap">{t("coloringFrom")} 2 000 Kč</span>
          </div>
          <div className="flex items-center py-2.5 mt-1">
            <div className="min-w-0">
              <span className="text-sm text-ink">{t("otherColoring")}</span>
              <p className="text-xs text-muted mt-0.5">{t("otherColoringNote")}</p>
            </div>
            <span className="flex-1 mx-3 border-b border-dotted border-nude-300/50" />
            <span className="text-sm text-muted italic whitespace-nowrap">{t("afterConsultation")}</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Processing types ── */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">{t("processingTitle")}</h2>
        <p className="text-sm text-muted mb-5">{t("processingDesc")}</p>
        <div className="flex flex-wrap gap-2">
          {([
            { key: "clip-in", href: "/clip-in" },
            { key: "tape-in", href: "/tape-in" },
            { key: "keratin", href: "/keratin" },
            { key: "micro-ring", href: "/micro-ring" },
            { key: "weft", href: "/tresove-vlasy" },
          ] as const).map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="px-3 py-1.5 rounded-lg bg-nude-50 border border-nude-200 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-all text-sm font-medium"
            >
              {tPt(`${key}.name` as any)}
            </Link>
          ))}
        </div>
      </section>

      {/* ── B2B ── */}
      <section className="mb-10 bg-espresso/5 rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink mb-2">{t("b2bTitle")}</h2>
        <p className="text-sm text-muted mb-3">{t("b2bDesc")}</p>
        <Link href="/pro" className="inline-flex items-center gap-1 text-sm text-rose hover:text-rose-deep font-medium transition-colors">
          {t("b2bLink")} →
        </Link>
      </section>

      {/* ── CTA ── */}
      <section className="text-center">
        <p className="text-sm text-muted mb-4">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/offer" className="px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors">
            {t("ctaOffer")}
          </Link>
          <Link href="/contact" className="px-5 py-2.5 bg-white text-espresso border border-line hover:bg-nude-50 text-sm font-medium rounded-lg transition-colors">
            {t("ctaContact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
