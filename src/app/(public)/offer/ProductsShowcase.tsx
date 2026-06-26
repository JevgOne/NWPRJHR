"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";

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
  photos: string[];
  variants: PublicVariant[];
}

export function ProductsShowcase() {
  const t = useTranslations("public.products");
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
  const activeSearch = searchParams.get("search") ?? "";

  const categories = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"];

  // Extract all available filter options from all products (unfiltered)
  const filterOptions = useMemo(() => {
    const origins: Record<string, number> = {};
    const lengths: Record<number, number> = {};
    const colors: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.origin) {
        origins[p.origin] = (origins[p.origin] ?? 0) + 1;
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
    if (activeSearch) params.set("search", activeSearch);

    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, activeOrigin, activeColor, activeLength, activeSearch]);

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

  const hasActiveFilters = activeOrigin || activeColor || activeLength || activeSearch;

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
            placeholder="Hledat vlasy — název, původ, barva..."
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
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Původ</div>
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
                  {getOriginFlag(origin)} {origin}
                  <span className="text-muted ml-0.5">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lengths */}
        {filterOptions.lengths.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Délka</div>
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

        {/* Colors */}
        {filterOptions.colors.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Barva</div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.colors.map(([code, count]) => {
                const { hex, name } = getHairColor(code);
                const isActive = activeColor === code;
                return (
                  <button
                    key={code}
                    onClick={() => toggleFilter("color", code)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? "border-rose bg-blush-100 text-rose-deep ring-1 ring-blush-300"
                        : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                    }`}
                    title={name}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-line flex-shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    {name}
                    <span className="text-muted">{count}</span>
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
          <span className="text-xs text-muted font-medium">Aktivní filtry:</span>
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
              {getOriginFlag(activeOrigin)} {activeOrigin}
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
              {activeColor} — {getHairColor(activeColor).name}
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
          <button
            onClick={clearFilters}
            className="text-xs text-muted hover:text-muted underline ml-1"
          >
            Zrušit vše
          </button>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div className="text-xs text-muted mb-3">
          {products.length === 1 ? "1 produkt" : `${products.length} produktů`}
        </div>
      )}

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-3">{t("noProducts")}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-rose hover:underline"
            >
              Zrušit filtry
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
                        {getOriginFlag(p.origin)} {p.origin}
                      </button>
                    )}
                  </div>

                  {/* Product name */}
                  <Link href={`/offer/${p.id}`}>
                    <h3 className="font-semibold text-ink hover:text-rose transition-colors">
                      {p.name}
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

                  {/* Color circles */}
                  <div className="mt-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {pColors.map((code) => {
                        const { hex, name } = getHairColor(code);
                        const isActive = activeColor === code;
                        return (
                          <button
                            key={code}
                            onClick={() => toggleFilter("color", code)}
                            className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                              isActive
                                ? "border-rose ring-2 ring-blush-300 scale-110"
                                : "border-line hover:border-muted hover:scale-105"
                            }`}
                            style={{ backgroundColor: hex }}
                            title={`${code} — ${name}`}
                          />
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
