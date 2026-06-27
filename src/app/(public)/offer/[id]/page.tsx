import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { roundHalereUp } from "@/lib/rounding";
import { formatCZK } from "@/lib/pricing";
import { ProductReviews } from "./ProductReviews";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getToneInfo } from "@/lib/hair-tones";
import { TextureSwatch } from "@/components/TextureSwatch";
import { PhotoGallery } from "./PhotoGallery";
import { AddToInquiryForm } from "./AddToInquiryForm";

type Props = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
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
      tone: true,
      photos: true,
      variants: {
        where: { active: true },
        select: {
          lengthCm: true,
          color: true,
          retailPricePerGram: true,
          wholesalePricePerGram: true,
        },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    photos: JSON.parse(product.photos || "[]") as string[],
  };
}

const PROCESSING_LABELS: Record<string, Record<string, string>> = {
  cs: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Keratin", WEFT: "Tresový", MICRO_RING: "Micro ring", OTHER: "" },
  uk: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Тресове", MICRO_RING: "Micro ring", OTHER: "" },
  ru: { CLIP_IN: "Clip-in", TAPE_IN: "Tape-in", KERATIN: "Кератин", WEFT: "Трессовые", MICRO_RING: "Micro ring", OTHER: "" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
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
  // Title: "Panenské vlasy Clip-in — Rovné — Ukrajina" — unique per product
  const titleParts = [productName, processingLabel, textureLabel, originLabel].filter(Boolean);
  const title = titleParts.join(" — ");
  const categoryLabel = tCategory(product.category.toLowerCase());
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colorCount = new Set(product.variants.map((v) => v.color)).size;
  const minLength = lengths[0];
  const maxLength = lengths[lengths.length - 1];
  const originPart = product.origin ? `Původ: ${product.origin}. ` : "";
  const texturePart = product.texture ? `Struktura: ${product.texture}. ` : "";
  const tonePart = product.tone ? `Tón: ${product.tone}. ` : "";
  const description = `${productName} ${processingLabel} — ${categoryLabel} vlasy k prodloužení. ${originPart}${texturePart}${tonePart}Délky ${minLength}–${maxLength} cm, ${colorCount} odstínů. Skladem v Praze | Hairland`;
  const firstPhoto = product.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/offer/${id}` },
    openGraph: firstPhoto ? {
      images: [{ url: firstPhoto, alt: title }],
      type: "website",
    } : undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");
  const locale = await getLocale();

  // Calculate per-gram price based on user tier
  let pricePerGram: number | null = null;
  let priceTip100g: number | null = null;
  let tierBadge: string | null = null;
  let retailPricePerGram: number | null = null;
  const variantsWithPrices = product.variants.filter(
    (v) => v.retailPricePerGram > 0
  );

  if (variantsWithPrices.length > 0) {
    const role = session?.user?.role;
    const retailPrices = variantsWithPrices.map((v) => v.retailPricePerGram);
    const minRetail = Math.min(...retailPrices);

    if (role === "HAIRDRESSER") {
      const settings = await prisma.b2BSettings.findFirst();
      const discountPct = settings?.hairdresserDiscountPct ?? 2000;
      const prices = variantsWithPrices.map((v) =>
        roundHalereUp((v.retailPricePerGram * (10000 - discountPct)) / 10000)
      );
      pricePerGram = Math.min(...prices);
      priceTip100g = pricePerGram * 100;
      tierBadge = t("productDetail.yourPrice");
      retailPricePerGram = minRetail;
    } else if (role === "SALON") {
      const prices = variantsWithPrices.map((v) => v.wholesalePricePerGram);
      pricePerGram = Math.min(...prices);
      priceTip100g = pricePerGram * 100;
      tierBadge = t("productDetail.yourPrice");
      retailPricePerGram = minRetail;
    } else {
      // Guest / OWNER / EMPLOYEE — show retail price
      pricePerGram = minRetail;
      priceTip100g = pricePerGram * 100;
    }
  }

  const colorName = (nameKey: string) => t(`colors.${nameKey}`);

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
  const colors = [...new Set(product.variants.map((v) => v.color))];

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
  const description = localizedDesc || catDesc;

  // Product schema JSON-LD
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: description || undefined,
    image: product.photos.length > 0 ? product.photos[0] : undefined,
    offers: {
      "@type": "Offer",
      price: priceTip100g ? (priceTip100g / 100).toFixed(2) : undefined,
      priceCurrency: "CZK",
      availability: "https://schema.org/InStock",
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
                <TextureSwatch texture={product.texture} tone={product.tone} size={32} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.textureLabel")}</div>
                  <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{product.texture}</div>
                </div>
              </Link>
            )}
            {product.tone && (
              <Link
                href={`/offer?tone=${encodeURIComponent(product.tone)}`}
                className="flex items-center gap-2.5 hover:bg-nude-100 rounded-lg p-1 -m-1 transition-colors"
              >
                <span className="w-5 h-5 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getToneInfo(product.tone).hex }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.toneLabel")}</div>
                  <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{product.tone}</div>
                </div>
              </Link>
            )}
            {lengths.length > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📏</span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.lengthsLabel")}</div>
                  <div className="text-sm font-semibold text-ink">
                    {lengths[0]}–{lengths[lengths.length - 1]} cm
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎨</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.shadesLabel")}</div>
                <div className="text-sm font-semibold text-ink">{t("productDetail.shadesCount", { count: colors.length })}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✅</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.availabilityLabel")}</div>
                <div className="text-sm font-semibold text-emerald-700">{t("productDetail.inStock")}</div>
              </div>
            </div>
          </div>

          {/* Lengths + Colors detail */}
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("productDetail.availableLengths")}</div>
              <div className="flex flex-wrap gap-1.5">
                {lengths.map((len) => (
                  <Link
                    key={len}
                    href={`/offer?lengthCm=${len}`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-espresso border border-line hover:border-blush-300 hover:bg-blush-100 hover:text-rose-deep transition-colors"
                  >
                    {len} cm
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("productDetail.availableShades")}</div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((code) => {
                  const { hex, nameKey } = getHairColor(code);
                  return (
                    <Link
                      key={code}
                      href={`/offer?color=${encodeURIComponent(code)}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-line hover:border-blush-300 hover:bg-blush-100 transition-colors text-xs text-muted"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-line flex-shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      {colorName(nameKey)} ({code})
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variant table — compact */}
          {lengths.length > 0 && (
            <div className="rounded-xl border border-line overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-nude-50">
                    <th className="text-left px-4 py-2 text-xs text-muted font-medium uppercase tracking-wider">{t("productDetail.lengthTableLength")}</th>
                    <th className="text-left px-4 py-2 text-xs text-muted font-medium uppercase tracking-wider">{t("productDetail.lengthTableColors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lengths.map((len, i) => {
                    const variantColors = [...new Set(
                      product.variants.filter((v) => v.lengthCm === len).map((v) => v.color)
                    )];
                    return (
                      <tr key={len} className={i > 0 ? "border-t border-line" : ""}>
                        <td className="px-4 py-2 font-medium text-ink">
                          <Link href={`/offer?lengthCm=${len}`} className="hover:text-rose transition-colors">
                            {len} cm
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {variantColors.map((code) => {
                              const { hex, nameKey } = getHairColor(code);
                              return (
                                <Link
                                  key={code}
                                  href={`/offer?color=${encodeURIComponent(code)}`}
                                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-rose transition-colors"
                                >
                                  <span className="w-3.5 h-3.5 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: hex }} />
                                  {colorName(nameKey)} ({code})
                                </Link>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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

          {/* Add to inquiry */}
          <AddToInquiryForm
            productId={product.id}
            productName={product.name}
            variants={product.variants}
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
