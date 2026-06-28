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
  variants: {
    where: { active: true },
    select: {
      id: true,
      lengthCm: true,
      color: true,
      retailPricePerGram: true,
      wholesalePricePerGram: true,
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
  const t = await getTranslations("public.productDetail");
  const tCategory = await getTranslations("category");
  const locale = await getLocale();
  if (!product) {
    return { title: t("notFound") };
  }
  const productName = locale === "ru" && product.nameRu
    ? product.nameRu
    : locale === "uk" && product.nameUk
      ? product.nameUk
      : product.name;
  const processingLabel = PROCESSING_LABELS[locale]?.[product.processingType] ?? PROCESSING_LABELS.cs[product.processingType] ?? "";
  const originLabel = product.origin ?? "";
  const textureLabel = product.texture ?? "";
  const colorToneLabel = product.colorTone ?? "";
  // Title: "Panenské vlasy Clip-in — Rovné — Blond — Ukrajina" — unique per product
  const titleParts = [productName, processingLabel, textureLabel, colorToneLabel, originLabel].filter(Boolean);
  const title = titleParts.join(" — ");
  const categoryLabel = tCategory(product.category.toLowerCase());
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colorCount = new Set(product.variants.map((v) => v.color)).size;
  const minLength = lengths[0];
  const maxLength = lengths[lengths.length - 1];
  const metaBio = generateProductBio({
    name: productName,
    category: product.category,
    processingType: product.processingType,
    origin: product.origin,
    texture: product.texture,
    colorTone: product.colorTone,
    lengths,
    colorCount,
  });
  const description = (metaBio.length > 155 ? metaBio.slice(0, 152) + "..." : metaBio) + " | Hairland";
  const firstPhoto = product.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/offer/${product.slug ?? slug}` },
    openGraph: firstPhoto ? {
      images: [{ url: firstPhoto, alt: title }],
      type: "website",
    } : undefined,
  };
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");
  const locale = await getLocale();

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
    .filter((v) => v.retailPricePerGram > 0)
    .map((v) => {
      let displayPrice: number;
      if (role === "HAIRDRESSER") {
        displayPrice = roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000);
      } else if (role === "SALON") {
        displayPrice = v.wholesalePricePerGram;
      } else {
        displayPrice = v.retailPricePerGram;
      }
      return {
        lengthCm: v.lengthCm,
        color: v.color,
        pricePerGram: displayPrice,
        retailPricePerGram: v.retailPricePerGram,
        availableGrams: v.availableGrams,
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

  // Product schema JSON-LD
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: description || undefined,
    image: product.photos.length > 0 ? product.photos[0] : undefined,
    brand: { "@type": "Brand", name: "Hairland" },
    sku: product.id,
    offers: {
      "@type": "Offer",
      price: priceTip100g ? (priceTip100g / 100).toFixed(2) : undefined,
      priceCurrency: "CZK",
      availability: product.archived
        ? "https://schema.org/Discontinued"
        : "https://schema.org/InStock",
      url: `https://www.hairland.cz/offer/${product.slug ?? product.id}`,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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
                <span className="text-xl font-bold text-ink">{formatCZK(pricePerGram)}/g</span>
                {tierBadge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {tierBadge}
                  </span>
                )}
              </div>
              {priceTip100g && (
                <p className="text-sm text-muted">
                  {t("productDetail.priceTip", { price: formatCZK(priceTip100g) })}
                </p>
              )}
              {retailPricePerGram && (
                <p className="text-xs text-muted">
                  <span className="line-through">{formatCZK(retailPricePerGram)}/g</span>
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
                    <div className={`text-sm font-semibold ${focusedVariant.availableGrams > 0 ? "text-emerald-700" : "text-red-500"}`}>
                      {focusedVariant.availableGrams > 0 ? `${focusedVariant.availableGrams} g ${t("productDetail.inStock").toLowerCase()}` : t("inquiry.outOfStock")}
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
                        {lengths.length === 1
                          ? `${lengths[0]} cm`
                          : `${lengths[0]}–${lengths[lengths.length - 1]} cm`}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">✅</span>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
                    <div className="text-sm font-semibold text-emerald-700">{t("productDetail.inStock")}</div>
                  </div>
                </div>
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
    </div>
  );
}
