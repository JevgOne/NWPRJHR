import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";
import { getCachedAllProducts } from "@/lib/cached-products";
import { formatCZK } from "@/lib/pricing";

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
      images: [
        {
          url: "https://www.hairland.cz/og/og-home.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — ceník vlasů k prodloužení",
        },
      ],
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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; headerBg: string }> = {
  VIRGIN: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", headerBg: "bg-amber-100" },
  LUXE: { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200", headerBg: "bg-violet-100" },
  STANDARD: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", headerBg: "bg-emerald-100" },
  SALE: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", headerBg: "bg-rose-100" },
};

type PriceRow = {
  lengthCm: number;
  avgPricePerGram: number;
  minPricePerGram: number;
  maxPricePerGram: number;
  variantCount: number;
  inStock: boolean;
};

type CategoryData = {
  category: string;
  rows: PriceRow[];
  avgOverall: number;
  productCount: number;
};

function buildPriceData(
  products: Awaited<ReturnType<typeof getCachedAllProducts>>,
): CategoryData[] {
  const result: CategoryData[] = [];

  for (const cat of CATEGORY_ORDER) {
    const catProducts = products.filter(
      (p) => p.category === cat && p.variants.some((v) => v.retailPricePerGram > 0),
    );
    if (catProducts.length === 0) continue;

    // Group BY_GRAM variants by length
    const byLength = new Map<number, { prices: number[]; hasStock: boolean }>();
    for (const p of catProducts) {
      for (const v of p.variants) {
        if (v.sellingMode !== "BY_GRAM" || v.retailPricePerGram <= 0) continue;
        const existing = byLength.get(v.lengthCm);
        if (existing) {
          existing.prices.push(v.retailPricePerGram);
          if (v.availableGrams > 0) existing.hasStock = true;
        } else {
          byLength.set(v.lengthCm, {
            prices: [v.retailPricePerGram],
            hasStock: v.availableGrams > 0,
          });
        }
      }
    }

    const rows: PriceRow[] = [...byLength.entries()]
      .sort(([a], [b]) => a - b)
      .map(([lengthCm, data]) => {
        const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        return {
          lengthCm,
          avgPricePerGram: Math.round(avg),
          minPricePerGram: Math.min(...data.prices),
          maxPricePerGram: Math.max(...data.prices),
          variantCount: data.prices.length,
          inStock: data.hasStock,
        };
      });

    if (rows.length === 0) continue;

    const allPrices = rows.flatMap((r) => Array(r.variantCount).fill(r.avgPricePerGram));
    const avgOverall = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

    result.push({
      category: cat,
      rows,
      avgOverall,
      productCount: catProducts.length,
    });
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

  // JSON-LD
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Hairland", href: "/" },
          { label: t("title") },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-2">
        {t("title")}
      </h1>
      <p className="text-muted text-sm sm:text-base mb-8 max-w-2xl">
        {t("subtitle")}
      </p>

      {/* Info banner */}
      <div className="bg-blush-50 border border-blush-200 rounded-xl p-4 sm:p-5 mb-8">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div>
            <p className="text-sm text-espresso font-medium">{t("infoTitle")}</p>
            <p className="text-xs text-muted mt-1">{t("infoDesc")}</p>
          </div>
        </div>
      </div>

      {/* Price tables per category */}
      <div className="space-y-8">
        {priceData.map(({ category, rows, avgOverall, productCount }) => {
          const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.STANDARD;
          return (
            <section key={category}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
                    {tCat(category.toLowerCase())}
                  </span>
                  <span className="text-xs text-muted">
                    {productCount} {t("products")}
                  </span>
                </div>
                <Link
                  href={`/offer?category=${category}`}
                  className="text-xs text-rose hover:text-rose-deep font-medium transition-colors"
                >
                  {t("showProducts")} →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full text-sm border ${style.border} rounded-xl overflow-hidden`}>
                  <thead>
                    <tr className={style.headerBg}>
                      <th className="text-left px-4 py-3 font-semibold text-ink">{t("length")}</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink">{t("pricePerGram")}</th>
                      <th className="text-right px-4 py-3 font-semibold text-ink">{t("pricePer100g")}</th>
                      <th className="text-center px-4 py-3 font-semibold text-ink">{t("availability")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nude-100">
                    {rows.map((row) => (
                      <tr key={row.lengthCm} className="hover:bg-nude-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-ink">
                          {row.lengthCm} cm
                        </td>
                        <td className="px-4 py-3 text-right text-espresso">
                          {row.minPricePerGram === row.maxPricePerGram ? (
                            <>{formatCZK(row.avgPricePerGram)}/g</>
                          ) : (
                            <>{formatCZK(row.minPricePerGram)}–{formatCZK(row.maxPricePerGram)}/g</>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {row.minPricePerGram === row.maxPricePerGram ? (
                            <>{formatCZK(row.avgPricePerGram * 100)}</>
                          ) : (
                            <>{formatCZK(row.minPricePerGram * 100)}–{formatCZK(row.maxPricePerGram * 100)}</>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.inStock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {t("inStock")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              {t("toOrder")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {/* Extension service pricing */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-bold text-ink mb-4">
          {t("extensionTitle")}
        </h2>
        <p className="text-sm text-muted mb-5">{t("extensionDesc")}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-espresso/15 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-espresso/5">
                <th className="text-left px-4 py-3 font-semibold text-ink">{t("extensionService")}</th>
                <th className="text-right px-4 py-3 font-semibold text-ink">{t("extensionPrice")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nude-100">
              <tr className="hover:bg-nude-50 transition-colors">
                <td className="px-4 py-3 text-ink">
                  <div className="font-medium">{t("extensionBase")}</div>
                  <div className="text-xs text-muted mt-0.5">{t("extensionBaseNote")}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink whitespace-nowrap">5 500 Kč</td>
              </tr>
              <tr className="hover:bg-nude-50 transition-colors">
                <td className="px-4 py-3 text-ink">
                  <div className="font-medium">{t("extensionExtra")}</div>
                  <div className="text-xs text-muted mt-0.5">{t("extensionExtraNote")}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink whitespace-nowrap">3 000 Kč</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Example calculations */}
        <div className="mt-4 bg-nude-50 rounded-xl border border-nude-200 p-4 sm:p-5">
          <p className="text-xs font-semibold text-espresso uppercase tracking-wider mb-3">{t("extensionExample")}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">100 g</span>
              <span className="font-medium text-ink">5 500 Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">150 g</span>
              <span className="font-medium text-ink">8 500 Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">200 g</span>
              <span className="font-medium text-ink">11 500 Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">250 g</span>
              <span className="font-medium text-ink">14 500 Kč</span>
            </div>
          </div>
        </div>
      </section>

      {/* Processing types section */}
      <section className="mt-12">
        <h2 className="text-lg sm:text-xl font-bold text-ink mb-4">
          {t("processingTitle")}
        </h2>
        <p className="text-sm text-muted mb-4">{t("processingDesc")}</p>
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

      {/* B2B note */}
      <section className="mt-10 bg-espresso/5 rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink mb-2">{t("b2bTitle")}</h2>
        <p className="text-sm text-muted mb-3">{t("b2bDesc")}</p>
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 text-sm text-rose hover:text-rose-deep font-medium transition-colors"
        >
          {t("b2bLink")} →
        </Link>
      </section>

      {/* CTA */}
      <section className="mt-10 text-center">
        <p className="text-sm text-muted mb-4">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/offer"
            className="px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("ctaOffer")}
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-white text-espresso border border-line hover:bg-nude-50 text-sm font-medium rounded-lg transition-colors"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
