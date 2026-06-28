"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getTextureInfo } from "@/lib/hair-textures";
import { getColorToneInfo } from "@/lib/color-tones";
import { TextureSwatch } from "@/components/TextureSwatch";

interface ProductCardVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  wholesalePricePerGram?: number;
  availableGrams: number;
}

interface ProductCardProduct {
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
}

interface ProductCardProps {
  product: ProductCardProduct;
  variant: ProductCardVariant;
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

export function ProductCard({
  product: p,
  variant: v,
  userRole,
  discountPct = 0,
  onCategoryClick,
  onOriginClick,
  onTextureClick,
  onColorToneClick,
  activeOriginFilter,
  activeTextureFilter,
  activeColorToneFilter,
}: ProductCardProps) {
  const t = useTranslations("public");
  const tTexture = useTranslations("texture");
  const tCategory = useTranslations("category");
  const locale = useLocale();

  const localizedName =
    locale === "ru" && p.nameRu ? p.nameRu
    : locale === "uk" && p.nameUk ? p.nameUk
    : p.name;

  const { nameKey } = getHairColor(v.color);
  const colorLabel = t(`colors.${nameKey}`);
  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };
  const textureInfo = getTextureInfo(p.texture);
  const textureLabel = p.texture ? tTexture(textureInfo.nameKey) : null;

  const inStock = v.availableGrams > 0;
  const href = `/offer/${p.slug ?? p.id}?color=${v.color}&length=${v.lengthCm}`;

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
      {/* Origin + texture badges */}
      {(p.origin || p.texture) && (
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {p.origin && (
            isInteractive ? (
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
            )
          )}
          {p.texture && (
            isInteractive ? (
              <button
                onClick={() => onTextureClick!(p.texture!)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  activeTextureFilter === p.texture
                    ? "bg-violet-200 text-violet-800 ring-1 ring-violet-400"
                    : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                }`}
              >
                <TextureSwatch texture={p.texture} size={14} />
                {textureLabel}
              </button>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
                <TextureSwatch texture={p.texture} size={14} />
                {textureLabel}
              </span>
            )
          )}
          {p.colorTone && (
            isInteractive ? (
              <button
                onClick={() => onColorToneClick!(p.colorTone!)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  activeColorToneFilter === p.colorTone
                    ? "bg-amber-200 text-amber-800 ring-1 ring-amber-400"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(p.colorTone).hex }} />
                {p.colorTone}
              </button>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(p.colorTone).hex }} />
                {p.colorTone}
              </span>
            )
          )}
        </div>
      )}

      {/* Product name */}
      {isInteractive ? (
        <Link href={href}>
          <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 hover:text-rose transition-colors mb-0.5">
            {localizedName}
          </h3>
        </Link>
      ) : (
        <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 mb-0.5">
          {localizedName}
        </h3>
      )}

      {/* Exact length + color */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] font-medium text-ink">{v.lengthCm} cm</span>
        <span className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
          <img src={`/swatches/color-${v.color}.png`} alt={colorLabel} className="w-full h-full object-cover" />
        </span>
        <span className="text-[10px] text-muted">{colorLabel}</span>
      </div>

      {/* Price + stock */}
      <div className="flex items-baseline justify-between">
        {(() => {
          const retailDisplay = (v.retailPricePerGram / 100).toFixed(0);
          if (userRole === "SALON" && v.wholesalePricePerGram && v.wholesalePricePerGram > 0) {
            const b2bDisplay = (v.wholesalePricePerGram / 100).toFixed(0);
            return (
              <div>
                <span className="text-[10px] text-muted line-through">{retailDisplay} Kč/g</span>
                <div className="text-sm font-bold text-rose">{b2bDisplay} Kč<span className="text-[10px] font-normal">/g</span></div>
              </div>
            );
          }
          if (userRole === "HAIRDRESSER" && discountPct > 0) {
            const b2bPrice = Math.ceil(v.retailPricePerGram * (10000 - discountPct) / 10000);
            const b2bDisplay = (b2bPrice / 100).toFixed(0);
            return (
              <div>
                <span className="text-[10px] text-muted line-through">{retailDisplay} Kč/g</span>
                <div className="text-sm font-bold text-rose">{b2bDisplay} Kč<span className="text-[10px] font-normal">/g</span></div>
              </div>
            );
          }
          return (
            <div className="text-sm font-bold text-ink">
              {retailDisplay} Kč<span className="text-[10px] font-normal text-muted">/g</span>
            </div>
          );
        })()}
        <span className={`text-[10px] font-medium ${inStock ? "text-emerald-600" : "text-red-400"}`}>
          {inStock ? `${v.availableGrams} g` : t("inquiry.outOfStock")}
        </span>
      </div>
    </div>
  );

  // Non-interactive card (homepage): entire card is a link
  if (!isInteractive) {
    return (
      <Link
        href={href}
        className={`block bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${inStock ? "border-line" : "border-line opacity-60"}`}
      >
        {imageBlock}
        {infoBlock}
      </Link>
    );
  }

  // Interactive card (offer page): only image and title are links, badges are filter buttons
  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${inStock ? "border-line" : "border-line opacity-60"}`}>
      <Link href={href}>
        {imageBlock}
      </Link>
      {infoBlock}
    </div>
  );
}
