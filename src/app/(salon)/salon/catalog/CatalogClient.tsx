"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import type { Role } from "@prisma/client";

interface CatalogVariant {
  id: string;
  lengthCm: number;
  color: string;
  pricePerGram: number;
  availableGrams: number;
  availablePieces: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  nameUk?: string;
  nameRu?: string;
  category: string;
  processingType: string;
  origin?: string;
  texture?: string;
  photos: string[];
  variants: CatalogVariant[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const categoryBadgeColors: Record<string, string> = {
  VIRGIN: "bg-amber-100 text-amber-800",
  PREMIUM: "bg-nude-100 text-espresso",
  STANDARD: "bg-emerald-100 text-emerald-800",
  SALE: "bg-rose-100 text-rose-800",
};

const processingLabels: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratín",
  WEFT: "Tresa",
  MICRO_RING: "Micro ring",
  OTHER: "Ostatní",
};

export function CatalogClient({ role }: { role: Role }) {
  const t = useTranslations("salonPortal");
  const tB2B = useTranslations("b2bSettings");
  const tCommon = useTranslations("common");
  const tCategory = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountPct, setDiscountPct] = useState<number | null>(null);

  const colorName = (nameKey: string) => {
    try { return tColors(nameKey as "c1"); } catch { return nameKey; }
  };

  useEffect(() => {
    fetch("/api/salon-portal/catalog")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/b2b-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.discountPct != null) {
          setDiscountPct(data.discountPct / 100);
        }
      })
      .catch(() => {});
  }, [role]);

  if (loading) return <p className="text-muted py-8 text-center">{tCommon("loading")}</p>;

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 text-center">
        <p className="text-muted">{t("noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink">{t("catalog")}</h1>

      {/* Discount banner */}
      <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
        role === "HAIRDRESSER"
          ? "bg-nude-50 text-espresso"
          : "bg-rose/5 text-rose"
      }`}>
        {role === "HAIRDRESSER"
          ? `${tB2B("tierHairdresser")} — ${discountPct ?? "..."}% ${tB2B("discount").toLowerCase()}`
          : `${tB2B("tierSalon")} — ${discountPct != null ? `${discountPct}% ${tB2B("discount").toLowerCase()}` : t("yourDiscount")}`}
      </div>

      {/* Product cards */}
      {products.map((product) => {
        const colors = [...new Set(product.variants.map((v) => v.color))];
        return (
          <div key={product.id} className="bg-white rounded-xl border border-line overflow-hidden">
            {/* Card header with photo + info */}
            <div className="flex gap-4 p-4 pb-3">
              {/* Photo */}
              <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-nude-100 overflow-hidden flex items-center justify-center">
                {product.photos.length > 0 ? (
                  <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-semibold text-ink text-base">{product.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryBadgeColors[product.category] ?? "bg-nude-100 text-espresso"}`}>
                    {tCategory(product.category.toLowerCase() as "virgin")}
                  </span>
                </div>

                {/* Processing type + origin */}
                <div className="flex items-center gap-2 text-xs text-muted mb-2">
                  {product.processingType && (
                    <span>{processingLabels[product.processingType] ?? product.processingType}</span>
                  )}
                  {product.origin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                      {product.origin}
                    </span>
                  )}
                  {product.texture && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium">
                      {product.texture}
                    </span>
                  )}
                </div>

                {/* Color swatches */}
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {colors.map((code) => {
                      const { nameKey } = getHairColor(code);
                      return (
                        <span
                          key={code}
                          className="w-5 h-5 rounded-full border border-line overflow-hidden"
                          title={colorName(nameKey)}
                        >
                          <img src={`/swatches/color-${code}.png`} alt={colorName(nameKey)} className="w-full h-full object-cover" />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Variants table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-line text-left text-xs font-medium text-muted uppercase tracking-wider">
                    <th className="px-4 py-2">Délka</th>
                    <th className="px-4 py-2">Barva</th>
                    <th className="px-4 py-2 text-right">{t("pricePerGram")}</th>
                    <th className="px-4 py-2 text-right">{t("available")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {product.variants.map((v) => {
                    const { nameKey } = getHairColor(v.color);
                    return (
                      <tr key={v.id} className="hover:bg-nude-50/50">
                        <td className="px-4 py-2 text-ink font-medium whitespace-nowrap">
                          {v.lengthCm} cm
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
                              <img src={`/swatches/color-${v.color}.png`} alt="" className="w-full h-full object-cover" />
                            </span>
                            <span className="text-ink">{colorName(nameKey)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-ink font-medium whitespace-nowrap">
                          {formatCZK(v.pricePerGram)} Kč/g
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {v.availableGrams > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {v.availableGrams} g
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              {t("outOfStock")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
