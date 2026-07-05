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

  const [t, tPt, tCategory, tPublic, session, locale] = await Promise.all([
    getTranslations("public"),
    getTranslations("processingType"),
    getTranslations("category"),
    getTranslations("public"),
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
  const descKey = DESC_KEYS[slug];
  const title = tPt(titleKey);
  const description = tPt(descKey);

  // Other category slugs for internal linking
  const otherCategories = Object.keys(CATEGORY_SLUG_MAP).filter((s) => s !== slug);

  // ItemList schema.org
  const itemListJsonLd = {
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products"), href: "/offer" },
        { label: tPt(slug as "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft") },
      ]} />

      <h1 className="text-3xl font-bold text-ink mb-2">{title}</h1>
      <p className="text-muted mb-6 max-w-2xl">{description}</p>

      {/* Custom order banner */}
      <div className="bg-blush-100 border border-blush-200 rounded-xl p-5 mb-8">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">✂️</div>
          <div>
            <h2 className="font-semibold text-rose-deep mb-1">{tPt("customOrder")}</h2>
            <p className="text-sm text-espresso">
              {tPt("customOrderDesc", { type: tPt(slug as "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft").toLowerCase() })}
            </p>
          </div>
        </div>
      </div>

      {productsWithStock.length > 0 ? (
        <>
          <p className="text-sm text-muted mb-4">
            {tPt("productsInCategory", { count: productsWithStock.length })}
          </p>
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
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted mb-4">{tPt("noProducts")}</p>
          <Link
            href="/offer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose text-white hover:bg-rose-deep transition-colors"
          >
            {tPt("noProductsCta")}
          </Link>
        </div>
      )}

      {/* Other processing type categories */}
      <section className="mt-12 pt-8 border-t border-line">
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
