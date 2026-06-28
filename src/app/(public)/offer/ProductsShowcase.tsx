"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getTextureInfo, TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { TextureSwatch } from "@/components/TextureSwatch";
import { generateProductBioShort } from "@/lib/product-bio";

interface PublicVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  wholesalePricePerGram: number;
  availableGrams: number;
}

interface PublicProduct {
  id: string;
  slug: string | null;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  description: string | null;
  descriptionUk: string | null;
  descriptionRu: string | null;
  category: string;
  processingType: string;
  origin: string | null;
  texture: string | null;
  photos: string[];
  variants: PublicVariant[];
}

interface ShowcaseProps {
  userRole?: string | null;
  discountPct?: number;
}

export function ProductsShowcase({ userRole, discountPct = 0 }: ShowcaseProps) {
  const t = useTranslations("public");
  const tCategory = useTranslations("category");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [allProducts, setAllProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const activeCategory = searchParams.get("category") ?? "ALL";
  const activeOrigin = searchParams.get("origin") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeLength = searchParams.get("lengthCm") ?? "";
  const activeTexture = searchParams.get("texture") ?? "";
  const activeSearch = searchParams.get("search") ?? "";

  const categories = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"];

  const locale = useLocale();
  const colorName = (nameKey: string) => t(`colors.${nameKey}`);
  const originName = (origin: string) => { try { return t(`origins.${origin}`); } catch { return origin; } };
  const localizedName = (p: PublicProduct) =>
    locale === "ru" && p.nameRu ? p.nameRu
    : locale === "uk" && p.nameUk ? p.nameUk
    : p.name;

  const categoryBadgeColors: Record<string, { base: string; hover: string }> = {
    VIRGIN: { base: "bg-amber-600 text-white", hover: "hover:bg-amber-700" },
    PREMIUM: { base: "bg-mauve text-white", hover: "hover:bg-espresso" },
    STANDARD: { base: "bg-emerald-600 text-white", hover: "hover:bg-emerald-700" },
    SALE: { base: "bg-red-500 text-white", hover: "hover:bg-red-600" },
  };

  // Extract all available filter options from all products (unfiltered)
  const filterOptions = useMemo(() => {
    const origins: Record<string, number> = {};
    const lengths: Record<number, number> = {};
    const colors: Record<string, number> = {};
    const textures: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.origin) {
        origins[p.origin] = (origins[p.origin] ?? 0) + 1;
      }
      if (p.texture) {
        textures[p.texture] = (textures[p.texture] ?? 0) + 1;
      }
      const pLengths = new Set<number>();
      const pColors = new Set<string>();
      p.variants.forEach((v) => {
        pLengths.add(v.lengthCm);
        pColors.add(v.color);
      });
      pLengths.forEach((l) => {
        lengths[l] = (lengths[l] ?? 0) + 1;
      });
      pColors.forEach((c) => {
        colors[c] = (colors[c] ?? 0) + 1;
      });
    });

    return {
      origins: Object.entries(origins).sort((a, b) => b[1] - a[1]),
      lengths: Object.entries(lengths)
        .map(([l, c]) => [Number(l), c] as [number, number])
        .sort((a, b) => a[0] - b[0]),
      colors: Object.entries(colors).sort((a, b) => b[1] - a[1]),
      textures: Object.entries(textures).sort((a, b) => b[1] - a[1]),
    };
  }, [allProducts]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/offer?${params.toString()}`, { scroll: false });
  }

  function toggleFilter(key: string, value: string) {
    const current = searchParams.get(key);
    setFilter(key, current === value ? "" : value);
  }

  function clearFilters() {
    setSearchInput("");
    router.push("/offer", { scroll: false });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter("search", searchInput.trim());
  }

  // Fetch all products once for filter options
  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => setAllProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch filtered products
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") params.set("category", activeCategory);
    if (activeOrigin) params.set("origin", activeOrigin);
    if (activeColor) params.set("color", activeColor);
    if (activeLength) params.set("lengthCm", activeLength);
    if (activeTexture) params.set("texture", activeTexture);
    if (activeSearch) params.set("search", activeSearch);

    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, activeOrigin, activeColor, activeLength, activeTexture, activeSearch]);

  // Flatten products into individual variant cards
  const variantCards = useMemo(() => {
    return products.flatMap((p) =>
      p.variants
        .filter((v) => v.retailPricePerGram > 0)
        .map((v) => ({
          product: p,
          variant: v,
        }))
    ).sort((a, b) => b.variant.availableGrams - a.variant.availableGrams || a.variant.retailPricePerGram - b.variant.retailPricePerGram);
  }, [products]);

  const categoryLabel = (cat: string) => {
    if (cat === "ALL") return tCommon("all");
    return tCategory(cat.toLowerCase());
  };

  const hasActiveFilters = activeOrigin || activeColor || activeLength || activeTexture || activeSearch;

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("offer.searchPlaceholder")}
            className="w-full pl-10 pr-20 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-rose focus:border-rose"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                if (activeSearch) setFilter("search", "");
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-muted hover:text-muted text-sm"
            >
              &times;
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-rose text-white text-xs font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {tCommon("search")}
          </button>
        </div>
      </form>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter("category", cat === "ALL" ? "" : cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              (cat === "ALL" && activeCategory === "ALL") || activeCategory === cat
                ? "border-rose bg-blush-100 text-rose-deep"
                : "border-line text-muted hover:bg-nude-50"
            }`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Filter panels: origin, length, color */}
      <div className="bg-nude-50 rounded-xl border border-line p-4 mb-6 space-y-4">
        {/* Origins */}
        {filterOptions.origins.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.originLabel")}</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.origins.map(([origin, count]) => (
                <button
                  key={origin}
                  onClick={() => toggleFilter("origin", origin)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeOrigin === origin
                      ? "border-emerald-400 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                      : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                  }`}
                >
                  {getOriginFlag(origin)} {originName(origin)}
                  <span className="text-muted ml-0.5">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lengths */}
        {filterOptions.lengths.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.lengthLabel")}</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.lengths.map(([len, count]) => (
                <button
                  key={len}
                  onClick={() => toggleFilter("lengthCm", String(len))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeLength === String(len)
                      ? "border-rose bg-blush-100 text-rose-deep ring-1 ring-blush-300"
                      : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                  }`}
                >
                  {len} cm
                  <span className="text-muted ml-1">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors — hair texture photo swatches */}
        {filterOptions.colors.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.colorLabel")}</div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.colors.map(([code, count]) => {
                const { nameKey } = getHairColor(code);
                const isActive = activeColor === code;
                return (
                  <button
                    key={code}
                    onClick={() => toggleFilter("color", code)}
                    className={`group relative w-9 h-9 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${
                      isActive
                        ? "border-rose ring-2 ring-blush-300 scale-110 z-10"
                        : "border-line hover:border-blush-300 hover:scale-110"
                    }`}
                    title={`${colorName(nameKey)} (${count})`}
                  >
                    <img src={`/swatches/color-${code}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-xs font-bold text-white">✓</span>
                      </span>
                    )}
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded bg-ink text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {colorName(nameKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Textures — visual swatches */}
        {filterOptions.textures.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.textureLabel")}</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.textures.map(([tex, count]) => {
                return (
                  <button
                    key={tex}
                    onClick={() => toggleFilter("texture", tex)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      activeTexture === tex
                        ? "border-violet-400 bg-violet-100 text-violet-800 ring-1 ring-violet-300"
                        : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                    }`}
                  >
                    <TextureSwatch texture={tex} size={20} />
                    {tex}
                    <span className="text-muted ml-0.5">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted font-medium">{t("offer.activeFilters")}</span>
          {activeSearch && (
            <button
              onClick={() => { setSearchInput(""); setFilter("search", ""); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              &quot;{activeSearch}&quot;
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          {activeOrigin && (
            <button
              onClick={() => setFilter("origin", "")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              {getOriginFlag(activeOrigin)} {originName(activeOrigin)}
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          {activeColor && (
            <button
              onClick={() => setFilter("color", "")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-nude-100 text-espresso hover:bg-nude-100 transition-colors"
            >
              <img src={`/swatches/color-${activeColor}.png`} alt="" className="w-4 h-4 rounded-full object-cover border border-line" />
              {activeColor} — {colorName(getHairColor(activeColor).nameKey)}
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          {activeLength && (
            <button
              onClick={() => setFilter("lengthCm", "")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-nude-100 text-espresso hover:bg-nude-200 transition-colors"
            >
              {activeLength} cm
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          {activeTexture && (
            <button
              onClick={() => setFilter("texture", "")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
            >
              <TextureSwatch texture={activeTexture} size={16} />
              {activeTexture}
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-muted hover:text-muted underline ml-1"
          >
            {t("offer.clearAll")}
          </button>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div className="text-xs text-muted mb-3">
          {t("offer.productCount", { count: variantCards.length })}
        </div>
      )}

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : variantCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-3">{t("products.noProducts")}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-rose hover:underline"
            >
              {t("offer.clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {variantCards.map(({ product: p, variant: v }) => {
            const { nameKey } = getHairColor(v.color);
            const inStock = v.availableGrams > 0;

            return (
              <div
                key={`${p.id}-${v.lengthCm}-${v.color}`}
                className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${inStock ? "border-line" : "border-line opacity-60"}`}
              >
                {/* Product image */}
                <Link href={`/offer/${p.slug ?? p.id}`}>
                  <div className="aspect-[3/4] bg-nude-100 flex items-center justify-center relative">
                    {p.photos.length > 0 ? (
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {/* Category badge */}
                    <button
                      onClick={(e) => { e.preventDefault(); setFilter("category", p.category); }}
                      className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm cursor-pointer ${(categoryBadgeColors[p.category]?.base ?? "bg-rose text-white")} ${(categoryBadgeColors[p.category]?.hover ?? "hover:bg-rose-deep")}`}
                    >
                      {tCategory(p.category.toLowerCase())}
                    </button>
                  </div>
                </Link>

                <div className="p-2.5">
                  {/* Origin + texture badges */}
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {p.origin && (
                      <button
                        onClick={() => toggleFilter("origin", p.origin!)}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          activeOrigin === p.origin
                            ? "bg-emerald-200 text-emerald-800 ring-1 ring-emerald-400"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {getOriginFlag(p.origin)} {originName(p.origin)}
                      </button>
                    )}
                    {p.texture && (
                      <button
                        onClick={() => toggleFilter("texture", p.texture!)}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          activeTexture === p.texture
                            ? "bg-violet-200 text-violet-800 ring-1 ring-violet-400"
                            : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                        }`}
                      >
                        <TextureSwatch texture={p.texture} size={14} />
                        {p.texture}
                      </button>
                    )}
                  </div>

                  {/* Product name */}
                  <Link href={`/offer/${p.slug ?? p.id}`}>
                    <h3 className="font-medium text-ink text-xs leading-tight line-clamp-2 hover:text-rose transition-colors mb-0.5">
                      {localizedName(p)}
                    </h3>
                  </Link>
                  <p className="text-[10px] text-muted line-clamp-1 mb-1">
                    {generateProductBioShort({
                      name: localizedName(p),
                      category: p.category,
                      processingType: p.processingType,
                      origin: p.origin,
                      texture: p.texture,
                    })}
                  </p>

                  {/* Exact length + color */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[11px] font-medium text-ink">{v.lengthCm} cm</span>
                    <span className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
                      <img src={`/swatches/color-${v.color}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
                    </span>
                    <span className="text-[10px] text-muted">{colorName(nameKey)}</span>
                  </div>

                  {/* Price + stock */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline justify-between">
                      {(() => {
                        const retailDisplay = (v.retailPricePerGram / 100).toFixed(0);
                        if (userRole === "SALON" && v.wholesalePricePerGram > 0) {
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
