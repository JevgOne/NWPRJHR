"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getColorToneInfo } from "@/lib/color-tones";
import { TextureSwatch } from "@/components/TextureSwatch";
import { ProductGridCard } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { FilterPanel } from "@/components/public/FilterPanel";
import { FilterDrawer } from "@/components/public/FilterDrawer";

interface PublicVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  wholesalePricePerGram: number;
  availableGrams: number;
  sellingMode?: "BY_GRAM" | "BY_PIECE";
  retailPricePerPiece?: number | null;
  availablePieces?: number | null;
  exclusivePieces?: number;
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
  initialProducts: PublicProduct[];
}

export function ProductsShowcase({ userRole, discountPct = 0, initialProducts }: ShowcaseProps) {
  const t = useTranslations("public");
  const tCategory = useTranslations("category");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const allProducts = initialProducts;
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCategory = searchParams.get("category") ?? "ALL";
  const activeOrigin = searchParams.get("origin") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeLength = searchParams.get("lengthCm") ?? "";
  const activeTexture = searchParams.get("texture") ?? "";
  const activeColorTone = searchParams.get("colorTone") ?? "";
  const activeSearch = searchParams.get("search") ?? "";
  const activeSelling = searchParams.get("selling") ?? "";

  const categories = ["ALL", "VIRGIN", "LUXE", "STANDARD", "SALE", "ACCESSORY"];

  const colorName = (nameKey: string) => t(`colors.${nameKey}`);
  const originName = (origin: string) => { try { return t(`origins.${origin}`); } catch { return origin; } };

  // Faceted filter counts: each filter group counts products matching ALL OTHER active filters (excluding itself)
  const filterOptions = useMemo(() => {
    function matchesFilters(p: (typeof allProducts)[0], skip?: string) {
      if (skip !== "category" && activeCategory !== "ALL" && p.category !== activeCategory) return false;
      if (skip !== "origin" && activeOrigin && p.origin !== activeOrigin) return false;
      if (skip !== "texture" && activeTexture && p.texture !== activeTexture) return false;
      if (skip !== "colorTone" && activeColorTone && p.colorTone !== activeColorTone) return false;
      if (skip !== "selling" && activeSelling) {
        if (!p.variants.some(v => (v.sellingMode ?? "BY_GRAM") === activeSelling)) return false;
      }
      if (skip !== "color" && activeColor) {
        if (!p.variants.some((v: PublicVariant) => v.color === activeColor)) return false;
      }
      if (skip !== "length" && activeLength) {
        if (!p.variants.some((v: PublicVariant) => v.lengthCm === parseInt(activeLength, 10))) return false;
      }
      if (activeSearch) {
        const haystack = [p.name, p.nameUk, p.nameRu, p.origin, p.description].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(activeSearch.toLowerCase())) return false;
      }
      return true;
    }

    const origins: Record<string, number> = {};
    const lengths: Record<number, number> = {};
    const colors: Record<string, number> = {};
    const textures: Record<string, number> = {};
    const colorTones: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.origin && matchesFilters(p, "origin")) {
        origins[p.origin] = (origins[p.origin] ?? 0) + 1;
      }
      if (p.texture && matchesFilters(p, "texture")) {
        textures[p.texture] = (textures[p.texture] ?? 0) + 1;
      }
      if (p.colorTone && matchesFilters(p, "colorTone")) {
        colorTones[p.colorTone] = (colorTones[p.colorTone] ?? 0) + 1;
      }
      if (matchesFilters(p, "length")) {
        const pLengths = new Set<number>();
        p.variants.forEach((v) => {
          if (!activeColor || v.color === activeColor) pLengths.add(v.lengthCm);
        });
        pLengths.forEach((l) => { lengths[l] = (lengths[l] ?? 0) + 1; });
      }
      if (matchesFilters(p, "color")) {
        const pColors = new Set<string>();
        p.variants.forEach((v) => {
          if (!activeLength || v.lengthCm === parseInt(activeLength, 10)) pColors.add(v.color);
        });
        pColors.forEach((c) => { colors[c] = (colors[c] ?? 0) + 1; });
      }
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
  }, [allProducts, activeCategory, activeOrigin, activeColor, activeLength, activeTexture, activeColorTone, activeSearch, activeSelling]);

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

  const hasActiveFilters = activeOrigin || activeColor || activeLength || activeTexture || activeColorTone || activeSearch || activeSelling;

  // Count active filters for badge
  const activeFilterCount = [activeOrigin, activeColor, activeLength, activeTexture, activeColorTone, activeSelling].filter(Boolean).length;

  // Auto-open filter panel on desktop if filters active on mount
  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter products client-side via useMemo (runs during SSR too)
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
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
  }, [allProducts, activeCategory, activeOrigin, activeColor, activeLength, activeTexture, activeColorTone, activeSearch, activeSelling]);

  // Flatten to 1 card per variant, sort by stock (descending)
  const sortedProducts = useMemo(() => {
    const priced = filteredProducts.filter((p) => p.variants.some((v) => v.retailPricePerGram > 0 || (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0)));
    const flat = flattenProductVariants(priced);
    return flat.sort((a, b) => {
      const va = a.variants[0];
      const vb = b.variants[0];
      const sa = (va?.availableGrams ?? 0) + (va?.availablePieces ?? 0);
      const sb = (vb?.availableGrams ?? 0) + (vb?.availablePieces ?? 0);
      return sb - sa;
    });
  }, [filteredProducts]);

  const categoryLabel = (cat: string) => {
    if (cat === "ALL") return tCommon("all");
    return tCategory(cat.toLowerCase());
  };

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

      {/* Active chips + Filter button row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Active filter chips */}
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
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted hover:text-muted underline ml-1"
          >
            {t("offer.clearAll")}
          </button>
        )}

        {/* Filter button — desktop: toggle collapsible */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line text-sm font-medium text-espresso hover:bg-nude-50 ml-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          {t("offer.filtersButton")}
          {activeFilterCount > 0 && (
            <span className="bg-rose text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter button — mobile: open drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line text-sm font-medium text-espresso hover:bg-nude-50 ml-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          {t("offer.filtersButton")}
          {activeFilterCount > 0 && (
            <span className="bg-rose text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop collapsible filter panel */}
      <div className={`hidden md:block overflow-hidden transition-all duration-300 ${
        filtersOpen ? "max-h-[2000px] opacity-100 mb-6" : "max-h-0 opacity-0"
      }`}>
        <div className="bg-nude-50 rounded-xl border border-line p-4">
          <FilterPanel
            filterOptions={filterOptions}
            activeSelling={activeSelling}
            activeOrigin={activeOrigin}
            activeLength={activeLength}
            activeColor={activeColor}
            activeTexture={activeTexture}
            activeColorTone={activeColorTone}
            onSetFilter={setFilter}
            onToggleFilter={toggleFilter}
          />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={sortedProducts.length}
        onClearAll={clearFilters}
      >
        <FilterPanel
          filterOptions={filterOptions}
          activeSelling={activeSelling}
          activeOrigin={activeOrigin}
          activeLength={activeLength}
          activeColor={activeColor}
          activeTexture={activeTexture}
          activeColorTone={activeColorTone}
          onSetFilter={setFilter}
          onToggleFilter={toggleFilter}
        />
      </FilterDrawer>

      {/* Results count */}
      <div className="text-xs text-muted mb-3">
        {t("offer.productCount", { count: sortedProducts.length })}
      </div>

      {sortedProducts.length === 0 ? (
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
