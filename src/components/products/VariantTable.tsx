"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCZK } from "@/lib/pricing";
import { getHairColor } from "@/lib/hair-colors";

interface VariantData {
  id: string;
  lengthCm: number;
  color: string;
  costPricePerGram?: number;
  wholesalePricePerGram?: number;
  retailPricePerGram?: number;
  retailManualOverride?: boolean;
  pricePerGram?: number;
  active: boolean;
}

interface StockInfo {
  availableGrams: number;
  physicalGrams?: number;
  reservedGrams?: number;
}

interface VariantTableProps {
  productId: string;
  variants: VariantData[];
  isOwner: boolean;
}

export function VariantTable({
  productId,
  variants,
  isOwner,
}: VariantTableProps) {
  const t = useTranslations();
  const tColors = useTranslations("public.colors");
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [stockMap, setStockMap] = useState<Map<string, StockInfo>>(new Map());

  useEffect(() => {
    fetch(`/api/stock?productId=${productId}`)
      .then((r) => r.json())
      .then((data: Array<{ variantId: string; availableGrams: number; physicalGrams?: number; reservedGrams?: number }>) => {
        const map = new Map<string, StockInfo>();
        for (const item of data) {
          map.set(item.variantId, {
            availableGrams: item.availableGrams,
            physicalGrams: item.physicalGrams,
            reservedGrams: item.reservedGrams,
          });
        }
        setStockMap(map);
      })
      .catch(() => {});
  }, [productId]);

  const lengths = [...new Set(variants.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );

  async function handleSavePrice(variantId: string, field: string, newPriceHalere: number) {
    setSaving(variantId);
    try {
      await fetch(`/api/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newPriceHalere }),
      });
      router.refresh();
    } finally {
      setSaving(null);
      setEditingCell(null);
    }
  }

  async function handleResetOverride(variantId: string) {
    setSaving(variantId);
    try {
      await fetch(`/api/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailManualOverride: false }),
      });
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  function colorName(code: string): string {
    const { nameKey } = getHairColor(code);
    try {
      return tColors(nameKey as "c1");
    } catch {
      return code;
    }
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        {t("product.length")}/{t("product.color")} — {t("common.add")}
      </div>
    );
  }

  function PriceInput({ variantId, field, cellKey }: {
    variantId: string; field: string; cellKey: string;
  }) {
    if (editingCell !== cellKey) return null;
    return (
      <input
        type="number"
        className="w-20 border border-line rounded px-2 py-0.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-rose/30"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          const val = Math.round(parseFloat(editValue) * 100);
          if (val >= 0) handleSavePrice(variantId, field, val);
          else setEditingCell(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const val = Math.round(parseFloat(editValue) * 100);
            if (val >= 0) handleSavePrice(variantId, field, val);
          }
          if (e.key === "Escape") setEditingCell(null);
        }}
        autoFocus
        disabled={saving === variantId}
      />
    );
  }

  return (
    <div className="space-y-4">
      {lengths.map((length) => {
        const lengthVariants = variants
          .filter((v) => v.lengthCm === length)
          .sort((a, b) => parseInt(a.color) - parseInt(b.color));

        return (
          <div key={length}>
            {/* Length header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-espresso/10 text-sm font-bold text-espresso">
                {length} cm
              </span>
              <div className="flex-1 h-px bg-line/50" />
            </div>

            {/* Color cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {lengthVariants.map((variant) => {
                const hc = getHairColor(variant.color);
                const cellKey = `${length}-${variant.color}`;
                const isSaving = saving === variant.id;
                const stock = stockMap.get(variant.id);
                const hasStock = stock && stock.availableGrams > 0;

                return (
                  <div
                    key={variant.id}
                    className={`rounded-lg border border-line/60 p-3 ${
                      !variant.active ? "opacity-30" : ""
                    } ${hasStock ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    {/* Color indicator + name */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: hc.hex }}
                      />
                      <span className="text-xs font-medium text-espresso truncate">
                        {colorName(variant.color)}
                      </span>
                    </div>

                    {/* B2B price (main, editable) */}
                    {variant.wholesalePricePerGram !== undefined && (
                      editingCell === cellKey ? (
                        <PriceInput
                          variantId={variant.id}
                          field="wholesalePricePerGram"
                          cellKey={cellKey}
                        />
                      ) : (
                        <button
                          className={`text-lg font-bold text-ink block ${
                            isOwner ? "hover:text-rose transition-colors" : ""
                          }`}
                          onClick={() => {
                            if (!isOwner) return;
                            setEditingCell(cellKey);
                            setEditValue((variant.wholesalePricePerGram! / 100).toString());
                          }}
                          disabled={isSaving}
                        >
                          {formatCZK(variant.wholesalePricePerGram!)}
                        </button>
                      )
                    )}

                    {/* Retail price */}
                    {variant.retailPricePerGram !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted line-through">
                          {formatCZK(variant.retailPricePerGram!)}
                        </span>
                        {isOwner && variant.retailManualOverride && (
                          <button
                            onClick={() => handleResetOverride(variant.id)}
                            className="text-[9px] text-orange-500 hover:text-red-500"
                            disabled={isSaving}
                            title={t("variant.resetOverride")}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cost + margin (owner only) */}
                    {isOwner && variant.costPricePerGram !== undefined && variant.costPricePerGram > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {editingCell === `cost-${cellKey}` ? (
                          <PriceInput
                            variantId={variant.id}
                            field="costPricePerGram"
                            cellKey={`cost-${cellKey}`}
                          />
                        ) : (
                          <button
                            className="text-[10px] text-muted hover:text-espresso transition-colors"
                            onClick={() => {
                              setEditingCell(`cost-${cellKey}`);
                              setEditValue((variant.costPricePerGram! / 100).toString());
                            }}
                            disabled={isSaving}
                          >
                            N: {formatCZK(variant.costPricePerGram!)}
                          </button>
                        )}
                        {variant.wholesalePricePerGram !== undefined && (
                          <span className={`text-[10px] font-medium ${
                            variant.wholesalePricePerGram - variant.costPricePerGram > 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}>
                            +{formatCZK(variant.wholesalePricePerGram - variant.costPricePerGram)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stock badge */}
                    {stock && (
                      <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        hasStock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          hasStock ? "bg-emerald-500" : "bg-red-300"
                        }`} />
                        {stock.availableGrams} g
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-line/50 text-[10px] text-muted">
          <span><strong className="text-ink">63 Kč</strong> = B2B</span>
          <span><span className="line-through">114 Kč</span> = běžná</span>
          <span>N: 46 Kč = nákup</span>
          <span className="text-emerald-600">+17 Kč = marže</span>
          <span>Klikni na cenu pro úpravu</span>
        </div>
      )}
    </div>
  );
}
