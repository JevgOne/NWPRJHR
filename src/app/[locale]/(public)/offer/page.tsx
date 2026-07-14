import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { getCachedAllProducts } from "@/lib/cached-products";
import { ProductsShowcase } from "./ProductsShowcase";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
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
  const [t, session, allProducts, locale] = await Promise.all([
    getTranslations("public"),
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

  if (session?.user?.role === "HAIRDRESSER" || session?.user?.role === "SALON") {
    userRole = session.user.role;
    const b2bSettings = await getCachedB2BSettings();
    discountPct = userRole === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
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

    </div>
  );
}
