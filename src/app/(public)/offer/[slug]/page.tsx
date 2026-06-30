import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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
import { generateProductBio } from "@/lib/product-bio";
import { getHairColor } from "@/lib/hair-colors";
import { ProductGridCard } from "@/components/public/ProductGridCard";

type Props = {
  params: Promise<{ slug: string }>;
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

async function getProduct(slugOrId: string) {
  // Try slug first
  let product = await prisma.product.findUnique({
    where: { slug: slugOrId },
    select: productSelect,
  });

  if (!product) {
    // Fallback: try as CUID id for old URLs
    product = await prisma.product.findUnique({
      where: { id: slugOrId },
      select: productSelect,
    });
    // If found by ID and has slug, redirect to slug URL
    if (product?.slug) {
      redirect(`/offer/${product.slug}`);
    }
  }

  if (!product) return null;

  // Bulk stock fetch — 2 SQL queries instead of N
  const stockMap = await getAllStockNumbers();
  const variantsWithStock = product.variants.map((v) => ({
    ...v,
    availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
    availablePieces: stockMap.get(v.id)?.availablePieces ?? 0,
  }));

  return {
    ...product,
    variants: variantsWithStock,
    photos: JSON.parse(product.photos || "[]") as string[],
  };
}

const PROCESSING_LABELS: Record<string, Record<string, string>> = {
  cs: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Keratin", WEFT: "Tresový", MICRO_RING: "Micro ring", OTHER: "" },
  uk: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Тресове", MICRO_RING: "Micro ring", OTHER: "" },
  ru: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Трессовые", MICRO_RING: "Micro ring", OTHER: "" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const t = await getTranslations("public");
  if (!product) {
    return { title: t("productDetail.notFound") };
  }

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
  if (product.origin) descParts.push(`původ ${product.origin}`);
  if (colorNames.length > 0) descParts.push(colorNames.length <= 4 ? colorNames.join(", ") : `${colorNames.length} barev`);
  if (product.texture) descParts.push(product.texture.toLowerCase());
  if (lengthStr) descParts.push(lengthStr);
  descParts.push("Osobní odběr Praha zdarma, zpracování na zakázku.");
  const autoDescription = descParts.join(". ").slice(0, 155);
  const description = product.metaDescription || autoDescription;

  const ogImg = product.ogImage || product.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/offer/${product.slug ?? slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://www.hairland.cz/offer/${product.slug ?? slug}`,
      siteName: "Hairland",
      locale: "cs_CZ",
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

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // Parallel: product + auth + translations
  const [product, session, t, tCategory, locale] = await Promise.all([
    getProduct(slug),
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

  if (role === "HAIRDRESSER") {
    const settings = await prisma.b2BSettings.findFirst();
    discountPct = settings?.hairdresserDiscountPct ?? 2000;
    tierBadge = t("productDetail.yourPrice");
  } else if (role === "SALON") {
    tierBadge = t("productDetail.yourPrice");
  }

  // Build variant data with resolved prices for the picker
  const pickerVariants = product.variants
    .filter((v) => v.retailPricePerGram > 0 || (v.pricePerPiece ?? 0) > 0)
    .map((v) => {
      const isByPiece = v.sellingMode === "BY_PIECE";
      let displayPrice: number;
      if (isByPiece) {
        const piecePrice = v.pricePerPiece ?? 0;
        if (role === "HAIRDRESSER") {
          displayPrice = roundHalereUp((v.retailPricePerPiece! * (10000 - discountPct)) / 10000);
        } else if (role === "SALON") {
          displayPrice = piecePrice;
        } else {
          displayPrice = v.retailPricePerPiece ?? piecePrice;
        }
      } else {
        if (role === "HAIRDRESSER") {
          displayPrice = roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000);
        } else if (role === "SALON") {
          displayPrice = v.wholesalePricePerGram;
        } else {
          displayPrice = v.retailPricePerGram;
        }
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

  // Aggregate review stats for JSON-LD
  const reviewStats = await prisma.review.aggregate({
    where: { productId: product.id, active: true },
    _avg: { rating: true },
    _count: true,
  });

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
  if (product.origin) descParts.push(`původ ${product.origin}`);
  if (product.texture) descParts.push(product.texture.toLowerCase());
  descParts.push("Prémiové vlasy Hairland.");
  const fallbackDesc = descParts.join(". ").slice(0, 160);
  const schemaDesc = description
    ? description.replace(/\n+/g, " ").slice(0, 160).replace(/\s\S*$/, "…")
    : fallbackDesc;
  const schemaImage = product.photos.length > 0
    ? product.photos
    : [`https://www.hairland.cz/offer/${product.slug ?? product.id}/opengraph-image`];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: schemaDesc,
    image: schemaImage,
    brand: { "@type": "Brand", name: "Hairland" },
    sku: product.id,
    ...(priceTip100g && {
    offers: {
      "@type": "Offer",
      price: (priceTip100g / 100).toFixed(2),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left: Photo gallery */}
        <PhotoGallery photos={product.photos} alt={productName} />

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
          <p className="text-sm text-muted leading-relaxed">
            {description}
          </p>

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
                  <span className="text-xl">📏</span>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.lengthLabel")}</div>
                    <div className="text-sm font-semibold text-ink">{focusedVariant.lengthCm} cm</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">✅</span>
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
                    <span className="text-xl">📏</span>
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
                      <span className="text-xl">✅</span>
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
            <span>✅ {t("productDetail.deliveryInStock")}</span>
            <span>🚗 {t("productDetail.deliveryPrague")}</span>
            <span>✂️ {t("productDetail.deliveryCustom")}</span>
            <span>🧾 {t("productDetail.deliveryInvoice")}</span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related products */}
      {await (async () => {
        const candidates = await prisma.product.findMany({
          where: {
            archived: false,
            id: { not: product.id },
            variants: { some: { active: true, retailPricePerGram: { gt: 0 } } },
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
              select: { id: true, lengthCm: true, color: true, retailPricePerGram: true },
            },
          },
          take: 20,
        });

        // Score by similarity: same category +3, same origin +2, same texture +1, same colorTone +1
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
            availableGrams: stockMap.get(v.id)?.availableGrams ?? 0,
          })),
        }));

        return (
          <section className="mt-12 pt-8 border-t border-line">
            <h2 className="text-lg font-bold text-ink mb-4">
              {t("productDetail.relatedProducts")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cards.map((rp) => (
                <ProductGridCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
