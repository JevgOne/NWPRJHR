"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getTextureInfo, TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { getToneInfo, TONE_OPTIONS } from "@/lib/hair-tones";
import { TextureSwatch } from "@/components/TextureSwatch";

interface PublicVariant {
  lengthCm: number;
  color: string;
}

interface PublicProduct {
  id: string;
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
  tone: string | null;
  photos: string[];
  variants: PublicVariant[];
}

export function ProductsShowcase() {
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
  const activeTone = searchParams.get("tone") ?? "";
  const activeSearch = searchParams.get("search") ?? "";

  const categories = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"];

  const locale = useLocale();
  const colorName = (nameKey: string) => t(`colors.${nameKey}`);
  const originName = (origin: string) => { try { return t(`origins.${origin}`); } catch { return origin; } };
  const localizedName = (p: PublicProduct) =>
    locale === "ru" && p.nameRu ? p.nameRu
    : locale === "uk" && p.nameUk ? p.nameUk
    : p.name;

  // Extract all available filter options from all products (unfiltered)
  const filterOptions = useMemo(() => {
    const origins: Record<string, number> = {};
    const lengths: Record<number, number> = {};
    const colors: Record<string, number> = {};
    const textures: Record<string, number> = {};
    const tones: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.origin) {
        origins[p.origin] = (origins[p.origin] ?? 0) + 1;
      }
      if (p.texture) {
        textures[p.texture] = (textures[p.texture] ?? 0) + 1;
      }
      if (p.tone) {
        tones[p.tone] = (tones[p.tone] ?? 0) + 1;
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
      tones: Object.entries(tones).sort((a, b) => b[1] - a[1]),
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
    if (activeTone) params.set("tone", activeTone);
    if (activeSearch) params.set("search", activeSearch);

    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, activeOrigin, activeColor, activeLength, activeTexture, activeTone, activeSearch]);

  const productLengths = (p: PublicProduct) => [
    ...new Set(p.variants.map((v) => v.lengthCm)),
  ].sort((a, b) => a - b);

  const productColors = (p: PublicProduct) => [
    ...new Set(p.variants.map((v) => v.color)),
  ];

  const categoryLabel = (cat: string) => {
    if (cat === "ALL") return tCommon("all");
    return tCategory(cat.toLowerCase());
  };

  const hasActiveFilters = activeOrigin || activeColor || activeLength || activeTexture || activeTone || activeSearch;

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

        {/* Colors — circular swatches */}
        {filterOptions.colors.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.colorLabel")}</div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.colors.map(([code, count]) => {
                const { hex, nameKey } = getHairColor(code);
                const isActive = activeColor === code;
                return (
                  <button
                    key={code}
                    onClick={() => toggleFilter("color", code)}
                    className={`group relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      isActive
                        ? "border-rose ring-2 ring-blush-300 scale-110 z-10"
                        : "border-line hover:border-blush-300 hover:scale-110"
                    }`}
                    style={{ backgroundColor: hex }}
                    title={`${colorName(nameKey)} (${count})`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-bold ${parseInt(code) <= 5 ? "text-espresso" : "text-white"}`}>✓</span>
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

        {/* Tones */}
        {filterOptions.tones.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.toneLabel")}</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.tones.map(([tn, count]) => {
                const info = getToneInfo(tn);
                return (
                  <button
                    key={tn}
                    onClick={() => toggleFilter("tone", tn)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      activeTone === tn
                        ? "border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                        : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: info.hex }} />
                    {tn}
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
              <span
                className="w-3 h-3 rounded-full border border-line"
                style={{ backgroundColor: getHairColor(activeColor).hex }}
              />
              {activeColor} — {colorName(getHairColor(activeColor).nameKey)}
              <span className="ml-0.5">&times;</span>
            </button>
          )}
          {activeLength && (
            <button
              onClick={() => setFilter("lengthCm", "")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
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
          {activeTone && (
            <button
              onClick={() => setFilter("tone", "")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              <span className="w-3 h-3 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getToneInfo(activeTone).hex }} />
              {activeTone}
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
          {t("offer.productCount", { count: products.length })}
        </div>
      )}

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : products.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const pLengths = productLengths(p);
            const pColors = productColors(p);

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product image */}
                <Link href={`/offer/${p.id}`}>
                  <div className="h-72 bg-nude-100 flex items-center justify-center">
                    {p.photos.length > 0 ? (
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  {/* Category + Origin */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setFilter("category", p.category)}
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blush-100 text-rose-deep hover:bg-blush-200 transition-colors cursor-pointer"
                    >
                      {tCategory(p.category.toLowerCase())}
                    </button>
                    {p.origin && (
                      <button
                        onClick={() => toggleFilter("origin", p.origin!)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          activeTexture === p.texture
                            ? "bg-violet-200 text-violet-800 ring-1 ring-violet-400"
                            : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                        }`}
                      >
                        <TextureSwatch texture={p.texture} tone={p.tone} size={18} />
                        {p.texture}
                      </button>
                    )}
                    {p.tone && (
                      <button
                        onClick={() => toggleFilter("tone", p.tone!)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          activeTone === p.tone
                            ? "bg-amber-200 text-amber-800 ring-1 ring-amber-400"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-line flex-shrink-0" style={{ backgroundColor: getToneInfo(p.tone).hex }} />
                        {p.tone}
                      </button>
                    )}
                  </div>

                  {/* Product name */}
                  <Link href={`/offer/${p.id}`}>
                    <h3 className="font-semibold text-ink hover:text-rose transition-colors">
                      {localizedName(p)}
                    </h3>
                  </Link>

                  {/* Length badges */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {pLengths.map((len) => (
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
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color swatches — circles */}
                  <div className="mt-2.5">
                    <div className="flex flex-wrap gap-1">
                      {pColors.map((code) => {
                        const { hex, nameKey } = getHairColor(code);
                        const isActive = activeColor === code;
                        return (
                          <button
                            key={code}
                            onClick={() => toggleFilter("color", code)}
                            className={`group relative w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                              isActive
                                ? "border-rose ring-1 ring-blush-300 scale-110 z-10"
                                : "border-line hover:border-blush-300 hover:scale-110"
                            }`}
                            style={{ backgroundColor: hex }}
                            title={colorName(nameKey)}
                          >
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 px-1.5 py-0.5 rounded bg-ink text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              {colorName(nameKey)}
                            </span>
                          </button>
                        );
                      })}
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
