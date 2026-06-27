"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatCZK } from "@/lib/pricing";

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

interface VariantTableProps {
  productId: string;
  variants: VariantData[];
  isOwner: boolean;
}

export function VariantTable({
  variants,
  isOwner,
}: VariantTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Group variants by length and color
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

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("product.length")}/{t("product.color")} — {t("common.add")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
              {t("product.length")} \ {t("product.color")}
            </th>
            {colors.map((color) => (
              <th
                key={color}
                className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700"
              >
                {color}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lengths.map((length) => (
            <tr key={length}>
              <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 bg-gray-50">
                {length} cm
              </td>
              {colors.map((color) => {
                const variant = getVariant(length, color);
                if (!variant)
                  return (
                    <td
                      key={color}
                      className="border border-gray-200 px-3 py-2 text-center text-gray-300"
                    >
                      —
                    </td>
                  );

                const cellKey = `${length}-${color}`;
                const isSaving = saving === variant.id;

                return (
                  <td
                    key={color}
                    className={`border border-gray-200 px-3 py-2 text-center ${
                      !variant.active ? "opacity-40" : ""
                    }`}
                  >
                    {isOwner && variant.costPricePerGram !== undefined && (
                      <div>
                        {editingCell === `cost-${cellKey}` ? (
                          <input
                            type="number"
                            className="w-20 border rounded px-1 py-0.5 text-center text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              const val = Math.round(
                                parseFloat(editValue) * 100
                              );
                              if (val >= 0)
                                handleSavePrice(variant.id, "costPricePerGram", val);
                              else setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = Math.round(
                                  parseFloat(editValue) * 100
                                );
                                if (val >= 0)
                                  handleSavePrice(variant.id, "costPricePerGram", val);
                              }
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            disabled={isSaving}
                          />
                        ) : (
                          <button
                            className="text-xs text-red-600 cursor-pointer hover:text-red-800"
                            onClick={() => {
                              setEditingCell(`cost-${cellKey}`);
                              setEditValue(
                                (variant.costPricePerGram! / 100).toString()
                              );
                            }}
                            disabled={isSaving}
                            title={t("variant.costPrice")}
                          >
                            {t("variant.costShort")}: {formatCZK(variant.costPricePerGram!)}
                          </button>
                        )}
                      </div>
                    )}
                    {variant.wholesalePricePerGram !== undefined && (
                      <div>
                        {isOwner && editingCell === cellKey ? (
                          <input
                            type="number"
                            className="w-20 border rounded px-1 py-0.5 text-center text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              const val = Math.round(
                                parseFloat(editValue) * 100
                              );
                              if (val > 0)
                                handleSavePrice(variant.id, "wholesalePricePerGram", val);
                              else setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = Math.round(
                                  parseFloat(editValue) * 100
                                );
                                if (val > 0)
                                  handleSavePrice(variant.id, "wholesalePricePerGram", val);
                              }
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            disabled={isSaving}
                          />
                        ) : (
                          <button
                            className={`font-medium ${
                              isOwner
                                ? "cursor-pointer hover:text-espresso"
                                : "cursor-default"
                            }`}
                            onClick={() => {
                              if (!isOwner) return;
                              setEditingCell(cellKey);
                              setEditValue(
                                (
                                  variant.wholesalePricePerGram! / 100
                                ).toString()
                              );
                            }}
                            disabled={isSaving}
                          >
                            {formatCZK(variant.wholesalePricePerGram!)}
                          </button>
                        )}
                      </div>
                    )}
                    {variant.retailPricePerGram !== undefined && (
                      <div className="mt-0.5">
                        <span
                          className={`text-xs ${
                            variant.retailManualOverride
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCZK(variant.retailPricePerGram!)}
                          {variant.retailManualOverride && (
                            <span className="ml-1 text-[10px]">
                              ({t("variant.manualOverride")})
                            </span>
                          )}
                        </span>
                        {isOwner && variant.retailManualOverride && (
                          <button
                            onClick={() => handleResetOverride(variant.id)}
                            className="ml-1 text-[10px] text-gray-400 hover:text-red-500"
                            disabled={isSaving}
                          >
                            {t("variant.resetOverride")}
                          </button>
                        )}
                      </div>
                    )}
                    {isOwner && variant.costPricePerGram !== undefined && variant.costPricePerGram > 0 && variant.wholesalePricePerGram !== undefined && (
                      <div className="mt-0.5">
                        <span className={`text-[10px] font-medium ${
                          variant.wholesalePricePerGram - variant.costPricePerGram > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {t("variant.margin")}: {formatCZK(variant.wholesalePricePerGram - variant.costPricePerGram)}
                        </span>
                      </div>
                    )}
                    {variant.pricePerGram !== undefined && (
                      <div className="font-medium">
                        {formatCZK(variant.pricePerGram)}
                        <span className="text-gray-400 text-xs">/g</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
