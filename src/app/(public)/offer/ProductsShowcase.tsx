"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getColorToneInfo } from "@/lib/color-tones";
import { TextureSwatch } from "@/components/TextureSwatch";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";

interface PublicVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  wholesalePricePerGram: number;
  availableGrams: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
  retailPricePerPiece?: number | null;
  availablePieces?: number | null;
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
  colorTone: string | null;
  photos: string[];
  variants: PublicVariant[];
}

interface ShowcaseProps {
  userRole?: string | null;
  discountPct?: number;
  initialProducts?: PublicProduct[];
}

export function ProductsShowcase({ userRole, discountPct = 0, initialProducts }: ShowcaseProps) {
  const t = useTranslations("public");
  const tCategory = useTranslations("category");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<PublicProduct[]>(initialProducts ?? []);
  const [allProducts, setAllProducts] = useState<PublicProduct[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const activeCategory = searchParams.get("category") ?? "ALL";
  const activeOrigin = searchParams.get("origin") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeLength = searchParams.get("lengthCm") ?? "";
  const activeTexture = searchParams.get("texture") ?? "";
  const activeColorTone = searchParams.get("colorTone") ?? "";
  const activeSearch = searchParams.get("search") ?? "";
  const activeSelling = searchParams.get("selling") ?? "";

  const categories = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"];

  const colorName = (nameKey: string) => t(`colors.${nameKey}`);
  const originName = (origin: string) => { try { return t(`origins.${origin}`); } catch { return origin; } };
  // Extract all available filter options from all products (unfiltered)
  const filterOptions = useMemo(() => {
    const origins: Record<string, number> = {};
    const lengths: Record<number, number> = {};
    const colors: Record<string, number> = {};
    const textures: Record<string, number> = {};
    const colorTones: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.origin) {
        origins[p.origin] = (origins[p.origin] ?? 0) + 1;
      }
      if (p.texture) {
        textures[p.texture] = (textures[p.texture] ?? 0) + 1;
      }
      if (p.colorTone) {
        colorTones[p.colorTone] = (colorTones[p.colorTone] ?? 0) + 1;
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
      colorTones: Object.entries(colorTones).sort((a, b) => b[1] - a[1]),
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

  // Fetch all products once — skip if initialProducts provided from server
  useEffect(() => {
    if (initialProducts) return;
    setLoading(true);
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => {
        setAllProducts(data.data ?? []);
        setProducts(data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialProducts]);

  // Apply filters client-side from allProducts (no extra fetch)
  useEffect(() => {
    if (allProducts.length === 0) return;
    const filtered = allProducts.filter((p) => {
      if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
      if (activeOrigin && p.origin !== activeOrigin) return false;
      if (activeTexture && p.texture !== activeTexture) return false;
      if (activeColorTone && p.colorTone !== activeColorTone) return false;
      if (activeColor || activeLength) {
        const hasMatch = p.variants.some(
          (v: PublicVariant) =>
            (!activeColor || v.color === activeColor) &&
            (!activeLength || v.lengthCm === parseInt(activeLength, 10))
        );
        if (!hasMatch) return false;
      }
      if (activeSelling) {
        const hasMatchingSelling = p.variants.some(v => (v.sellingMode ?? "BY_GRAM") === activeSelling);
        if (!hasMatchingSelling) return false;
      }
      if (activeSearch) {
        const haystack = [p.name, p.nameUk, p.nameRu, p.origin, p.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(activeSearch.toLowerCase())) return false;
      }
      return true;
    });
    setProducts(filtered);
  }, [allProducts, activeCategory, activeOrigin, activeColor, activeLength, activeTexture, activeColorTone, activeSearch, activeSelling]);

  // Flatten to 1 card per variant, sort by stock (descending)
  const sortedProducts = useMemo(() => {
    const priced = [...products].filter((p) => p.variants.some((v) => v.retailPricePerGram > 0 || (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0)));
    const flat = flattenProductVariants(priced);
    return flat.sort((a, b) => {
      const va = a.variants[0];
      const vb = b.variants[0];
      const sa = (va?.availableGrams ?? 0) + (va?.availablePieces ?? 0);
      const sb = (vb?.availableGrams ?? 0) + (vb?.availablePieces ?? 0);
      return sb - sa;
    });
  }, [products]);

  const categoryLabel = (cat: string) => {
    if (cat === "ALL") return tCommon("all");
    return tCategory(cat.toLowerCase());
  };

  const hasActiveFilters = activeOrigin || activeColor || activeLength || activeTexture || activeColorTone || activeSearch || activeSelling;

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

      {/* Selling mode toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider self-center mr-1">{t("offer.sellingMode")}</span>
        {[
          { value: "", label: t("offer.allProducts") },
          { value: "BY_GRAM", label: t("offer.byGram") },
          { value: "BY_PIECE", label: t("offer.byPiece") },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter("selling", value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeSelling === value
                ? "border-rose bg-blush-100 text-rose-deep"
                : "border-line text-muted hover:bg-nude-50"
            }`}
          >
            {label}
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
                    <span className="block w-full h-full rounded-full" style={{ backgroundColor: getHairColor(code).hex }} />
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

        {/* Color Tones — color dot swatches */}
        {filterOptions.colorTones.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.colorToneLabel")}</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.colorTones.map(([ct, count]) => {
                const info = getColorToneInfo(ct);
                return (
                  <button
                    key={ct}
                    onClick={() => toggleFilter("colorTone", ct)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      activeColorTone === ct
                        ? "border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                        : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-line/50" style={{ backgroundColor: info.hex }} />
                    {ct}
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
          {activeSelling && (
            <button
              onClick={() => setFilter("selling", "")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blush-100 text-rose-deep hover:bg-blush-200 transition-colors"
            >
              {activeSelling === "BY_GRAM" ? t("offer.byGram") : t("offer.byPiece")}
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
              <span className="w-4 h-4 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getHairColor(activeColor).hex }} />
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
          {activeColorTone && (
            <button
              onClick={() => setFilter("colorTone", "")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getColorToneInfo(activeColorTone).hex }} />
              {activeColorTone}
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
          {t("offer.productCount", { count: sortedProducts.length })}
        </div>
      )}

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : sortedProducts.length === 0 ? (
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
          {sortedProducts.map((p) => (
            <ProductGridCard
              key={p._variantKey}
              product={p}
              userRole={userRole}
              discountPct={discountPct}
              onCategoryClick={(cat) => setFilter("category", cat)}
              onOriginClick={(origin) => toggleFilter("origin", origin)}
              onTextureClick={(texture) => toggleFilter("texture", texture)}
              onColorToneClick={(ct) => toggleFilter("colorTone", ct)}
              activeOriginFilter={activeOrigin}
              activeTextureFilter={activeTexture}
              activeColorToneFilter={activeColorTone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
