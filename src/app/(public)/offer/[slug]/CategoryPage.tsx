import Link from "next/link";
import type { ProcessingType } from "@prisma/client";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { getAllStockNumbers } from "@/lib/stock";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProductGridCard } from "@/components/public/ProductGridCard";

export const CATEGORY_SLUG_MAP: Record<string, ProcessingType> = {
  "clip-in": "CLIP_IN",
  "tape-in": "TAPE_IN",
  "keratin": "KERATIN",
  "micro-ring": "MICRO_RING",
  "weft": "WEFT",
};

const TITLE_KEYS: Record<string, string> = {
  "clip-in": "clipInTitle",
  "tape-in": "tapeInTitle",
  "keratin": "keratinTitle",
  "micro-ring": "microRingTitle",
  "weft": "weftTitle",
};

const DESC_KEYS: Record<string, string> = {
  "clip-in": "clipInDesc",
  "tape-in": "tapeInDesc",
  "keratin": "keratinDesc",
  "micro-ring": "microRingDesc",
  "weft": "weftDesc",
};

const META_KEYS: Record<string, string> = {
  "clip-in": "clipInMeta",
  "tape-in": "tapeInMeta",
  "keratin": "keratinMeta",
  "micro-ring": "microRingMeta",
  "weft": "weftMeta",
};

export function isCategorySlug(slug: string): boolean {
  return slug in CATEGORY_SLUG_MAP;
}

export async function generateCategoryMetadata(slug: string) {
  const t = await getTranslations("processingType");
  const titleKey = TITLE_KEYS[slug];
  const metaKey = META_KEYS[slug];

  const title = t(titleKey);
  const description = t(metaKey);

  return {
    title,
    description,
    alternates: { canonical: `/offer/${slug}` },
    openGraph: {
      type: "website" as const,
      title: `${title} | Hairland`,
      description,
      url: `https://www.hairland.cz/offer/${slug}`,
      siteName: "Hairland",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | Hairland`,
      description,
    },
  };
}

export async function CategoryLandingPage({ slug }: { slug: string }) {
  const processingType = CATEGORY_SLUG_MAP[slug];

  const [t, tPt, session, locale] = await Promise.all([
    getTranslations("public"),
    getTranslations("processingType"),
    auth(),
    getLocale(),
  ]);

  // Fetch products filtered by processingType — server-side
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
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    getAllStockNumbers(),
  ]);

  // Resolve user pricing
  let userRole: string | null = null;
  let discountPct = 0;
  if ((session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") && session?.user?.salonId) {
    userRole = session.user.role;
    const salon = await prisma.salon.findUnique({
      where: { id: session.user.salonId },
      select: { tier: true, type: true },
    });
    if (salon) {
      discountPct = await getLoyaltyDiscount(salon.tier, salon.type);
    }
  }

  const productsWithStock = products.map((p) => ({
    ...p,
    photos: JSON.parse(p.photos || "[]") as string[],
    variants: p.variants.map((v) => ({
      ...v,
      sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
      availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
      availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
    })),
  }));

  const titleKey = TITLE_KEYS[slug];
  const title = tPt(titleKey);

  // Other category slugs for internal linking
  const otherCategories = Object.keys(CATEGORY_SLUG_MAP).filter((s) => s !== slug);

  // Schema.org
  const itemListJsonLd = productsWithStock.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
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
  const faqKeys = ["faq1q", "faq1a", "faq2q", "faq2a", "faq3q", "faq3a"] as const;
  const faqItems = [
    { q: tPt(`${slug}.faq1q` as any), a: tPt(`${slug}.faq1a` as any) },
    { q: tPt(`${slug}.faq2q` as any), a: tPt(`${slug}.faq2a` as any) },
    { q: tPt(`${slug}.faq3q` as any), a: tPt(`${slug}.faq3a` as any) },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const s = slug as "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products"), href: "/offer" },
        { label: tPt(s) },
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
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["adv1", "adv2", "adv3", "adv4"] as const).map((key) => (
          <div key={key} className="bg-nude-50 rounded-xl p-5">
            <div className="text-2xl mb-2">{tPt(`${slug}.${key}Icon` as any)}</div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("lifespan")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.lifespan` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("reapplication")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.reapplication` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <div className="text-2xl mb-1">⏱</div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("applicationTime")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.appTime` as any)}</div>
        </div>
        <div className="text-center p-4 bg-nude-50 rounded-xl">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{tPt("priceRange")}</div>
          <div className="font-bold text-ink">{tPt(`${slug}.price` as any)}</div>
        </div>
      </div>

      {/* Custom order banner */}
      <div className="bg-blush-100 border border-blush-200 rounded-xl p-5 mb-10">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">✂️</div>
          <div>
            <h2 className="font-semibold text-rose-deep mb-1">{tPt("customOrder")}</h2>
            <p className="text-sm text-espresso">
              {tPt("customOrderDesc", { type: tPt(s).toLowerCase() })}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsWithStock.map((p) => (
              <ProductGridCard
                key={p.id}
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
              href={`/offer/${catSlug}`}
              className="px-4 py-2 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium"
            >
              {tPt(catSlug as "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft")}
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
