import { Link } from "@/i18n/navigation";
import type { ProcessingType } from "@prisma/client";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getAllStockNumbers } from "@/lib/stock";
import { unstable_cache } from "next/cache";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export const CATEGORY_SLUG_MAP: Record<string, ProcessingType> = {
  "clip-in": "CLIP_IN",
  "tape-in": "TAPE_IN",
  "keratin": "KERATIN",
  "micro-ring": "MICRO_RING",
  "weft": "WEFT",
  "ofiny": "BANGS",
};

/** Maps old offer slug to standalone URL path */
export const CATEGORY_STANDALONE_PATHS: Record<string, string> = {
  "clip-in": "/clip-in",
  "tape-in": "/tape-in",
  "keratin": "/keratin",
  "micro-ring": "/micro-ring",
  "weft": "/tresove-vlasy",
  "ofiny": "/ofiny",
};

const TITLE_KEYS: Record<string, string> = {
  "clip-in": "clipInTitle",
  "tape-in": "tapeInTitle",
  "keratin": "keratinTitle",
  "micro-ring": "microRingTitle",
  "weft": "weftTitle",
  "ofiny": "ofinyTitle",
};

const DESC_KEYS: Record<string, string> = {
  "clip-in": "clipInDesc",
  "tape-in": "tapeInDesc",
  "keratin": "keratinDesc",
  "micro-ring": "microRingDesc",
  "weft": "weftDesc",
  "ofiny": "ofinyDesc",
};

const META_KEYS: Record<string, string> = {
  "clip-in": "clipInMeta",
  "tape-in": "tapeInMeta",
  "keratin": "keratinMeta",
  "micro-ring": "microRingMeta",
  "weft": "weftMeta",
  "ofiny": "ofinyMeta",
};

const CATEGORY_OG_IMAGES: Record<string, string> = {
  "clip-in": "https://www.hairland.cz/og/og-clip-in.jpg",
  "tape-in": "https://www.hairland.cz/og/og-tape-in.jpg",
  "keratin": "https://www.hairland.cz/og/og-keratin.jpg",
  "micro-ring": "https://www.hairland.cz/og/og-micro-ring.jpg",
  "weft": "https://www.hairland.cz/og/og-tresove-vlasy.jpg",
  "ofiny": "https://www.hairland.cz/og/og-ofiny.jpg",
};

export function isCategorySlug(slug: string): boolean {
  return slug in CATEGORY_SLUG_MAP;
}

export async function generateCategoryMetadata(slug: string) {
  const [t, locale] = await Promise.all([getTranslations("processingType"), getLocale()]);
  const titleKey = TITLE_KEYS[slug];
  const metaKey = META_KEYS[slug];

  const title = t(titleKey);
  const description = t(metaKey);

  const canonicalPath = CATEGORY_STANDALONE_PATHS[slug] ?? `/offer/${slug}`;

  return {
    title,
    description,
    alternates: getAlternates(canonicalPath),
    openGraph: {
      type: "website" as const,
      title: `${title} | Hairland`,
      description,
      url: `https://www.hairland.cz${canonicalPath}`,
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [{ url: CATEGORY_OG_IMAGES[slug] ?? "https://www.hairland.cz/og/og-offer.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | Hairland`,
      description,
      images: [CATEGORY_OG_IMAGES[slug] ?? "https://www.hairland.cz/og/og-offer.jpg"],
    },
  };
}

const getCachedCategoryProducts = unstable_cache(
  async (processingType: ProcessingType) => {
    const [products, stockMap] = await Promise.all([
      prisma.product.findMany({
        where: {
          archived: false,
          processingType,
          variants: { some: { active: true } },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          nameUk: true,
          nameRu: true,
          category: true,
          origin: true,
          texture: true,
          colorTone: true,
          photos: true,
          variants: {
            where: { active: true },
            select: {
              id: true,
              lengthCm: true,
              color: true,
              retailPricePerGram: true,
              wholesalePricePerGram: true,
              sellingMode: true,
              retailPricePerPiece: true,
              availableToOrder: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      getAllStockNumbers(),
    ]);

    return products.map((p) => ({
      ...p,
      photos: JSON.parse(p.photos || "[]") as string[],
      variants: p.variants.map((v) => ({
        ...v,
        sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
        availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
        availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
        exclusivePieces: stockMap.get(v.id)?.exclusivePieces ?? 0,
      })),
    }));
  },
  ["category-products"],
  { revalidate: 60, tags: ["products"] }
);

export async function CategoryLandingPage({ slug, standalone }: { slug: string; standalone?: boolean }) {
  const processingType = CATEGORY_SLUG_MAP[slug];

  const [t, tPt, session, locale, productsWithStock] = await Promise.all([
    getTranslations("public"),
    getTranslations("processingType"),
    auth(),
    getLocale(),
    getCachedCategoryProducts(processingType),
  ]);

  // Resolve user pricing
  let userRole: string | null = null;
  let discountPct = 0;
  if (session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") {
    userRole = session.user.role;
    const b2bSettings = await getCachedB2BSettings();
    discountPct = userRole === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
  }

  const titleKey = TITLE_KEYS[slug];
  const title = tPt(titleKey);

  // Other category slugs for internal linking
  const otherCategories = Object.keys(CATEGORY_SLUG_MAP).filter((s) => s !== slug);

  // Schema.org
  const itemListJsonLd = productsWithStock.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    inLanguage: locale,
    numberOfItems: productsWithStock.length,
    itemListElement: productsWithStock.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.hairland.cz/offer/${p.slug ?? p.id}`,
      name: p.name,
      ...(p.photos.length > 0 ? { image: p.photos[0] } : {}),
    })),
  } : null;

  // FAQ schema
  const faqItems = Array.from({ length: 6 }, (_, i) => ({
    q: tPt(`${slug}.faq${i + 1}q` as any) as string,
    a: tPt(`${slug}.faq${i + 1}a` as any) as string,
  })).filter((f) => !f.q.includes(".faq"));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const s = slug as "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft" | "ofiny";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Breadcrumbs items={standalone ? [
        { label: t("nav.home"), href: "/" },
        { label: tPt(`${s}.name` as any) },
      ] : [
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products"), href: "/offer" },
        { label: tPt(`${s}.name` as any) },
      ]} />

      {/* Hero */}
      <h1 className="text-3xl font-bold text-ink mb-3">{title}</h1>
      <p className="text-muted mb-8 max-w-3xl text-lg leading-relaxed">{tPt(`${slug}.intro` as any)}</p>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">{tPt(`${slug}.howTitle` as any)}</h2>
        <p className="text-muted leading-relaxed max-w-3xl">{tPt(`${slug}.howText` as any)}</p>
      </section>

      {/* Advantages */}
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(["adv1", "adv2", "adv3", "adv4"] as const).map((key) => (
          <div key={key} className="bg-nude-50 rounded-xl p-5">
            <div className="w-8 h-8 rounded-full bg-blush-100 flex items-center justify-center mb-2"><span className="text-rose-deep font-bold text-sm">{(["adv1", "adv2", "adv3", "adv4"] as const).indexOf(key) + 1}</span></div>
            <h3 className="font-semibold text-ink text-sm mb-1">{tPt(`${slug}.${key}Title` as any)}</h3>
            <p className="text-muted text-sm">{tPt(`${slug}.${key}Text` as any)}</p>
          </div>
        ))}
      </section>

      {/* Who is it for + Care tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-blush-50 rounded-xl p-6">
          <h2 className="font-bold text-ink mb-3">{tPt(`${slug}.forWhomTitle` as any)}</h2>
          <p className="text-muted text-sm leading-relaxed">{tPt(`${slug}.forWhomText` as any)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-6">
          <h2 className="font-bold text-ink mb-3">{tPt(`${slug}.careTitle` as any)}</h2>
          <p className="text-muted text-sm leading-relaxed">{tPt(`${slug}.careText` as any)}</p>
        </div>
      </div>

      {/* Lifespan + Price range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <svg className="w-6 h-6 mx-auto mb-1 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("lifespan")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.lifespan` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <svg className="w-6 h-6 mx-auto mb-1 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("reapplication")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.reapplication` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <svg className="w-6 h-6 mx-auto mb-1 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("applicationTime")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.appTime` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <svg className="w-6 h-6 mx-auto mb-1 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("priceRange")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.price` as any)}</div>
        </div>
      </div>

      {/* Custom order banner */}
      <div className="bg-blush-100 border border-blush-200 rounded-xl p-5 mb-10">
        <div className="flex gap-4 items-start">
          <svg className="w-7 h-7 flex-shrink-0 text-rose-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" /></svg>
          <div>
            <h2 className="font-semibold text-rose-deep mb-1">{tPt("customOrder")}</h2>
            <p className="text-sm text-espresso">
              {tPt("customOrderDesc", { type: (tPt(`${s}.name` as any) as string).toLowerCase() })}
            </p>
            <Link href="/contact" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-rose hover:text-rose-deep transition-colors">
              {tPt("contactUs")} →
            </Link>
          </div>
        </div>
      </div>

      {/* Products */}
      {productsWithStock.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-4">
            {tPt("productsInCategory", { count: productsWithStock.length })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flattenProductVariants(productsWithStock).map((p) => (
              <ProductGridCard
                key={p._variantKey}
                product={p}
                userRole={userRole}
                discountPct={discountPct}
              />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-ink mb-4">{tPt("faqTitle")}</h2>
        <div className="space-y-4">
          {faqItems.map((faq, i) => (
            <details key={i} className="group bg-nude-50 rounded-xl">
              <summary className="cursor-pointer p-5 font-medium text-ink flex items-center justify-between">
                {faq.q}
                <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-5 pb-5 text-muted text-sm leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Other categories */}
      <section className="pt-8 border-t border-line">
        <h2 className="text-lg font-bold text-ink mb-4">{tPt("otherCategories")}</h2>
        <div className="flex flex-wrap gap-3">
          {otherCategories.map((catSlug) => (
            <Link
              key={catSlug}
              href={CATEGORY_STANDALONE_PATHS[catSlug] ?? `/offer/${catSlug}`}
              className="px-4 py-2 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium"
            >
              {tPt(`${catSlug}.name` as any)}
            </Link>
          ))}
          <Link
            href="/offer"
            className="px-4 py-2 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium"
          >
            {tPt("allProducts")}
          </Link>
        </div>
      </section>
    </div>
  );
}
