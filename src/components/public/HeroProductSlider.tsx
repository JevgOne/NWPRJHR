"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { getOriginFlag } from "@/lib/origin-flags";

interface GridProduct {
  id: string;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  texture: string | null;
  photos: string[];
  variants: { lengthCm: number; color: string; retailPricePerGram: number }[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<GridProduct[]>([]);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.data ?? []) as GridProduct[];
        setProducts(items.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  if (products.length === 0) {
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
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: GridProduct }) {
  const t = useTranslations("public");
  const locale = useLocale();
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const minPrice = Math.min(...product.variants.map((v) => v.retailPricePerGram));
  const pricePerGram = minPrice > 0 ? (minPrice / 100).toFixed(0) : null;

  const localizedName = locale === "ru" && product.nameRu
    ? product.nameRu
    : locale === "uk" && product.nameUk
      ? product.nameUk
      : product.name;

  const categoryLabel = t(`slider.${product.category.toLowerCase()}` as "slider.virgin" | "slider.premium" | "slider.standard" | "slider.sale");

  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };

  return (
    <Link
      href={`/offer/${product.id}`}
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
        {/* Category badge overlay */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blush-100/90 text-rose-deep backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 mb-1.5">{localizedName}</h3>

        {/* Origin */}
        {product.origin && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 mb-1">
            {getOriginFlag(product.origin)} {originName(product.origin)}
          </span>
        )}

        {/* Lengths */}
        {lengths.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mb-1.5">
            {lengths.map((len) => (
              <span key={len} className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-line bg-nude-50 text-espresso">
                {len} cm
              </span>
            ))}
          </div>
        )}

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mb-1.5">
            {colors.map((code) => (
              <span key={code} className="w-5 h-5 rounded-full border border-line overflow-hidden">
                <img src={`/swatches/color-${code}.png`} alt="" className="w-full h-full object-cover" />
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        {pricePerGram && (
          <div className="text-sm font-bold text-ink">
            {t("offer.priceFrom")} {pricePerGram} Kč<span className="text-[10px] font-normal text-muted">/g</span>
          </div>
        )}
      </div>
    </Link>
  );
}
