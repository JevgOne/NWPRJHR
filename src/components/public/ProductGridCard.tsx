"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getTextureInfo } from "@/lib/hair-textures";
import { getColorToneInfo } from "@/lib/color-tones";
import { TextureSwatch } from "@/components/TextureSwatch";

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

  const localizedName =
    locale === "ru" && p.nameRu ? p.nameRu
    : locale === "uk" && p.nameUk ? p.nameUk
    : p.name;

  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };
  const textureInfo = getTextureInfo(p.texture);
  const textureLabel = p.texture ? tTexture(textureInfo.nameKey) : null;

  // Aggregate variants — show only stocked lengths/colors
  const stockedVariants = p.variants.filter(v => v.sellingMode === "BY_PIECE" ? (v.availablePieces ?? 0) > 0 : v.availableGrams > 0);
  const uniqueLengths = [...new Set(stockedVariants.map(v => v.lengthCm))].sort((a, b) => a - b);
  const uniqueColors = [...new Set(stockedVariants.map(v => v.color))].sort((a, b) => parseInt(a) - parseInt(b));
  const priceVariants = p.variants.filter(v => v.retailPricePerGram > 0);
  const minRetailPrice = priceVariants.length > 0 ? Math.min(...priceVariants.map(v => v.retailPricePerGram)) : 0;
  const totalStock = p.variants.reduce((sum, v) => sum + v.availableGrams, 0);
  const inStock = totalStock > 0;
  // Check if any variant is BY_PIECE
  const hasPieceVariants = p.variants.some(v => v.sellingMode === "BY_PIECE");
  const totalPieces = p.variants.reduce((sum, v) => sum + (v.availablePieces ?? 0), 0);

  // For BY_PIECE variants, find min piece price
  const pieceVariants = p.variants.filter(v => v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0);
  const minPiecePrice = pieceVariants.length > 0 ? Math.min(...pieceVariants.map(v => v.retailPricePerPiece!)) : 0;

  const href = `/offer/${p.slug ?? p.id}`;

  const categoryLabel = tCategory(p.category.toLowerCase());
  const categoryBadgeColors: Record<string, string> = {
    VIRGIN: "bg-amber-600 text-white",
    PREMIUM: "bg-mauve text-white",
    STANDARD: "bg-emerald-600 text-white",
    SALE: "bg-red-500 text-white",
  };
  const categoryHoverColors: Record<string, string> = {
    VIRGIN: "hover:bg-amber-700",
    PREMIUM: "hover:bg-espresso",
    STANDARD: "hover:bg-emerald-700",
    SALE: "hover:bg-red-600",
  };
  const badgeColor = categoryBadgeColors[p.category] ?? "bg-mauve text-white";
  const hoverColor = categoryHoverColors[p.category] ?? "hover:bg-espresso";

  const isInteractive = !!onCategoryClick;

  const imageBlock = (
    <div className="aspect-[3/4] bg-nude-100 flex items-center justify-center relative">
      {p.photos.length > 0 ? (
        <img
          src={p.photos[0]}
          alt={localizedName}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
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
    </div>
  );

  const infoBlock = (
    <div className="p-2.5">
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

      {/* Texture */}
      {p.texture && (
        <div className="flex items-center gap-1.5 mb-1">
          <TextureSwatch texture={p.texture} size={14} />
          <span className="text-[10px] text-muted">{textureLabel}</span>
        </div>
      )}

      {/* Color */}
      {uniqueColors.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1">
          {uniqueColors.map((code) => (
            <div key={code} className="flex items-center gap-1">
              <span
                className="w-3.5 h-3.5 rounded-full border border-line flex-shrink-0"
                style={{ backgroundColor: getHairColor(code).hex }}
              />
              <span className="text-[10px] text-muted">{t(`colors.${getHairColor(code).nameKey}`)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Length */}
      {uniqueLengths.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] text-muted">📏</span>
          <span className="text-[10px] text-muted">{uniqueLengths.map(cm => `${cm} cm`).join(", ")}</span>
        </div>
      )}

      {/* Price + total stock */}
      <div className="flex items-baseline justify-between">
        {(() => {
          // BY_PIECE variant price
          if (hasPieceVariants && minPiecePrice > 0) {
            const priceDisplay = (minPiecePrice / 100).toFixed(0);
            if (userRole === "SALON") {
              const wholesalePieceVariants = pieceVariants.filter(v => v.wholesalePricePerPiece && v.wholesalePricePerPiece > 0);
              if (wholesalePieceVariants.length > 0) {
                const minB2B = Math.min(...wholesalePieceVariants.map(v => v.wholesalePricePerPiece!));
                const b2bDisplay = (minB2B / 100).toFixed(0);
                return (
                  <div>
                    <span className="text-[10px] text-muted line-through">{priceDisplay} Kc/ks</span>
                    <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/ks</span></div>
                  </div>
                );
              }
            }
            if (userRole === "HAIRDRESSER" && discountPct > 0) {
              const b2bMin = Math.ceil(minPiecePrice * (10000 - discountPct) / 10000);
              const b2bDisplay = (b2bMin / 100).toFixed(0);
              return (
                <div>
                  <span className="text-[10px] text-muted line-through">{priceDisplay} Kc/ks</span>
                  <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/ks</span></div>
                </div>
              );
            }
            return (
              <div className="text-sm font-bold text-ink">
                {priceDisplay} Kc<span className="text-[10px] font-normal text-muted">/ks</span>
              </div>
            );
          }

          // BY_GRAM variant price (existing logic)
          if (minRetailPrice === 0) return null;
          const priceDisplay = (minRetailPrice / 100).toFixed(0);

          if (userRole === "SALON") {
            const wholesaleVariants = p.variants.filter(v => v.wholesalePricePerGram && v.wholesalePricePerGram > 0);
            if (wholesaleVariants.length > 0) {
              const minB2B = Math.min(...wholesaleVariants.map(v => v.wholesalePricePerGram!));
              const b2bDisplay = (minB2B / 100).toFixed(0);
              return (
                <div>
                  <span className="text-[10px] text-muted line-through">
                    {priceDisplay} Kc/g
                  </span>
                  <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/g</span></div>
                </div>
              );
            }
          }
          if (userRole === "HAIRDRESSER" && discountPct > 0) {
            const b2bMin = Math.ceil(minRetailPrice * (10000 - discountPct) / 10000);
            const b2bDisplay = (b2bMin / 100).toFixed(0);
            return (
              <div>
                <span className="text-[10px] text-muted line-through">
                  {priceDisplay} Kc/g
                </span>
                <div className="text-sm font-bold text-rose">{b2bDisplay} Kc<span className="text-[10px] font-normal">/g</span></div>
              </div>
            );
          }

          return (
            <div className="text-sm font-bold text-ink">
              {priceDisplay} Kc<span className="text-[10px] font-normal text-muted">/g</span>
            </div>
          );
        })()}
        <span className={`text-[10px] font-medium ${inStock || totalPieces > 0 ? "text-emerald-600" : "text-red-400"}`}>
          {hasPieceVariants
            ? (totalPieces > 0 ? `${totalPieces} ks` : t("inquiry.outOfStock"))
            : (inStock ? `${totalStock} g` : t("inquiry.outOfStock"))}
        </span>
      </div>
    </div>
  );

  // Non-interactive card (homepage): entire card is a link
  if (!isInteractive) {
    return (
      <Link
        href={href}
        className={`block bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${inStock || totalPieces > 0 ? "border-line" : "border-line opacity-60"}`}
      >
        {imageBlock}
        {infoBlock}
      </Link>
    );
  }

  // Interactive card (offer page): only image and title are links, badges are filter buttons
  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${inStock || totalPieces > 0 ? "border-line" : "border-line opacity-60"}`}>
      <Link href={href}>
        {imageBlock}
      </Link>
      {infoBlock}
    </div>
  );
}
