import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductsShowcase } from "./ProductsShowcase";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import {
  COLOR_TONE_SLUG_MAP,
  TEXTURE_SLUG_MAP,
  CATEGORY_SLUG_MAP_SEO,
  ORIGIN_SLUG_MAP,
} from "@/lib/attribute-slugs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("public"), getLocale()]);

  const defaultTitle = t("offer.metaTitle");
  const defaultDesc = t("offer.metaDescription");

  if (!sp.category && !sp.origin && !sp.lengthCm && !sp.texture && !sp.colorTone) {
    return {
      title: defaultTitle,
      description: defaultDesc,
      alternates: getAlternates("/offer"),
      openGraph: {
        type: "website",
        title: `${defaultTitle} | Hairland`,
        description: defaultDesc,
        url: "https://www.hairland.cz/offer",
        siteName: "Hairland",
        locale: OG_LOCALES[locale] ?? "cs_CZ",
        images: [
          {
            url: "https://www.hairland.cz/hero-vzornik.png",
            width: 735,
            height: 707,
            alt: "Hairland — prémiové vlasy k prodloužení",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${defaultTitle} | Hairland`,
        description: defaultDesc,
        images: ["https://www.hairland.cz/hero-vzornik.png"],
      },
    };
  }

  const parts: string[] = [];
  if (sp.category && sp.category !== "ALL") parts.push(sp.category);
  if (sp.origin) parts.push(sp.origin);
  if (sp.lengthCm) parts.push(`${sp.lengthCm} cm`);
  if (sp.texture) parts.push(sp.texture);
  if (sp.colorTone) parts.push(sp.colorTone);

  const title = `${parts.join(" | ")} — ${t("products.title")}`;
  return {
    title,
    description: `${parts.join(", ")} — ${defaultDesc}`,
    alternates: getAlternates("/offer"),
  };
}

export default async function ProductsPage() {
  const [t, tAttr, session, allProducts, locale] = await Promise.all([
    getTranslations("public"),
    getTranslations("attributePages"),
    auth(),
    getCachedAllProducts(),
    getLocale(),
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("offer.metaTitle"),
    inLanguage: locale,
    numberOfItems: allProducts.length,
    itemListElement: allProducts.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.hairland.cz/offer/${p.slug ?? p.id}`,
      name: p.name,
      ...(p.photos.length > 0 ? { image: p.photos[0] } : {}),
    })),
  };

  // Resolve user pricing tier
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.products") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-4">
        {t("products.title")}
      </h1>

      <Suspense fallback={<p className="text-muted">{t("offer.loadingProducts")}</p>}>
        <ProductsShowcase userRole={userRole} discountPct={discountPct} initialProducts={allProducts} />
      </Suspense>

      {/* Browse by attribute — internal linking for SEO */}
      <section className="mt-10 border-t border-line pt-8">
        <h2 className="text-lg font-bold text-ink mb-4">
          {t("offer.browseByAttribute")}
        </h2>

        {/* Color tones */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted mb-2">{tAttr("barva.sectionTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLOR_TONE_SLUG_MAP).map(([slug, label]) => (
              <Link key={slug} href={`/offer/barva/${slug}`} className="px-3 py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Textures */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted mb-2">{tAttr("textura.sectionTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEXTURE_SLUG_MAP).map(([slug, label]) => (
              <Link key={slug} href={`/offer/textura/${slug}`} className="px-3 py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted mb-2">{tAttr("kategorie.sectionTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_SLUG_MAP_SEO).map(([slug, label]) => (
              <Link key={slug} href={`/offer/kategorie/${slug}`} className="px-3 py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Origins */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted mb-2">{tAttr("zeme.sectionTitle")}</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ORIGIN_SLUG_MAP).map(([slug, label]) => (
              <Link key={slug} href={`/offer/zeme/${slug}`} className="px-3 py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-colors text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
