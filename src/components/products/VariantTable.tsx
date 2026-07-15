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
  sellingMode?: string;
  pricePerPiece?: number | null;
  retailPricePerPiece?: number | null;
  availableToOrder?: boolean;
  orderLeadDays?: number | null;
  active: boolean;
}

interface StockInfo {
  availableGrams: number;
  availablePieces?: number;
  physicalGrams?: number;
  reservedGrams?: number;
}

interface VariantTableProps {
  productId: string;
  category: string;
  variants: VariantData[];
  isOwner: boolean;
}

export function VariantTable({
  productId,
  category,
  variants,
  isOwner,
}: VariantTableProps) {
  const t = useTranslations();
  const tColors = useTranslations("public.colors");
  const tCat = useTranslations("category");
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [stockMap, setStockMap] = useState<Map<string, StockInfo>>(new Map());
  const [qrModal, setQrModal] = useState<{
    variantId: string;
    dataUrl: string;
    lengthCm: number;
    sellingMode: string;
  } | null>(null);

  const openQr = async (variant: VariantData) => {
    try {
      const QRCode = await import("qrcode");
      const url = `${window.location.origin}/sales/new?variantId=${variant.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
      setQrModal({ variantId: variant.id, dataUrl, lengthCm: variant.lengthCm, sellingMode: variant.sellingMode ?? "BY_GRAM" });
    } catch (e) {
      console.error("QR generation failed:", e);
    }
  };

  const downloadQr = () => {
    if (!qrModal) return;
    const img = new Image();
    img.onload = () => {
      const catLabel = tCat(category.toLowerCase() as "virgin");
      const label = `${catLabel}, ${qrModal.lengthCm} cm`;
      const stock = stockMap.get(qrModal.variantId);
      const isByPiece = qrModal.sellingMode === "BY_PIECE";
      const stockLabel = stock ? `${stock.availableGrams} g` : "";
      const canvas = document.createElement("canvas");
      const pad = 20;
      const textH = stockLabel ? 50 : 30;
      canvas.width = img.width + pad * 2;
      canvas.height = img.height + pad * 2 + textH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 16px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, canvas.width / 2, img.height + pad + 22);
      if (stockLabel) {
        ctx.fillStyle = "#888";
        ctx.font = "14px Arial, sans-serif";
        ctx.fillText(stockLabel, canvas.width / 2, img.height + pad + 42);
      }
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `qr-${qrModal.variantId}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = qrModal.dataUrl;
  };

  useEffect(() => {
    fetch(`/api/stock?productId=${productId}`)
      .then((r) => r.json())
      .then((data: Array<{ variantId: string; availableGrams: number; availablePieces?: number; physicalGrams?: number; reservedGrams?: number }>) => {
        const map = new Map<string, StockInfo>();
        for (const item of data) {
          map.set(item.variantId, {
            availableGrams: item.availableGrams,
            availablePieces: item.availablePieces,
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
                const isByPiece = variant.sellingMode === "BY_PIECE";
                const hasStock = stock && (isByPiece ? (stock.availablePieces ?? 0) > 0 : stock.availableGrams > 0);

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

                    {/* Prodejní cena (main, editable) */}
                    {!isByPiece && variant.retailPricePerGram !== undefined && (
                      editingCell === cellKey ? (
                        <PriceInput
                          variantId={variant.id}
                          field="retailPricePerGram"
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
                            setEditValue((variant.retailPricePerGram! / 100).toString());
                          }}
                          disabled={isSaving}
                        >
                          {formatCZK(variant.retailPricePerGram * 100)}/100g
                        </button>
                      )
                    )}

                    {/* Prodejní cena BY_PIECE */}
                    {isByPiece && variant.retailPricePerPiece !== undefined && (
                      editingCell === cellKey ? (
                        <PriceInput
                          variantId={variant.id}
                          field="retailPricePerPiece"
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
                            setEditValue((variant.retailPricePerPiece! / 100).toString());
                          }}
                          disabled={isSaving}
                        >
                          {formatCZK(variant.retailPricePerPiece!)}/ks
                        </button>
                      )
                    )}

                    {/* Nákupní cena + marže (owner only) */}
                    {isOwner && variant.costPricePerGram !== undefined && variant.costPricePerGram > 0 && (() => {
                      // For BY_PIECE: show per-piece cost; for BY_GRAM: show per-100g
                      const costDisplay = isByPiece
                        ? (variant.pricePerPiece ?? variant.costPricePerGram)
                        : variant.costPricePerGram * 100;
                      const sellPrice = isByPiece
                        ? (variant.retailPricePerPiece ?? 0)
                        : (variant.retailPricePerGram ?? 0) * 100;
                      const margin = sellPrice - costDisplay;
                      const unit = isByPiece ? "/ks" : "/100g";
                      return (
                        <div className="flex items-center gap-1 mt-1">
                          {editingCell === `cost-${cellKey}` ? (
                            <PriceInput
                              variantId={variant.id}
                              field="costPricePerGram"
                              cellKey={`cost-${cellKey}`}
                            />
                          ) : (
                            <span
                              className="text-[10px] text-muted"
                            >
                              {t("product.costLabel")}: {formatCZK(costDisplay)}{unit}
                            </span>
                          )}
                          <span className={`text-[10px] font-medium ${
                            margin > 0 ? "text-emerald-600" : "text-red-500"
                          }`}>
                            +{formatCZK(margin)}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Selling mode badge */}
                    {isByPiece && (
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose/10 text-rose">
                        ks
                      </span>
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
                        {isByPiece
                          ? `${stock.availablePieces ?? 0} ks`
                          : `${stock.availableGrams} g`}
                      </span>
                    )}

                    {/* QR button (owner only) */}
                    {isOwner && (
                      <button
                        onClick={() => openQr(variant)}
                        className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-muted hover:text-espresso hover:bg-nude-100 transition-colors"
                        title="QR"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.625m0 3v.375m0-3h3.375m-3.375 0h-.375m3.75 0h.375m0 0v.375m0-.375h.375" />
                        </svg>
                        QR
                      </button>
                    )}

                    {/* Available to order toggle */}
                    {isOwner && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-line/30">
                        <button
                          className={`relative w-8 h-4 rounded-full transition-colors ${
                            variant.availableToOrder ? "bg-amber-500" : "bg-gray-300"
                          }`}
                          onClick={async () => {
                            setSaving(variant.id);
                            try {
                              await fetch(`/api/variants/${variant.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ availableToOrder: !variant.availableToOrder }),
                              });
                              router.refresh();
                            } finally {
                              setSaving(variant.id === saving ? null : saving);
                            }
                          }}
                          disabled={isSaving}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            variant.availableToOrder ? "translate-x-4" : ""
                          }`} />
                        </button>
                        <span className="text-[10px] text-muted">Na objednávku</span>
                        {variant.availableToOrder && (
                          <input
                            type="number"
                            min={1}
                            max={90}
                            placeholder="dní"
                            className="w-12 text-[10px] border border-line rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                            defaultValue={variant.orderLeadDays ?? ""}
                            onBlur={async (e) => {
                              const val = parseInt(e.target.value);
                              const days = val >= 1 && val <= 90 ? val : null;
                              setSaving(variant.id);
                              try {
                                await fetch(`/api/variants/${variant.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ orderLeadDays: days }),
                                });
                                router.refresh();
                              } finally {
                                setSaving(variant.id === saving ? null : saving);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            disabled={isSaving}
                          />
                        )}
                      </div>
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
          <span><strong className="text-ink">{t("product.legendRetail")}</strong> = {t("product.legendRetailLabel")}</span>
          <span>{t("product.costLabel")} = {t("product.legendCostLabel")}</span>
          <span className="text-emerald-600">+ = {t("product.legendMarginLabel")}</span>
          <span>{t("product.legendClickToEdit")}</span>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">QR kód</h3>
              <button onClick={() => setQrModal(null)} className="text-muted hover:text-ink text-lg leading-none">&times;</button>
            </div>
            <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-ink">
                {tCat(category.toLowerCase() as "virgin")}, {qrModal.lengthCm} cm
              </p>
              {(() => {
                const stock = stockMap.get(qrModal.variantId);
                if (!stock) return null;
                const isByPiece = qrModal.sellingMode === "BY_PIECE";
                return <p className="text-xs text-muted">{stock.availableGrams} g</p>;
              })()}
            </div>
            <button
              onClick={downloadQr}
              className="mt-4 w-full py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
            >
              {t("stock.downloadQr")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
