"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { getOriginFlag } from "@/lib/origin-flags";
import { getHairColor } from "@/lib/hair-colors";
import { TextureSwatch } from "@/components/TextureSwatch";

interface SliderProduct {
  id: string;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  texture: string | null;
  photos: string[];
  variants: { lengthCm: number; color: string }[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<SliderProduct[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.data ?? []) as SliderProduct[];
        setProducts(items);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    if (products.length === 0) return;
    setCurrent((c) => (c + 1) % products.length);
  }, [products.length]);

  const prev = useCallback(() => {
    if (products.length === 0) return;
    setCurrent((c) => (c - 1 + products.length) % products.length);
  }, [products.length]);

  // Auto-slide every 4s
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, products.length]);

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 bg-nude-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Show 3 products at a time on desktop, 1 on mobile
  const visible = getVisibleProducts(products, current, 3);

  return (
    <div className="relative">
      {/* Desktop: 3 cards */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Mobile: 1 card */}
      <div className="sm:hidden">
        <ProductCard product={products[current]} />
      </div>

      {/* Navigation */}
      {products.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 bg-white border border-line rounded-full shadow-sm flex items-center justify-center hover:bg-nude-50 transition-colors"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white border border-line rounded-full shadow-sm flex items-center justify-center hover:bg-nude-50 transition-colors"
          >
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

    </div>
  );
}

function getVisibleProducts(products: SliderProduct[], start: number, count: number): SliderProduct[] {
  const result: SliderProduct[] = [];
  for (let i = 0; i < Math.min(count, products.length); i++) {
    result.push(products[(start + i) % products.length]);
  }
  return result;
}

function ProductCard({ product }: { product: SliderProduct }) {
  const t = useTranslations("public");
  const locale = useLocale();
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colors = [...new Set(product.variants.map((v) => v.color))];

  const categoryLabel = t(`slider.${product.category.toLowerCase()}` as "slider.virgin" | "slider.premium" | "slider.standard" | "slider.sale");

  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };

  const localizedName = locale === "ru" && product.nameRu
    ? product.nameRu
    : locale === "uk" && product.nameUk
      ? product.nameUk
      : product.name;

  return (
    <Link
      href={`/offer/${product.id}`}
      className="block bg-white rounded-xl border border-line overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] bg-nude-100 flex items-center justify-center">
        {product.photos.length > 0 ? (
          <img
            src={product.photos[0]}
            alt={localizedName}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="p-4">
        {/* Badges: category, origin, texture, tone */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blush-100 text-rose-deep">
            {categoryLabel}
          </span>
          {product.origin && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
              {getOriginFlag(product.origin)} {originName(product.origin)}
            </span>
          )}
          {product.texture && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
              <TextureSwatch texture={product.texture} size={18} />
              {product.texture}
            </span>
          )}
        </div>

        {/* Product name */}
        <h3 className="font-semibold text-ink text-sm truncate">{localizedName}</h3>

        {/* Length badges */}
        {lengths.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {lengths.map((len) => (
                <span
                  key={len}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium border border-line bg-white text-espresso"
                >
                  {len} cm
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {colors.map((code) => {
                return (
                  <span
                    key={code}
                    className="w-7 h-7 rounded-full border-2 border-line overflow-hidden"
                  >
                    <img src={`/swatches/color-${code}.png`} alt="" className="w-full h-full object-cover" />
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
