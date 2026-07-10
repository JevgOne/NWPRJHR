import { notFound, permanentRedirect, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { roundHalereUp } from "@/lib/rounding";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { formatCZK } from "@/lib/pricing";
import { ProductReviews } from "./ProductReviews";
import { getOriginFlag } from "@/lib/origin-flags";
import { TextureSwatch } from "@/components/TextureSwatch";
import { PhotoGallery } from "./PhotoGallery";
import { AddToInquiryForm } from "./AddToInquiryForm";
import { getAllStockNumbers } from "@/lib/stock";
import { generateProductBio } from "@/lib/product-bio";
import { getHairColor } from "@/lib/hair-colors";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { Fragment, Suspense } from "react";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isCategorySlug, generateCategoryMetadata, CategoryLandingPage, CATEGORY_SLUG_MAP, CATEGORY_STANDALONE_PATHS } from "./CategoryPage";
import { resolveAttributeSlug, COLOR_TONE_SLUG_MAP, TEXTURE_SLUG_MAP, CATEGORY_SLUG_MAP_SEO, ORIGIN_SLUG_MAP } from "@/lib/attribute-slugs";
import { AttributeLandingPage, generateAttributeMetadata } from "./AttributeLandingPage";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

const getCachedReviewData = unstable_cache(
  async (productId: string) => {
    let stats = await prisma.review.aggregate({
      where: { productId, active: true },
      _avg: { rating: true },
      _count: true,
    });

    if (stats._count === 0) {
      stats = await prisma.review.aggregate({
        where: { active: true },
        _avg: { rating: true },
        _count: true,
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        active: true,
        OR: [{ productId }, { productId: null }],
      },
      select: { authorName: true, rating: true, text: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    return { stats, reviews };
  },
  ["product-review-data"],
  { revalidate: 300, tags: ["reviews"] }
);

/** Parse **bold** markers into React elements */
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="text-ink font-semibold">{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>
  );
}

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ color?: string; length?: string }>;
};

const productSelect = {
  id: true,
  slug: true,
  name: true,
  nameUk: true,
  nameRu: true,
  description: true,
  descriptionUk: true,
  descriptionRu: true,
  category: true,
  processingType: true,
  origin: true,
  texture: true,
  colorTone: true,
  photos: true,
  archived: true,
  metaTitle: true,
  metaDescription: true,
  ogImage: true,
  variants: {
    where: { active: true },
    select: {
      id: true,
      lengthCm: true,
      color: true,
      retailPricePerGram: true,
      wholesalePricePerGram: true,
      sellingMode: true,
      pricePerPiece: true,
      retailPricePerPiece: true,
    },
  },
} as const;

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: productSelect,
    });
    if (!product) return null;
    const stockMap = await getAllStockNumbers();
    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
        availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
      })),
      photos: JSON.parse(product.photos || "[]") as string[],
    };
  },
  ["product-by-slug"],
  { revalidate: 60, tags: ["products"] }
);

const getCachedProductById = unstable_cache(
  async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) return null;
    const stockMap = await getAllStockNumbers();
    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
        availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
      })),
      photos: JSON.parse(product.photos || "[]") as string[],
    };
  },
  ["product-by-id"],
  { revalidate: 60, tags: ["products"] }
);

// Uncached wrapper — redirect() cannot be called inside unstable_cache
const getProduct = cache(async function getProduct(slugOrId: string) {
  const bySlug = await getCachedProductBySlug(slugOrId);
  if (bySlug) return bySlug;

  const byId = await getCachedProductById(slugOrId);
  if (byId?.slug) {
    redirect(`/offer/${byId.slug}`);
  }
  return byId;
});

const PROCESSING_LABELS: Record<string, Record<string, string>> = {
  cs: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Keratin", WEFT: "Tresový", MICRO_RING: "Micro ring", OTHER: "" },
  uk: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Тресове", MICRO_RING: "Micro ring", OTHER: "" },
  ru: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Трессовые", MICRO_RING: "Micro ring", OTHER: "" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Single segment: product detail (categories redirect via middleware to standalone URLs)
  if (slug.length === 1) {
    const [product, t, locale] = await Promise.all([getProduct(slug[0]), getTranslations("public"), getLocale()]);
    if (!product) {
      return { title: t("productDetail.notFound") };
    }

    return generateProductMetadataFromProduct(product, t, locale);
  }

  // Two segments: attribute landing page
  if (slug.length === 2) {
    const resolved = resolveAttributeSlug(slug[0], slug[1]);
    if (resolved) {
      return generateAttributeMetadata(slug[0], slug[1], resolved);
    }
  }

  return { title: "Not Found" };
}

async function generateProductMetadataFromProduct(
  product: NonNullable<Awaited<ReturnType<typeof getProduct>>>,
  t: Awaited<ReturnType<typeof getTranslations<"public">>>,
  locale: string,
): Promise<Metadata> {

  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colorCodes = [...new Set(product.variants.map((v) => v.color))];

  // Title: "{name} {cm} {barva}" — layout adds "| Hairland" (11 chars) via template
  const lengthStr = lengths.map((l) => `${l}cm`).join(", ");
  const colorNames = colorCodes.map((c) => {
    const key = getHairColor(c).nameKey;
    try { return t(`colors.${key}`); } catch { return c; }
  });
  const colorStr = colorNames.length <= 2 ? colorNames.join(", ") : "";
  const baseTitle = [product.name, lengthStr].filter(Boolean).join(" ");
  // Add color only if total (incl. " | Hairland" = 11 chars) fits in 60
  const titleWithColor = colorStr ? `${baseTitle} ${colorStr}` : baseTitle;
  const autoTitle = (titleWithColor.length + 11 <= 60) ? titleWithColor : baseTitle;
  const title = product.metaTitle || autoTitle;

  const descParts: string[] = [product.name];
  if (product.origin) descParts.push(`${t("landing.metaOrigin")} ${product.origin}`);
  if (colorNames.length > 0) descParts.push(colorNames.length <= 4 ? colorNames.join(", ") : `${colorNames.length} ${t("landing.metaColors")}`);
  if (product.texture) descParts.push(product.texture.toLowerCase());
  if (lengthStr) descParts.push(lengthStr);
  descParts.push(t("landing.metaSuffix"));
  const autoDescription = descParts.join(". ").slice(0, 155);
  const description = product.metaDescription || autoDescription;

  const productSlug = product.slug ?? product.id;
  const ogImg = product.ogImage || product.photos[0];
  return {
    title,
    description,
    alternates: getAlternates(`/offer/${productSlug}`),
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://www.hairland.cz/offer/${productSlug}`,
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      ...(ogImg && {
        images: [{ url: ogImg, alt: product.name, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImg && { images: [ogImg] }),
    },
  };
}

export default async function OfferSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;

  // Single segment: product detail (categories redirect via middleware to standalone URLs)
  if (slug.length === 1) {
    return <ProductDetailView slugOrId={slug[0]} searchParams={searchParams} />;
  }

  // Two segments: attribute landing page
  if (slug.length === 2) {
    const resolved = resolveAttributeSlug(slug[0], slug[1]);
    if (resolved) {
      return (
        <AttributeLandingPage
          prefix={slug[0]}
          valueSlug={slug[1]}
          attrType={resolved.type}
          dbValue={resolved.dbValue}
        />
      );
    }
  }

  notFound();
}

async function ProductDetailView({
  slugOrId,
  searchParams,
}: {
  slugOrId: string;
  searchParams: Promise<{ color?: string; length?: string }>;
}) {
  const sp = await searchParams;

  // Parallel: product + auth + translations
  const [product, session, t, tCategory, locale] = await Promise.all([
    getProduct(slugOrId),
    auth(),
    getTranslations("public"),
    getTranslations("category"),
    getLocale(),
  ]);

  if (!product) {
    notFound();
  }

  // Calculate per-variant prices based on user tier
  const role = session?.user?.role;
  let discountPct = 0;
  let tierBadge: string | null = null;

  if ((role === "HAIRDRESSER" || role === "SALON") && session?.user?.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: session.user.salonId },
      select: { tier: true, type: true },
    });
    if (salon) {
      discountPct = await getLoyaltyDiscount(salon.tier, salon.type);
    }
    tierBadge = t("productDetail.yourPrice");
  }

  // Build variant data with resolved prices for the picker
  // B2B: loyalty discount from retail price. Retail: full retail price.
  const pickerVariants = product.variants
    .filter((v) => v.retailPricePerGram > 0 || (v.pricePerPiece ?? 0) > 0)
    .map((v) => {
      const isByPiece = v.sellingMode === "BY_PIECE";
      let displayPrice: number;
      if (isByPiece) {
        const retailPiece = v.retailPricePerPiece ?? v.pricePerPiece ?? 0;
        displayPrice = discountPct > 0
          ? roundHalereUp((retailPiece * (10000 - discountPct)) / 10000)
          : retailPiece;
      } else {
        displayPrice = discountPct > 0
          ? roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000)
          : v.retailPricePerGram;
      }
      return {
        lengthCm: v.lengthCm,
        color: v.color,
        pricePerGram: displayPrice,
        retailPricePerGram: v.retailPricePerGram,
        availableGrams: v.availableGrams,
        sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
        pricePerPiece: isByPiece ? displayPrice : undefined,
        availablePieces: v.availablePieces,
      };
    });

  // Find focused variant from query params
  const focusedVariant = (sp.color && sp.length)
    ? pickerVariants.find((v) => v.color === sp.color && v.lengthCm === parseInt(sp.length!, 10))
    : null;

  // Price: use focused variant if available, otherwise min
  const pricePerGram = focusedVariant
    ? focusedVariant.pricePerGram
    : pickerVariants.length > 0
      ? Math.min(...pickerVariants.map((v) => v.pricePerGram))
      : null;
  const priceTip100g = pricePerGram ? pricePerGram * 100 : null;
  const isByPiece = focusedVariant
    ? focusedVariant.sellingMode === "BY_PIECE"
    : pickerVariants.some(v => v.sellingMode === "BY_PIECE");
  const priceUnit = isByPiece ? "/ks" : "/g";
  const retailPricePerGram = focusedVariant
    ? (tierBadge ? focusedVariant.retailPricePerGram : null)
    : (tierBadge && pickerVariants.length > 0)
      ? Math.min(...pickerVariants.map((v) => v.retailPricePerGram))
      : null;

  // Localized product name
  const productName = locale === "ru" && product.nameRu
    ? product.nameRu
    : locale === "uk" && product.nameUk
      ? product.nameUk
      : product.name;

  // Localized origin
  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };

  // Localized description
  const localizedDesc = locale === "ru" && product.descriptionRu
    ? product.descriptionRu
    : locale === "uk" && product.descriptionUk
      ? product.descriptionUk
      : product.description;

  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );
  const categoryLabel = tCategory(product.category.toLowerCase());
  const originFlag = product.origin ? getOriginFlag(product.origin) : null;

  const catKey = product.category.toLowerCase();
  const catDesc = t(`categoryInfo.${catKey}Desc`);
  const catFeatures = [
    t(`categoryInfo.${catKey}Feature1`),
    t(`categoryInfo.${catKey}Feature2`),
    t(`categoryInfo.${catKey}Feature3`),
    t(`categoryInfo.${catKey}Feature4`),
  ];
  const autoBio = generateProductBio({
    name: productName,
    category: product.category,
    processingType: product.processingType,
    origin: product.origin,
    texture: product.texture,
    colorTone: product.colorTone,
    lengths,
    colorCount: new Set(product.variants.map((v) => v.color)).size,
  });
  const description = localizedDesc || autoBio;

  // Cached review stats + snippets for JSON-LD
  const { stats: reviewStats, reviews: reviewsForSchema } = await getCachedReviewData(product.id);

  // FAQ data by category
  const faqByCategory: Record<string, Array<{ q: string; a: string }>> = {
    VIRGIN: [
      { q: "Co jsou panenské (virgin) vlasy?", a: "Panenské vlasy jsou nejvyšší kvalita lidských vlasů, které nebyly chemicky ošetřeny ani barveny. Kutikula je zachována v původním směru, což zajišťuje přirozený lesk a minimální zamotávání." },
      { q: "Jak dlouho vydrží panenské vlasy?", a: "Při správné péči vydrží panenské vlasy 2 a více let. Díky neporušené kutikule si dlouho zachovávají hebkost a lesk." },
      { q: "Mohu panenské vlasy barvit?", a: "Ano, panenské vlasy lze barvit, odbarvovat i jinak chemicky upravovat. Díky tomu, že nebyly dříve ošetřeny, reagují na barvení velmi dobře a výsledek je přirozený." },
      { q: "Jak pečovat o panenské vlasy?", a: "Používejte šampony bez sulfátů, pravidelně aplikujte kondicionér a vlasový olej. Před spaním vlasy spleťte do volného copu. Vyhněte se nadměrnému tepelnému stylingu." },
    ],
    PREMIUM: [
      { q: "Jaký je rozdíl mezi premium a panenskými vlasy?", a: "Premium vlasy prošly šetrným zpracováním (např. barvením), zatímco panenské vlasy jsou zcela neošetřené. Premium vlasy nabízejí skvělou kvalitu za příznivější cenu." },
      { q: "Jak dlouho vydrží premium vlasy?", a: "Premium vlasy při správné péči vydrží 1 až 2 roky. Životnost závisí na intenzitě nošení a péči." },
      { q: "Jaké možnosti stylování mají premium vlasy?", a: "Premium vlasy lze kulmovat, žehlit, fénovat i natáčet. Doporučujeme používat termoochranný sprej pro delší životnost vlasů." },
    ],
    STANDARD: [
      { q: "Pro koho jsou standardní vlasy vhodné?", a: "Standardní vlasy jsou ideální volbou pro ty, kteří hledají kvalitní prodloužení za dostupnou cenu. Hodí se pro příležitostné nošení nebo jako první zkušenost s prodlužováním." },
      { q: "Jaká je výhoda standardních vlasů oproti dražším variantám?", a: "Hlavní výhodou je příznivá cena při zachování dobré kvality. Standardní vlasy vypadají přirozeně a jsou vhodné pro běžné nošení." },
      { q: "Jak dlouho vydrží standardní vlasy?", a: "Standardní vlasy vydrží přibližně 6 až 12 měsíců v závislosti na frekvenci nošení a péči." },
    ],
  };
  const generalFaq: Array<{ q: string; a: string }> = [
    { q: "Jak aplikovat clip-in a tape-in vlasy?", a: "Clip-in vlasy se jednoduše připínají sponkami k vlastním vlasům — zvládnete to samy doma za pár minut. Tape-in vlasy se lepí speciální páskou k vlastním vlasům a aplikaci doporučujeme u kadeřníka." },
    { q: "Kolik gramů vlasů potřebuji?", a: "Záleží na požadovaném objemu a délce. Pro jemné doplnění stačí 100 g, pro střední objem 150 g a pro plný objem 200 g a více. Podrobný průvodce najdete na naší stránce." },
    { q: "Nabízíte dopravu zdarma v Praze?", a: "Ano, v Praze nabízíme osobní doručení zdarma. Pro ostatní lokality v ČR zasíláme Českou poštou." },
  ];
  const categoryFaq = faqByCategory[product.category] ?? [];
  const allFaq = [...categoryFaq, ...generalFaq];

  // FAQPage JSON-LD
  const faqJsonLd = allFaq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaq.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  } : null;

  // Product schema JSON-LD
  const descParts: string[] = [productName];
  if (product.origin) descParts.push(`${t("landing.metaOrigin")} ${product.origin}`);
  if (product.texture) descParts.push(product.texture.toLowerCase());
  descParts.push(t("landing.metaSuffix"));
  const fallbackDesc = descParts.join(". ").slice(0, 160);
  const schemaDesc = description
    ? description.replace(/\n+/g, " ").slice(0, 160).replace(/\s\S*$/, "…")
    : fallbackDesc;
  const schemaImage = product.photos.length > 0
    ? product.photos
    : [`https://www.hairland.cz/offer/${product.slug ?? product.id}/opengraph-image`];
  const ORIGIN_ISO: Record<string, string> = {
    Ukrajina: "UA", Bělorusko: "BY", Moldavsko: "MD", Rusko: "RU",
    Kazachstán: "KZ", Uzbekistán: "UZ", Turecko: "TR", Írán: "IR",
    Indie: "IN", Vietnam: "VN", Sýrie: "SY", Čína: "CN",
    Mongolsko: "MN", Gruzie: "GE",
  };

  const additionalProperties: Array<{ "@type": string; name: string; value: string }> = [];
  if (product.texture) {
    additionalProperties.push({ "@type": "PropertyValue", name: "Textura", value: product.texture });
  }
  if (product.colorTone) {
    additionalProperties.push({ "@type": "PropertyValue", name: "Barva", value: product.colorTone });
  }
  if (lengths.length > 0) {
    additionalProperties.push({ "@type": "PropertyValue", name: "Délka", value: lengths.map((l) => `${l} cm`).join(", ") });
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: schemaDesc,
    image: schemaImage,
    brand: { "@type": "Brand", name: "Hairland" },
    sku: product.id,
    material: "100% lidské vlasy",
    ...(product.origin && ORIGIN_ISO[product.origin] && {
      countryOfOrigin: { "@type": "Country", name: ORIGIN_ISO[product.origin] },
    }),
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
    ...(pricePerGram && {
    offers: {
      "@type": "Offer",
      price: isByPiece
        ? (pricePerGram / 100).toFixed(2)
        : (priceTip100g! / 100).toFixed(2),
      priceCurrency: "CZK",
      availability: product.archived
        ? "https://schema.org/Discontinued"
        : "https://schema.org/InStock",
      url: `https://www.hairland.cz/offer/${product.slug ?? product.id}`,
      seller: {
        "@type": "Organization",
        name: "Hairland",
        url: "https://www.hairland.cz",
      },
      ...(!isByPiece && pricePerGram && {
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (pricePerGram / 100).toFixed(2),
          priceCurrency: "CZK",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "GRM",
          },
        },
      }),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CZ",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "CZK",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "d" },
          transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "d" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "CZ",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    }),
    ...(reviewStats._count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats._avg.rating?.toFixed(1),
        reviewCount: reviewStats._count,
      },
    }),
    ...(reviewsForSchema.length > 0 && {
      review: reviewsForSchema.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.authorName },
        reviewRating: { "@type": "Rating", ratingValue: String(r.rating) },
        reviewBody: r.text.slice(0, 200),
      })),
    }),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("productDetail.home"),
        item: "https://www.hairland.cz/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("productDetail.offer"),
        item: "https://www.hairland.cz/offer",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: `https://www.hairland.cz/offer/${product.slug ?? product.id}`,
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted mb-4">
        <Link href="/" className="hover:text-rose transition-colors">{t("productDetail.home")}</Link>
        <span>/</span>
        <Link href="/offer" className="hover:text-rose transition-colors">{t("productDetail.offer")}</Link>
        <span>/</span>
        <span className="text-espresso font-medium truncate max-w-[200px]">{productName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        {/* Left: Photo gallery — sticky on desktop */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PhotoGallery photos={product.photos} alt={[productName, product.texture, product.origin && originName(product.origin), lengths.length > 0 && lengths.map(l => `${l}cm`).join("/")].filter(Boolean).join(" — ")} />
        </div>

        {/* Right: Product info */}
        <div className="space-y-4">
          {/* Header: name + origin inline */}
          <div>
            <h1 className="text-2xl font-bold text-ink mb-1">
              {productName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Link
                href={`/offer?category=${product.category}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blush-100 text-rose-deep font-medium text-xs hover:bg-blush-200 transition-colors"
              >
                {categoryLabel}
              </Link>
              {product.origin && (
                <Link
                  href={`/offer?origin=${encodeURIComponent(product.origin)}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs hover:bg-emerald-100 transition-colors"
                >
                  {originFlag} {originName(product.origin)}
                </Link>
              )}
            </div>
          </div>

          {/* Price */}
          {pricePerGram && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-ink">{formatCZK(pricePerGram)}{priceUnit}</span>
                {tierBadge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {tierBadge}
                  </span>
                )}
              </div>
              {priceTip100g && !isByPiece && (
                <p className="text-sm text-muted">
                  {t("productDetail.priceTip", { price: formatCZK(priceTip100g) })}
                </p>
              )}
              {retailPricePerGram && (
                <p className="text-sm text-muted">
                  <span className="line-through text-ink/50">{formatCZK(retailPricePerGram)}/g</span>
                  {" "}
                  <span>({t("productDetail.regularPrice")})</span>
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-muted leading-relaxed space-y-4">
            {description.split("\n\n").map((block, i) => {
              // Bullet list block
              if (block.includes("\n•")) {
                const [heading, ...bullets] = block.split("\n");
                return (
                  <div key={i}>
                    {heading && <p className="font-semibold text-ink mb-2">{renderBold(heading)}</p>}
                    <ul className="space-y-1.5 ml-1">
                      {bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-rose mt-0.5 shrink-0">&#x2022;</span>
                          <span>{renderBold(b.replace(/^•\s*/, ""))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              // Block with heading (first line is **bold**)
              if (block.startsWith("**") && block.includes("\n")) {
                const [heading, ...rest] = block.split("\n");
                return (
                  <div key={i}>
                    <p className="font-semibold text-ink mb-1">{renderBold(heading)}</p>
                    {rest.map((line, j) => (
                      <p key={j} className="mt-1">{renderBold(line)}</p>
                    ))}
                  </div>
                );
              }
              // Regular paragraph
              return <p key={i}>{renderBold(block)}</p>;
            })}
          </div>

          {/* Specs row — compact, clickable */}
          <div className="bg-nude-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {product.origin && (
              <Link
                href={`/offer?origin=${encodeURIComponent(product.origin)}`}
                className="flex items-center gap-2.5 hover:bg-nude-100 rounded-lg p-1 -m-1 transition-colors"
              >
                <span className="text-xl">{originFlag}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.originLabel")}</div>
                  <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{originName(product.origin)}</div>
                </div>
              </Link>
            )}
            {product.texture && (
              <Link
                href={`/offer?texture=${encodeURIComponent(product.texture)}`}
                className="flex items-center gap-2.5 hover:bg-nude-100 rounded-lg p-1 -m-1 transition-colors"
              >
                <TextureSwatch texture={product.texture} size={32} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.textureLabel")}</div>
                  <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{product.texture}</div>
                </div>
              </Link>
            )}
            {(() => {
              const variantColors = [...new Set(product.variants.map(v => v.color))].sort((a, b) => parseInt(a) - parseInt(b));
              if (variantColors.length === 0) return null;
              const firstColor = variantColors[0];
              const hc = getHairColor(firstColor);
              const colorLabel = (() => { try { return t(`colors.${hc.nameKey}`); } catch { return hc.nameKey; } })();
              return (
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full border border-line/50 flex-shrink-0" style={{ backgroundColor: hc.hex }} />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.colorLabel")}</div>
                    <div className="text-sm font-semibold text-ink">{colorLabel}</div>
                  </div>
                </div>
              );
            })()}
            {focusedVariant ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getHairColor(focusedVariant.color).hex }} />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.colorLabel")}</div>
                    <div className="text-sm font-semibold text-ink">{(() => { const { nameKey } = getHairColor(focusedVariant.color); try { return t(`colors.${nameKey}`); } catch { return nameKey; } })()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.lengthLabel")}</div>
                    <div className="text-sm font-semibold text-ink">{focusedVariant.lengthCm} cm</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
                    <div className={`text-sm font-semibold ${focusedVariant.availableGrams > 0 || (focusedVariant.availablePieces ?? 0) > 0 ? "text-emerald-700" : "text-red-500"}`}>
                      {(() => {
                        if (focusedVariant.sellingMode === "BY_PIECE" && (focusedVariant.availablePieces ?? 0) > 0) return `${focusedVariant.availablePieces} ks ${t("productDetail.inStock").toLowerCase()}`;
                        if (focusedVariant.availableGrams > 0) return `${focusedVariant.availableGrams} g ${t("productDetail.inStock").toLowerCase()}`;
                        return t("inquiry.outOfStock");
                      })()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {lengths.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.lengthsLabel")}</div>
                      <div className="text-sm font-semibold text-ink">
                        {lengths.map((l) => `${l} cm`).join(", ")}
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  const totalStock = product.variants.reduce((sum, v) => sum + v.availableGrams, 0);
                  const totalPieces = product.variants.reduce((sum, v) => sum + (v.availablePieces ?? 0), 0);
                  const hasPieces = product.variants.some(v => v.sellingMode === "BY_PIECE");
                  return (
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
                        <div className={`text-sm font-semibold ${totalStock > 0 || totalPieces > 0 ? "text-emerald-700" : "text-red-500"}`}>
                          {(() => {
                            if (hasPieces && totalPieces > 0) return `${totalPieces} ks ${t("productDetail.inStock").toLowerCase()}`;
                            if (totalStock > 0) return `${totalStock} g ${t("productDetail.inStock").toLowerCase()}`;
                            return t("inquiry.outOfStock");
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Category features */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
              {t("productDetail.categoryFeatures", { category: categoryLabel })}
            </div>
            <ul className="space-y-1.5">
              {catFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="text-amber-600 mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Add to inquiry — interactive picker */}
          <AddToInquiryForm
            productId={product.id}
            productName={product.name}
            variants={pickerVariants}
            defaultColor={sp.color}
            defaultLength={sp.length ? parseInt(sp.length, 10) : undefined}
          />

          {/* Delivery perks — tight row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg> {t("productDetail.deliveryInStock")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> {t("productDetail.deliveryPrague")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" /></svg> {t("productDetail.deliveryCustom")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> {t("productDetail.deliveryInvoice")}</span>
          </div>
        </div>
      </div>

      {/* Reviews — full width */}
      <Suspense fallback={<div className="mt-8 border-t border-line pt-6 h-40 animate-pulse bg-nude-50 rounded-2xl" />}>
        <ProductReviews productId={product.id} />
      </Suspense>

      {/* Related products — full width */}
      {await (async () => {
        const candidates = await prisma.product.findMany({
          where: {
            archived: false,
            id: { not: product.id },
            variants: { some: { active: true, OR: [{ retailPricePerGram: { gt: 0 } }, { retailPricePerPiece: { gt: 0 } }] } },
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
              select: { id: true, lengthCm: true, color: true, retailPricePerGram: true, sellingMode: true, retailPricePerPiece: true },
            },
          },
          take: 20,
        });

        const scored = candidates.map((rp) => {
          let score = 0;
          if (rp.category === product.category) score += 3;
          if (rp.origin && rp.origin === product.origin) score += 2;
          if (rp.texture && rp.texture === product.texture) score += 1;
          if (rp.colorTone && rp.colorTone === product.colorTone) score += 1;
          return { ...rp, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const related = scored.slice(0, 4);

        if (related.length === 0) return null;

        const stockMap = await getAllStockNumbers();
        const cards = related.map((rp) => ({
          ...rp,
          photos: JSON.parse(rp.photos || "[]") as string[],
          variants: rp.variants.map((v) => ({
            ...v,
            sellingMode: v.sellingMode as "BY_GRAM" | "BY_PIECE" | undefined,
            availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
            availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
          })),
        }));

        return (
          <section className="mt-12 pt-8 border-t border-line">
            <h2 className="text-lg font-bold text-ink mb-4">
              {t("productDetail.relatedProducts")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {flattenProductVariants(cards).slice(0, 8).map((rp) => (
                <ProductGridCard key={rp._variantKey} product={rp} />
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}

export async function generateStaticParams() {
  const params: { slug: string[] }[] = [];

  // Processing type category pages are now standalone routes (/clip-in, /tape-in, etc.)
  // No longer generated here — they redirect to standalone URLs

  // Color tones
  for (const slug of Object.keys(COLOR_TONE_SLUG_MAP)) {
    params.push({ slug: ["barva", slug] });
  }

  // Textures
  for (const slug of Object.keys(TEXTURE_SLUG_MAP)) {
    params.push({ slug: ["textura", slug] });
  }

  // Categories (SEO)
  for (const slug of Object.keys(CATEGORY_SLUG_MAP_SEO)) {
    params.push({ slug: ["kategorie", slug] });
  }

  // Origins
  for (const slug of Object.keys(ORIGIN_SLUG_MAP)) {
    params.push({ slug: ["zeme", slug] });
  }

  // Lengths — dynamic from DB
  const lengths = await prisma.variant.findMany({
    where: { active: true },
    select: { lengthCm: true },
    distinct: ["lengthCm"],
  });
  for (const { lengthCm } of lengths) {
    params.push({ slug: ["delka", `${lengthCm}cm`] });
  }

  // Products — existing slugs
  const products = await prisma.product.findMany({
    where: { archived: false, slug: { not: null } },
    select: { slug: true },
  });
  for (const p of products) {
    if (p.slug) params.push({ slug: [p.slug] });
  }

  return params;
}
