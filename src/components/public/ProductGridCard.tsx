"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getTextureInfo } from "@/lib/hair-textures";

import { TextureSwatch } from "@/components/TextureSwatch";
import { useWishlist } from "@/lib/wishlist";

interface ProductGridCardVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  wholesalePricePerGram?: number;
  availableGrams: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
  retailPricePerPiece?: number | null;
  wholesalePricePerPiece?: number | null;
  availablePieces?: number | null;
  availableToOrder?: boolean;
}

export interface ProductGridCardProduct {
  id: string;
  slug: string | null;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  texture: string | null;
  colorTone: string | null;
  photos: string[];
  variants: ProductGridCardVariant[];
}

interface ProductGridCardProps {
  product: ProductGridCardProduct;
  userRole?: string | null;
  discountPct?: number;
  priority?: boolean;
  onCategoryClick?: (category: string) => void;
  onOriginClick?: (origin: string) => void;
  onTextureClick?: (texture: string) => void;
  onColorToneClick?: (colorTone: string) => void;
  activeOriginFilter?: string;
  activeTextureFilter?: string;
  activeColorToneFilter?: string;
}

export function ProductGridCard({
  product: p,
  userRole,
  discountPct = 0,
  priority = false,
  onCategoryClick,
  onOriginClick,
  onTextureClick,
  onColorToneClick,
  activeOriginFilter,
  activeTextureFilter,
  activeColorToneFilter,
}: ProductGridCardProps) {
  const t = useTranslations("public");
  const tTexture = useTranslations("texture");
  const tCategory = useTranslations("category");
  const locale = useLocale();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const wishlisted = p.slug ? isInWishlist(p.slug) : false;

  const localizedName =
    locale === "ru" && p.nameRu ? p.nameRu
    : locale === "uk" && p.nameUk ? p.nameUk
    : p.name;

  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };
  const textureInfo = getTextureInfo(p.texture);
  const textureLabel = p.texture ? tTexture(textureInfo.nameKey) : null;

  // Single variant per card (after flattenProductVariants)
  const v0 = p.variants[0] ?? null;
  const variantColor = v0?.color ?? null;
  const variantLength = v0?.lengthCm ?? null;
  const isByPiece = v0?.sellingMode === "BY_PIECE";
  const retailPrice = isByPiece ? (v0?.retailPricePerPiece ?? 0) : (v0?.retailPricePerGram ?? 0);
  const retailPricePerGramForPiece = isByPiece ? (v0?.retailPricePerGram ?? 0) : 0;
  const wholesalePrice = isByPiece ? (v0?.wholesalePricePerPiece ?? 0) : (v0?.wholesalePricePerGram ?? 0);
  const stock = isByPiece ? (v0?.availablePieces ?? 0) : (v0?.availableGrams ?? 0);
  const inStock = stock > 0;
  const canOrder = !inStock && !!v0?.availableToOrder;

  const href = `/offer/${p.slug ?? p.id}`;

  const categoryLabel = tCategory(p.category.toLowerCase());
  const categoryBadgeColors: Record<string, string> = {
    VIRGIN: "bg-amber-500 text-white",
    LUXE: "bg-violet-600 text-white",
    STANDARD: "bg-espresso/80 text-white",
    SALE: "bg-red-500 text-white",
  };
  const categoryHoverColors: Record<string, string> = {
    VIRGIN: "hover:bg-amber-600",
    LUXE: "hover:bg-violet-700",
    STANDARD: "hover:bg-espresso",
    SALE: "hover:bg-red-600",
  };
  const badgeColor = categoryBadgeColors[p.category] ?? "bg-mauve text-white";
  const hoverColor = categoryHoverColors[p.category] ?? "hover:bg-espresso";

  const isInteractive = !!onCategoryClick;

  const imageBlock = (
    <div className="aspect-[3/4] bg-nude-100 flex items-center justify-center relative overflow-hidden">
      {p.photos.length > 0 ? (
        <Image
          src={p.photos[0]}
          alt={localizedName}
          fill
          priority={priority}
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted/40">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
          <span className="text-[10px] font-medium uppercase tracking-wider">{t("inquiry.photoSoon")}</span>
        </div>
      )}
      {isInteractive ? (
        <button
          onClick={(e) => { e.preventDefault(); onCategoryClick!(p.category); }}
          className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm cursor-pointer ${badgeColor} ${hoverColor}`}
        >
          {categoryLabel}
        </button>
      ) : (
        <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm ${badgeColor}`}>
          {categoryLabel}
        </span>
      )}
      {!inStock && !canOrder && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="bg-white/90 text-ink text-xs font-bold px-3 py-1 rounded-md">
            {t("inquiry.outOfStock")}
          </span>
        </div>
      )}
      {canOrder && (
        <div className="absolute bottom-2 left-2">
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            {t("inquiry.availableToOrderContact")}
          </span>
        </div>
      )}
      {p.slug && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p.slug!); }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          aria-label={wishlisted ? t("wishlist.remove") : t("wishlist.add")}
        >
          <svg className={`w-4 h-4 ${wishlisted ? "text-rose" : "text-muted"}`} viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      )}
    </div>
  );

  const infoBlock = (
    <div className="p-2 sm:p-2.5 flex flex-col flex-1 min-w-0">
      {/* Origin badge only */}
      {p.origin && (
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {isInteractive ? (
            <button
              onClick={() => onOriginClick!(p.origin!)}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activeOriginFilter === p.origin
                  ? "bg-emerald-200 text-emerald-800 ring-1 ring-emerald-400"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {getOriginFlag(p.origin)} {originName(p.origin)}
            </button>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
              {getOriginFlag(p.origin)} {originName(p.origin)}
            </span>
          )}
        </div>
      )}

      {/* Product name */}
      {isInteractive ? (
        <Link href={href}>
          <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 hover:text-rose transition-colors mb-1">
            {localizedName}
          </h3>
        </Link>
      ) : (
        <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 mb-1">
          {localizedName}
        </h3>
      )}

      {/* Texture, Color, Length — each on its own line */}
      <div className="space-y-0.5 mb-1.5">
        {p.texture && (
          <div className="flex items-center gap-1.5">
            <TextureSwatch texture={p.texture} size={12} />
            <span className="text-[11px] text-muted">{textureLabel}</span>
          </div>
        )}
        {variantColor && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-line flex-shrink-0"
              style={{ backgroundColor: getHairColor(variantColor).hex }}
            />
            <span className="text-[11px] text-muted">{t(`colors.${getHairColor(variantColor).nameKey}`)}</span>
          </div>
        )}
        {variantLength && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
            <span className="text-[11px] text-muted">{variantLength} cm</span>
          </div>
        )}
      </div>

      {/* Price + stock */}
      <div className="flex items-end justify-between gap-1 mt-auto pt-1 border-t border-line/50">
        {(() => {
          if (retailPrice === 0) return null;
          const unit = isByPiece ? "ks" : "g";
          const priceDisplay = (retailPrice / 100).toFixed(0);

          if ((userRole === "SALON" || userRole === "HAIRDRESSER") && discountPct > 0) {
            // Discount from margin (margin = retail / 2 with 100% markup)
            const b2b = Math.ceil(retailPrice - (retailPrice * discountPct) / 20000);
            const b2bDisplay = (b2b / 100).toFixed(0);
            return (
              <div className="min-w-0">
                <span className="text-[10px] text-muted line-through">{priceDisplay} Kc/{unit}</span>
                <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/{unit}</span></div>
                {isByPiece && retailPricePerGramForPiece > 0 && (
                  <div className="text-[10px] text-muted">({(retailPricePerGramForPiece / 100).toFixed(0)} Kc/g)</div>
                )}
              </div>
            );
          }

          return (
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink">
                {priceDisplay} Kc<span className="text-[10px] font-normal text-muted">/{unit}</span>
              </div>
              {isByPiece && retailPricePerGramForPiece > 0 && (
                <div className="text-[10px] text-muted">({(retailPricePerGramForPiece / 100).toFixed(0)} Kc/g)</div>
              )}
            </div>
          );
        })()}
        <span className={`text-[10px] font-medium flex-shrink-0 ${
          inStock ? "text-emerald-600" : canOrder ? "text-amber-600" : "text-red-400"
        }`}>
          {inStock
            ? `${stock} ${isByPiece ? "ks" : "g"}`
            : canOrder
              ? t("inquiry.availableToOrderContact")
              : t("inquiry.outOfStock")}
        </span>
      </div>
    </div>
  );

  // Non-interactive card (homepage): entire card is a link
  if (!isInteractive) {
    return (
      <Link
        href={href}
        className={`group flex flex-col bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${inStock || canOrder ? "border-line" : "border-line grayscale opacity-50"}`}
      >
        {imageBlock}
        {infoBlock}
      </Link>
    );
  }

  // Interactive card (offer page): only image and title are links, badges are filter buttons
  return (
    <div className={`group flex flex-col bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${inStock || canOrder ? "border-line" : "border-line grayscale opacity-50"}`}>
      <Link href={href}>
        {imageBlock}
      </Link>
      {infoBlock}
    </div>
  );
}
