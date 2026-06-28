"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { getOriginFlag } from "@/lib/origin-flags";
import { getHairColor } from "@/lib/hair-colors";

interface SliderVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  availableGrams: number;
}

interface SliderProduct {
  id: string;
  slug: string | null;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  texture: string | null;
  photos: string[];
  variants: SliderVariant[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<SliderProduct[]>([]);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  // Flatten to variant cards, pick top 4 with most stock
  const cards = useMemo(() => {
    return products
      .flatMap((p) =>
        p.variants
          .filter((v) => v.retailPricePerGram > 0 && v.availableGrams > 0)
          .map((v) => ({ product: p, variant: v }))
      )
      .sort((a, b) => b.variant.availableGrams - a.variant.availableGrams)
      .slice(0, 4);
  }, [products]);

  if (cards.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[3/4] bg-nude-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ product: p, variant: v }) => (
        <VariantCard key={`${p.id}-${v.lengthCm}-${v.color}`} product={p} variant={v} />
      ))}
    </div>
  );
}

function VariantCard({ product, variant }: { product: SliderProduct; variant: SliderVariant }) {
  const t = useTranslations("public");
  const locale = useLocale();

  const localizedName = locale === "ru" && product.nameRu
    ? product.nameRu
    : locale === "uk" && product.nameUk
      ? product.nameUk
      : product.name;

  const categoryLabel = t(`slider.${product.category.toLowerCase()}` as "slider.virgin" | "slider.premium" | "slider.standard" | "slider.sale");

  const categoryBadgeColors: Record<string, string> = {
    VIRGIN: "bg-amber-600 text-white",
    PREMIUM: "bg-mauve text-white",
    STANDARD: "bg-emerald-600 text-white",
    SALE: "bg-red-500 text-white",
  };
  const badgeColor = categoryBadgeColors[product.category] ?? "bg-mauve text-white";

  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };

  const { nameKey } = getHairColor(variant.color);
  const colorName = (key: string) => {
    try { return t(`colors.${key}`); } catch { return key; }
  };

  return (
    <Link
      href={`/offer/${product.slug ?? product.id}`}
      className="block bg-white rounded-xl border border-line overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] bg-nude-100 flex items-center justify-center relative">
        {product.photos.length > 0 ? (
          <img
            src={product.photos[0]}
            alt={localizedName}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm ${badgeColor}`}>
          {categoryLabel}
        </span>
      </div>
      <div className="p-2.5">
        {/* Origin + texture badges */}
        {(product.origin || product.texture) && (
          <div className="mb-1 flex flex-wrap gap-1">
            {product.origin && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                {getOriginFlag(product.origin)} {originName(product.origin)}
              </span>
            )}
            {product.texture && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
                {product.texture}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 mb-1">{localizedName}</h3>

        {/* Exact length + color */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11px] font-medium text-ink">{variant.lengthCm} cm</span>
          <span className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
            <img src={`/swatches/color-${variant.color}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
          </span>
          <span className="text-[10px] text-muted">{colorName(nameKey)}</span>
        </div>

        {/* Price + stock */}
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-bold text-ink">
            {(variant.retailPricePerGram / 100).toFixed(0)} Kč<span className="text-[10px] font-normal text-muted">/g</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-600">
            {variant.availableGrams} g
          </span>
        </div>
      </div>
    </Link>
  );
}
