import { notFound, permanentRedirect, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { roundHalereUp } from "@/lib/rounding";
import { formatCZK } from "@/lib/pricing";
import { ProductReviews } from "./ProductReviews";
import { getOriginFlag } from "@/lib/origin-flags";
import { TextureSwatch } from "@/components/TextureSwatch";
import { PhotoGallery } from "./PhotoGallery";
import { AddToInquiryForm } from "./AddToInquiryForm";
import { getAllStockNumbers } from "@/lib/stock";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
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
import { TrackProductView } from "@/components/public/TrackProductView";
import { RecentlyViewed } from "@/components/public/RecentlyViewed";
import { StockNotifyButton } from "./StockNotifyButton";
import { WishlistToggle } from "@/components/public/WishlistToggle";

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
  video: true,
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
      availableToOrder: true,
      orderLeadDays: true,
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
        exclusivePieces: stockMap.get(v.id)?.exclusivePieces ?? 0,
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
        exclusivePieces: stockMap.get(v.id)?.exclusivePieces ?? 0,
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

const getCachedRelatedCandidates = unstable_cache(
  async (excludeId: string) => {
    return prisma.product.findMany({
      where: {
        archived: false,
        id: { not: excludeId },
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
  },
  ["related-product-candidates"],
  { revalidate: 120, tags: ["products"] }
);

async function RelatedProducts({
  productId,
  category,
  origin,
  texture,
  colorTone,
}: {
  productId: string;
  category: string | null;
  origin: string | null;
  texture: string | null;
  colorTone: string | null;
}) {
  const t = await getTranslations("public");
  const candidates = await getCachedRelatedCandidates(productId);

  const scored = candidates.map((rp) => {
    let score = 0;
    if (rp.category === category) score += 3;
    if (rp.origin && rp.origin === origin) score += 2;
    if (rp.texture && rp.texture === texture) score += 1;
    if (rp.colorTone && rp.colorTone === colorTone) score += 1;
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
      exclusivePieces: stockMap.get(v.id)?.exclusivePieces ?? 0,
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
}

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
  const [product, session, t, tCategory, tPt, locale] = await Promise.all([
    getProduct(slugOrId),
    auth(),
    getTranslations("public"),
    getTranslations("category"),
    getTranslations("processingTypes"),
    getLocale(),
  ]);

  if (!product) {
    notFound();
  }

  // Calculate per-variant prices based on B2B discount (from margin)
  const role = session?.user?.role;
  let discountPct = 0;
  let tierBadge: string | null = null;

  if (role === "HAIRDRESSER" || role === "SALON") {
    const b2bSettings = await getCachedB2BSettings();
    discountPct = role === "SALON"
      ? b2bSettings.salonDiscountPct
      : b2bSettings.hairdresserDiscountPct;
    tierBadge = t("productDetail.yourPrice");
  }

  // Build variant data with resolved prices for the picker
  // B2B: discount from margin (margin = retail / 2 with 100% markup)
  const pickerVariants = product.variants
    .filter((v) => v.retailPricePerGram > 0 || (v.pricePerPiece ?? 0) > 0)
    .map((v) => {
      const isByPiece = v.sellingMode === "BY_PIECE";
      const vIsExclusive = isByPiece && (v.exclusivePieces ?? 0) > 0;
      let displayPrice: number;
      let pieceDisplayPrice: number | undefined;
      if (isByPiece && vIsExclusive) {
        const retailPiece = v.retailPricePerPiece ?? v.pricePerPiece ?? 0;
        displayPrice = discountPct > 0
          ? roundHalereUp(retailPiece - (retailPiece * discountPct) / 20000)
          : retailPiece;
        pieceDisplayPrice = displayPrice;
      } else {
        // BY_GRAM or non-exclusive BY_PIECE — show per-gram price
        displayPrice = discountPct > 0
          ? roundHalereUp(v.retailPricePerGram - (v.retailPricePerGram * discountPct) / 20000)
          : v.retailPricePerGram;
        if (isByPiece) {
          const retailPiece = v.retailPricePerPiece ?? v.pricePerPiece ?? 0;
          pieceDisplayPrice = discountPct > 0
            ? roundHalereUp(retailPiece - (retailPiece * discountPct) / 20000)
            : retailPiece;
        }
      }
      return {
        id: v.id,
        lengthCm: v.lengthCm,
        color: v.color,
        pricePerGram: displayPrice,
        retailPricePerGram: (isByPiece && vIsExclusive) ? (v.retailPricePerPiece ?? v.pricePerPiece ?? 0) : v.retailPricePerGram,
        retailPricePerGramForPiece: isByPiece ? v.retailPricePerGram : 0,
        availableGrams: v.availableGrams,
        sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
        pricePerPiece: pieceDisplayPrice,
        availablePieces: v.availablePieces,
        exclusivePieces: v.exclusivePieces ?? 0,
        availableToOrder: v.availableToOrder,
        orderLeadDays: v.orderLeadDays,
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
  const isExclusive = isByPiece && (focusedVariant
    ? (focusedVariant.exclusivePieces ?? 0) > 0
    : pickerVariants.some(v => v.sellingMode === "BY_PIECE" && (v.exclusivePieces ?? 0) > 0));
  // Non-exclusive BY_PIECE: show as grams on public web
  const showAsPiece = isByPiece && isExclusive;
  const priceUnit = showAsPiece ? "/ks" : "/g";
  const retailPricePerGram = focusedVariant
    ? (tierBadge ? focusedVariant.retailPricePerGram : null)
    : (tierBadge && pickerVariants.length > 0)
      ? Math.min(...pickerVariants.map((v) => v.retailPricePerGram))
      : null;
  const retailPricePerGramForPiece = isByPiece
    ? (focusedVariant?.retailPricePerGramForPiece ?? pickerVariants.find(v => v.sellingMode === "BY_PIECE")?.retailPricePerGramForPiece ?? 0)
    : 0;

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
    LUXE: [
      { q: "Jaký je rozdíl mezi luxe a panenskými vlasy?", a: "Luxe vlasy prošly šetrným zpracováním, které zachovává přirozenou strukturu, zatímco panenské vlasy jsou zcela neošetřené. Luxe vlasy nabízejí luxusní kvalitu za příznivější cenu." },
      { q: "Jak dlouho vydrží luxe vlasy?", a: "Luxe vlasy při správné péči vydrží 1 až 2 roky. Životnost závisí na intenzitě nošení a péči." },
      { q: "Jaké možnosti stylování mají luxe vlasy?", a: "Luxe vlasy lze kulmovat, žehlit, fénovat i natáčet. Doporučujeme používat termoochranný sprej pro delší životnost vlasů." },
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
      price: showAsPiece
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
      ...(!showAsPiece && pricePerGram && {
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
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(reviewsForSchema.length > 0 && {
      review: reviewsForSchema.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.authorName },
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
          worstRating: "1",
        },
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
      <TrackProductView slug={product.slug ?? product.id} />
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
          <PhotoGallery photos={product.photos} video={product.video} alt={[productName, product.texture, product.origin && originName(product.origin), lengths.length > 0 && lengths.map(l => `${l}cm`).join("/")].filter(Boolean).join(" — ")} />
        </div>

        {/* Right: Product info */}
        <div className="space-y-4">
          {/* Header: name + origin inline */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h1 className="text-2xl font-bold text-ink">
                {productName}
              </h1>
              {(product.slug ?? product.id) && (
                <WishlistToggle slug={product.slug ?? product.id} />
              )}
            </div>
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs">
                ✓ {t("productDetail.realHair")}
              </span>
            </div>
          </div>

          {/* Price */}
          {pricePerGram && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-ink">
                  {formatCZK(pricePerGram)}{priceUnit}
                  {showAsPiece && focusedVariant && (focusedVariant.availablePieces ?? 0) > 0 && focusedVariant.availableGrams > 0 && (
                    <span className="text-sm font-normal text-muted ml-1">({Math.round(focusedVariant.availableGrams / focusedVariant.availablePieces!)} g)</span>
                  )}
                </span>
                {tierBadge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {tierBadge}
                  </span>
                )}
              </div>
              {priceTip100g && !showAsPiece && (
                <p className="text-sm text-muted">
                  {t("productDetail.priceTip", { price: formatCZK(priceTip100g) })}
                </p>
              )}
              {retailPricePerGram && (
                <p className="text-sm text-muted">
                  <span className="line-through text-ink/50">{formatCZK(retailPricePerGram)}{priceUnit}</span>
                  {" "}
                  <span>({t("productDetail.regularPrice")})</span>
                </p>
              )}
              {showAsPiece && retailPricePerGramForPiece > 0 && (
                <p className="text-sm text-muted">({formatCZK(retailPricePerGramForPiece)}/g)</p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-muted leading-relaxed space-y-2 text-left">
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
                    <div className={`text-sm font-semibold ${
                      focusedVariant.availableGrams > 0 || (focusedVariant.availablePieces ?? 0) > 0
                        ? "text-emerald-700"
                        : focusedVariant.availableToOrder ? "text-amber-600" : "text-red-500"
                    }`}>
                      {(() => {
                        const fvIsExclusive = focusedVariant.sellingMode === "BY_PIECE" && (focusedVariant.exclusivePieces ?? 0) > 0;
                        if (fvIsExclusive && (focusedVariant.availablePieces ?? 0) > 0) {
                          const totalG = focusedVariant.availableGrams;
                          return `${focusedVariant.availablePieces} ks ${t("productDetail.inStock").toLowerCase()}${totalG > 0 ? ` (${t("productDetail.totalGrams", { grams: totalG })})` : ""}`;
                        }
                        if (focusedVariant.availableGrams > 0) return `${focusedVariant.availableGrams} g ${t("productDetail.inStock").toLowerCase()}`;
                        if (focusedVariant.availableToOrder) {
                          return focusedVariant.orderLeadDays
                            ? t("productDetail.availableToOrder", { days: focusedVariant.orderLeadDays })
                            : t("productDetail.availableToOrderContact");
                        }
                        return t("inquiry.outOfStock");
                      })()}
                    </div>
                    {focusedVariant.availableGrams === 0 && (focusedVariant.availablePieces ?? 0) === 0
                      && !focusedVariant.availableToOrder && (
                      <StockNotifyButton variantId={focusedVariant.id} />
                    )}
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
                  const hasExclusivePieces = product.variants.some(v => v.sellingMode === "BY_PIECE" && (v.exclusivePieces ?? 0) > 0);
                  const hasAvailableToOrder = product.variants.some(v => v.availableToOrder);
                  return (
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
                        <div className={`text-sm font-semibold ${
                          totalStock > 0 || totalPieces > 0 ? "text-emerald-700"
                          : hasAvailableToOrder ? "text-amber-600"
                          : "text-red-500"
                        }`}>
                          {(() => {
                            if (hasExclusivePieces && totalPieces > 0) {
                              return `${totalPieces} ks ${t("productDetail.inStock").toLowerCase()}${totalStock > 0 ? ` (${t("productDetail.totalGrams", { grams: totalStock })})` : ""}`;
                            }
                            if (totalStock > 0) return `${totalStock} g ${t("productDetail.inStock").toLowerCase()}`;
                            if (hasAvailableToOrder) return t("productDetail.availableToOrderContact");
                            return t("inquiry.outOfStock");
                          })()}
                        </div>
                        {totalStock === 0 && totalPieces === 0 && !hasAvailableToOrder && product.variants.length > 0 && (
                          <StockNotifyButton variantId={product.variants[0].id} />
                        )}
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

          {/* Delivery strip */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg> {t("productDetail.deliveryInStock")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> {t("productDetail.deliveryPrague")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> {t("productDetail.deliveryInvoice")}</span>
            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {t("productDetail.deliveryCustom")}</span>
          </div>

          {/* Trust guarantees */}
          <div className="mt-4 rounded-xl bg-nude-50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-rose shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              <div>
                <p className="text-sm font-medium text-ink">{t("productDetail.trustQuality")}</p>
                <p className="text-xs text-muted mt-0.5">{t("productDetail.trustQualityDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-rose shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992" /></svg>
              <div>
                <p className="text-sm font-medium text-ink">{t("productDetail.trustReturn")}</p>
                <p className="text-xs text-muted mt-0.5">{t("productDetail.trustReturnDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-rose shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              <div>
                <p className="text-sm font-medium text-ink">{t("productDetail.trustQuestion")}</p>
                <p className="text-xs text-muted mt-0.5">{t("productDetail.trustQuestionDesc")}</p>
              </div>
            </div>
          </div>

          {/* No-retouch trust section */}
          <div className="rounded-2xl bg-amber-50/50 p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
              <div>
                <h3 className="text-sm font-bold text-ink">{t("productDetail.noRetouchTitle")}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{t("productDetail.noRetouchDesc")}</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <Link href="/contact" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm5.25-12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta1Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta1Desc")}</p>
                </div>
              </Link>
              <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta2Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta2Desc")}</p>
                </div>
              </a>
              <Link href="/contact" className="flex items-start gap-2.5 rounded-lg p-2 -mx-2 hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <div>
                  <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta3Title")}</p>
                  <p className="text-[11px] text-muted">{t("productDetail.noRetouchCta3Desc")}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Care tips + blog link */}
      <section className="mt-10 pt-8 border-t border-line">
        <h2 className="text-lg font-bold text-ink mb-4">{t("productDetail.careTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="bg-nude-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-6 h-6 rounded-full bg-blush-100 flex items-center justify-center text-rose-deep text-xs font-bold">{n}</span>
                <h3 className="text-sm font-semibold text-ink">{t(`productDetail.careTip${n}Title` as any)}</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">{t(`productDetail.careTip${n}Text` as any)}</p>
            </div>
          ))}
        </div>
        <Link href="/blog/pece-o-prodlouzene-vlasy-kompletni-pruvodce" className="inline-flex items-center gap-1.5 text-sm text-rose hover:text-rose-deep transition-colors font-medium">
          {t("productDetail.careReadMore")}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      </section>

      {/* Reviews — full width */}
      <Suspense fallback={<div className="mt-8 border-t border-line pt-6 h-40 animate-pulse bg-nude-50 rounded-2xl" />}>
        <ProductReviews productId={product.id} />
      </Suspense>

      {/* Related products — Suspense-wrapped to not block main render */}
      <Suspense fallback={<div className="mt-12 pt-8 border-t border-line h-48 animate-pulse bg-nude-50 rounded-2xl" />}>
        <RelatedProducts
          productId={product.id}
          category={product.category}
          origin={product.origin}
          texture={product.texture}
          colorTone={product.colorTone}
        />
      </Suspense>

      {/* Recently viewed */}
      <RecentlyViewed excludeSlug={product.slug ?? product.id} />

      {/* FAQ — visual accordion, last section */}
      {allFaq.length > 0 && (
        <section className="mt-12 pt-8 border-t border-line">
          <h2 className="text-lg font-bold text-ink mb-4">{t("productDetail.faqTitle")}</h2>
          <div className="space-y-2 max-w-3xl">
            {allFaq.map((faq, i) => (
              <details key={i} className="group bg-nude-50 rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-medium text-ink hover:text-rose-deep transition-colors">
                  <span>{faq.q}</span>
                  <svg className="w-4 h-4 shrink-0 ml-2 text-muted group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </summary>
                <p className="px-4 pb-3 text-sm text-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
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
