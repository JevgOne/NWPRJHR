"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CategoryBadge } from "@/components/products/CategoryBadge";
import { TextureSwatch } from "@/components/TextureSwatch";
import { getColorToneInfo } from "@/lib/color-tones";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";

interface VariantItem {
  id?: string;
  lengthCm: number;
  color: string;
  retailPricePerGram?: number;
  wholesalePricePerGram?: number;
  active: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  colorTone?: string | null;
  photos?: string;
  slug?: string | null;
  variants?: VariantItem[];
  [key: string]: unknown;
}

const CATEGORIES = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const;

export function ProductListClient({ products, stockMap }: { products: ProductItem[]; stockMap: Record<string, number> }) {
  const t = useTranslations();
  const tCat = useTranslations("category");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("");
  const [textureFilter, setTextureFilter] = useState<string>("");

  // Extract filter options
  const filterOptions = useMemo(() => {
    const origins = new Set<string>();
    const textures = new Set<string>();
    products.forEach((p) => {
      if (p.origin) origins.add(p.origin);
      if (p.texture) textures.add(p.texture);
    });
    return {
      origins: [...origins].sort(),
      textures: [...textures].sort(),
    };
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (originFilter && p.origin !== originFilter) return false;
      if (textureFilter && p.texture !== textureFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.origin?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [products, categoryFilter, originFilter, textureFilter, search]);

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search") + "..."}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-1 focus:ring-rose focus:border-rose"
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? "border-rose bg-blush-100 text-rose-deep"
                  : "border-line text-muted hover:bg-nude-50"
              }`}
            >
              {cat === "ALL" ? t("common.all") : tCat(cat.toLowerCase())}
            </button>
          ))}
        </div>

        {/* Origin + Texture filters */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.origins.length > 1 && (
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="px-2 py-1.5 border border-line rounded-lg text-xs text-espresso bg-white"
            >
              <option value="">{t("product.origin")} — {t("common.all")}</option>
              {filterOptions.origins.map((o) => (
                <option key={o} value={o}>{getOriginFlag(o)} {o}</option>
              ))}
            </select>
          )}
          {filterOptions.textures.length > 1 && (
            <select
              value={textureFilter}
              onChange={(e) => setTextureFilter(e.target.value)}
              className="px-2 py-1.5 border border-line rounded-lg text-xs text-espresso bg-white"
            >
              <option value="">{t("product.texture") || "Struktura"} — {t("common.all")}</option>
              {filterOptions.textures.map((tex) => (
                <option key={tex} value={tex}>{tex}</option>
              ))}
            </select>
          )}
          {(originFilter || textureFilter) && (
            <button
              onClick={() => { setOriginFilter(""); setTextureFilter(""); }}
              className="text-xs text-muted hover:text-rose underline"
            >
              {t("common.delete") || "Reset"}
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted mb-3">
        {filtered.length} / {products.length}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted text-sm">
          {t("common.search")} — 0
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const photos: string[] = (() => {
              try { return product.photos ? JSON.parse(product.photos) : []; } catch { return []; }
            })();
            const variants = product.variants ?? [];
            const prices = variants
              .map((v) => v.retailPricePerGram ?? 0)
              .filter((p) => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : null;
            const lengths = [...new Set(variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
            const colors = [...new Set(variants.map((v) => v.color))];
            const stock = variants.reduce((sum, v) => sum + (v.id ? (stockMap[v.id] ?? 0) : 0), 0);

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex gap-3 bg-white rounded-xl border border-line p-3 hover:shadow-md hover:border-blush-300 transition-all"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-nude-100 overflow-hidden flex-shrink-0 relative">
                  {photos.length > 0 ? (
                    <Image src={photos[0]} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-ink text-sm leading-tight truncate">
                      {product.name}
                    </h3>
                    <CategoryBadge
                      category={product.category as "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE"}
                    />
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    {product.origin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                        {getOriginFlag(product.origin)} {product.origin}
                      </span>
                    )}
                    {product.texture && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
                        <TextureSwatch texture={product.texture} size={12} />
                        {product.texture}
                      </span>
                    )}
                    {product.colorTone && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
                        {product.colorTone}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: colors, lengths, price, stock */}
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    {colors.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        {colors.slice(0, 4).map((c) => (
                          <span key={c} className="w-3 h-3 rounded-full border border-line" style={{ backgroundColor: getHairColor(c).hex }} />
                        ))}
                        {colors.length > 4 && <span>+{colors.length - 4}</span>}
                      </span>
                    )}
                    {lengths.length > 0 && (
                      <span>{lengths.map((l) => `${l}cm`).join(", ")}</span>
                    )}
                    {minPrice && (
                      <span className="font-medium text-ink">
                        {(minPrice / 100).toFixed(0)} Kc/g
                      </span>
                    )}
                    <span className={`ml-auto font-medium ${stock > 0 ? "text-emerald-600" : "text-red-400"}`}>
                      {stock > 0 ? `${stock} g` : "0 g"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
