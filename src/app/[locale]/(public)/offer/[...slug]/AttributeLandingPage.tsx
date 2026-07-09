import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { getAllStockNumbers } from "@/lib/stock";
import { unstable_cache } from "next/cache";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import type { AttributeType } from "@/lib/attribute-slugs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";
import {
  ATTRIBUTE_PREFIX_MAP,
  COLOR_TONE_SLUG_MAP,
  TEXTURE_SLUG_MAP,
  CATEGORY_SLUG_MAP_SEO,
  ORIGIN_SLUG_MAP,
} from "@/lib/attribute-slugs";

interface AttributeLandingPageProps {
  prefix: string;
  valueSlug: string;
  attrType: AttributeType;
  dbValue: string | number;
}

const getCachedAttributeProducts = unstable_cache(
  async (attrType: AttributeType, dbValue: string | number) => {
    const where: Record<string, unknown> = { archived: false, variants: { some: { active: true } } };

    switch (attrType) {
      case "colorTone":
        where.colorTone = dbValue;
        break;
      case "texture":
        where.texture = dbValue;
        break;
      case "category":
        where.category = dbValue;
        break;
      case "origin":
        where.origin = dbValue;
        break;
      case "length":
        where.variants = { some: { active: true, lengthCm: dbValue } };
        break;
    }

    const [products, stockMap] = await Promise.all([
      prisma.product.findMany({
        where,
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

    return products.map((p) => ({
      ...p,
      photos: JSON.parse(p.photos || "[]") as string[],
      variants: p.variants.map((v) => ({
        ...v,
        sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
        availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
        availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
      })),
    }));
  },
  ["attribute-products"],
  { revalidate: 60, tags: ["products"] }
);

export async function generateAttributeMetadata(
  prefix: string,
  valueSlug: string,
  _resolved: { type: AttributeType; dbValue: string | number },
): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("attributePages"), getLocale()]);
  const key = `${prefix}.${valueSlug}`;

  let title: string;
  let description: string;
  try {
    title = t(`${key}.title`);
    description = t(`${key}.description`);
  } catch {
    title = `${valueSlug} | Hairland`;
    description = "";
  }

  return {
    title,
    description,
    alternates: getAlternates(`/offer/${prefix}/${valueSlug}`),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description,
      url: `https://www.hairland.cz/offer/${prefix}/${valueSlug}`,
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
  };
}

// Get related attribute links (other attribute types)
function getRelatedLinks(prefix: string): Array<{ prefix: string; slugMap: Record<string, string>; labelKey: string }> {
  const allPrefixes = Object.keys(ATTRIBUTE_PREFIX_MAP);
  return allPrefixes
    .filter((p) => p !== prefix)
    .map((p) => {
      let slugMap: Record<string, string> = {};
      switch (ATTRIBUTE_PREFIX_MAP[p]) {
        case "colorTone": slugMap = COLOR_TONE_SLUG_MAP; break;
        case "texture": slugMap = TEXTURE_SLUG_MAP; break;
        case "category": slugMap = CATEGORY_SLUG_MAP_SEO; break;
        case "origin": slugMap = ORIGIN_SLUG_MAP; break;
        case "length": break; // lengths are dynamic, skip in static links
      }
      return { prefix: p, slugMap, labelKey: `${p}.sectionTitle` };
    })
    .filter((r) => Object.keys(r.slugMap).length > 0);
}

export async function AttributeLandingPage({ prefix, valueSlug, attrType, dbValue }: AttributeLandingPageProps) {
  const [t, tAttr, session, products, locale] = await Promise.all([
    getTranslations("public"),
    getTranslations("attributePages"),
    auth(),
    getCachedAttributeProducts(attrType, dbValue),
    getLocale(),
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

  const key = `${prefix}.${valueSlug}`;
  let h1: string;
  let intro: string;
  let sectionTitle: string;
  try { h1 = tAttr(`${key}.h1`); } catch { h1 = String(dbValue); }
  try { intro = tAttr(`${key}.intro`); } catch { intro = ""; }
  try { sectionTitle = tAttr(`${prefix}.sectionTitle`); } catch { sectionTitle = prefix; }

  const relatedLinks = getRelatedLinks(prefix);

  // Schema.org CollectionPage + ItemList
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: h1,
    description: intro,
    inLanguage: locale,
    url: `https://www.hairland.cz/offer/${prefix}/${valueSlug}`,
    mainEntity: products.length > 0 ? {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.hairland.cz/offer/${p.slug ?? p.id}`,
        name: p.name,
        ...(p.photos.length > 0 ? { image: p.photos[0] } : {}),
      })),
    } : undefined,
  };

  // BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("nav.home"), item: "https://www.hairland.cz/" },
      { "@type": "ListItem", position: 2, name: t("nav.products"), item: "https://www.hairland.cz/offer" },
      { "@type": "ListItem", position: 3, name: sectionTitle, item: `https://www.hairland.cz/offer` },
      { "@type": "ListItem", position: 4, name: h1, item: `https://www.hairland.cz/offer/${prefix}/${valueSlug}` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products"), href: "/offer" },
        { label: h1 },
      ]} />

      <h1 className="text-3xl font-bold text-ink mb-3">{h1}</h1>
      {intro && (
        <p className="text-muted mb-8 max-w-3xl text-lg leading-relaxed">{intro}</p>
      )}

      {/* Products */}
      {products.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-ink mb-4">
            {t("offer.productCount", { count: products.length })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flattenProductVariants(products).map((p) => (
              <ProductGridCard
                key={p._variantKey}
                product={p}
                userRole={userRole}
                discountPct={discountPct}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-12 mb-10">
          <p className="text-muted mb-3">{tAttr("noProducts")}</p>
          <Link href="/offer" className="text-sm text-rose hover:underline">
            {tAttr("browseAll")}
          </Link>
        </div>
      )}

      {/* Related attribute pages — internal linking */}
      {relatedLinks.length > 0 && (
        <section className="pt-8 border-t border-line">
          <h2 className="text-lg font-bold text-ink mb-4">{tAttr("relatedPages")}</h2>
          <div className="space-y-4">
            {relatedLinks.map(({ prefix: rPrefix, slugMap, labelKey }) => (
              <div key={rPrefix}>
                <h3 className="text-sm font-semibold text-muted mb-2">
                  {(() => { try { return tAttr(labelKey); } catch { return rPrefix; } })()}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(slugMap).map(([slug, label]) => (
                    <Link
                      key={slug}
                      href={`/offer/${rPrefix}/${slug}`}
                      className="px-3 py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
