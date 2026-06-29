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
  const colors = [...new Set(variants.map((v) => v.color))].sort();

  const getVariant = (length: number, color: string) =>
    variants.find((v) => v.lengthCm === length && v.color === color);

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

  function PriceInput({ variantId, field, cellKey, currentValue }: {
    variantId: string; field: string; cellKey: string; currentValue: number;
  }) {
    if (editingCell !== cellKey) return null;
    return (
      <input
        type="number"
        className="w-20 border border-line rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-rose/30"
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
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm">
        {/* Header with color circles */}
        <thead>
          <tr>
            <th className="pb-4 pr-4 text-left">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                {t("product.length")}
              </span>
            </th>
            {colors.map((color) => {
              const hc = getHairColor(color);
              return (
                <th key={color} className="pb-4 px-2 text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: hc.hex }}
                    />
                    <span className="text-xs font-medium text-espresso">
                      {colorName(color)}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {lengths.map((length, li) => (
            <tr
              key={length}
              className={li % 2 === 0 ? "bg-nude-50/50" : "bg-white"}
            >
              {/* Length label */}
              <td className="py-3 pr-4">
                <span className="inline-flex items-center justify-center w-16 h-8 rounded-lg bg-espresso/5 text-sm font-semibold text-espresso">
                  {length} cm
                </span>
              </td>

              {/* Variant cells */}
              {colors.map((color) => {
                const variant = getVariant(length, color);
                const cellKey = `${length}-${color}`;

                if (!variant) {
                  return (
                    <td key={color} className="py-3 px-2 text-center">
                      <span className="text-gray-200">—</span>
                    </td>
                  );
                }

                const isSaving = saving === variant.id;
                const stock = stockMap.get(variant.id);
                const hasStock = stock && stock.availableGrams > 0;

                return (
                  <td
                    key={color}
                    className={`py-3 px-2 ${!variant.active ? "opacity-30" : ""}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {/* Wholesale price (main, editable) */}
                      {variant.wholesalePricePerGram !== undefined && (
                        editingCell === cellKey ? (
                          <PriceInput
                            variantId={variant.id}
                            field="wholesalePricePerGram"
                            cellKey={cellKey}
                            currentValue={variant.wholesalePricePerGram}
                          />
                        ) : (
                          <button
                            className={`text-base font-bold text-ink ${
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {editingCell === `cost-${cellKey}` ? (
                            <PriceInput
                              variantId={variant.id}
                              field="costPricePerGram"
                              cellKey={`cost-${cellKey}`}
                              currentValue={variant.costPricePerGram}
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
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      {isOwner && (
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-line/50 text-[10px] text-muted">
          <span><strong className="text-ink">63 Kč</strong> = B2B cena</span>
          <span><span className="line-through">114 Kč</span> = běžná cena</span>
          <span>N: 46 Kč = nákup</span>
          <span className="text-emerald-600">+17 Kč = marže</span>
          <span>Klikni na cenu pro úpravu</span>
        </div>
      )}
    </div>
  );
}
