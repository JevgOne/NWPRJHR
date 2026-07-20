"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

interface SearchProduct {
  id: string;
  slug: string | null;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  description: string | null;
  descriptionUk: string | null;
  descriptionRu: string | null;
  texture: string | null;
  colorTone: string | null;
  photos: string[];
  variants: { retailPricePerGram: number; sellingMode?: string; retailPricePerPiece?: number | null; color: string; lengthCm: number }[];
}

let cachedProducts: SearchProduct[] | null = null;

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("public");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const localizedName = useCallback(
    (p: SearchProduct) =>
      locale === "ru" && p.nameRu ? p.nameRu
      : locale === "uk" && p.nameUk ? p.nameUk
      : p.name,
    [locale]
  );

  // Fetch products lazily on first open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);

    if (cachedProducts) {
      setProducts(cachedProducts);
      return;
    }

    setLoading(true);
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? json;
        cachedProducts = data;
        setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Client-side filtering (same logic as ProductsShowcase)
  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    return products
      .filter((p) => {
        const variantColors = [...new Set(p.variants.map(v => v.color))].join(" ");
        const localizedDesc = locale === "ru" ? p.descriptionRu
          : locale === "uk" ? p.descriptionUk
          : p.description;
        const haystack = [
          p.name,
          p.nameUk,
          p.nameRu,
          p.origin,
          localizedDesc,
          p.category,
          p.texture,
          p.colorTone,
          variantColors,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(trimmed);
      })
      .slice(0, 8);
  }, [query, products, locale]);

  if (!open) return null;

  const trimmed = query.trim();
  const showResults = trimmed.length >= 2;

  const getPrice = (p: SearchProduct) => {
    const v = p.variants[0];
    if (!v) return null;
    if (v.sellingMode === "BY_PIECE" && v.retailPricePerPiece) {
      return `${v.retailPricePerPiece} Kč`;
    }
    return `${v.retailPricePerGram} Kč/g`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-28">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-line overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <svg className="w-5 h-5 text-rose flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("offer.searchPlaceholder")}
              className="flex-1 text-sm text-ink bg-transparent outline-none placeholder:text-muted/50"
            />
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors text-xs font-medium px-2 py-1 rounded-md bg-nude-50"
            >
              Esc
            </button>
          </div>

          {(loading || showResults) && (
            <div className="border-t border-line max-h-[60vh] overflow-y-auto">
              {loading && (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {t("search.loading")}
                </div>
              )}

              {!loading && showResults && filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {t("search.noResults")}
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <ul className="py-1">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/offer/${p.slug ?? p.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-nude-50 transition-colors"
                      >
                        <div className="w-12 h-16 rounded-lg bg-nude-100 flex-shrink-0 overflow-hidden relative">
                          {p.photos.length > 0 ? (
                            <Image
                              src={p.photos[0]}
                              alt={localizedName(p)}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted/30">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink truncate">
                            {localizedName(p)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.origin && (
                              <span className="text-[10px] text-muted">{p.origin}</span>
                            )}
                            {getPrice(p) && (
                              <span className="text-[10px] font-medium text-rose">
                                {getPrice(p)}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-muted/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {!loading && showResults && filtered.length > 0 && (
                <Link
                  href={`/offer?search=${encodeURIComponent(trimmed)}`}
                  onClick={onClose}
                  className="block px-4 py-3 text-center text-sm font-medium text-rose hover:bg-nude-50 border-t border-line transition-colors"
                >
                  {t("search.viewAll")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
