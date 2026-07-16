"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { generateSku } from "@/lib/sku";

interface DeliveryVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  retailPricePerPiece: number | null;
  sellingMode: string;
  product: { name: string; category: string; texture: string | null };
}

interface BatchDelivery {
  id: string;
  initialGrams: number;
  initialPieces: number;
  remainingGrams: number;
  remainingPieces: number;
  purchasePricePerGramCZK: number;
  pieceWeightGrams: number | null;
  variant: DeliveryVariant;
  supplier: { name: string };
}

interface StockBatch {
  id: string;
  name: string;
  status: string;
  note: string | null;
  createdAt: string;
  closedAt: string | null;
  deliveries: BatchDelivery[];
}

interface BatchSummary {
  totalPieces: number;
  totalWeightG: number;
  purchaseTotal: number;
  retailTotal: number;
  marginPercent: number;
  suppliers: string[];
  remainingG: number;
  remainingPercent: number;
}

function computeSummary(deliveries: BatchDelivery[]): BatchSummary {
  let totalPieces = 0;
  let totalWeightG = 0;
  let purchaseTotal = 0;
  let retailTotal = 0;
  let remainingG = 0;
  const supplierSet = new Set<string>();

  for (const d of deliveries) {
    totalPieces += d.initialPieces || 1;
    totalWeightG += d.initialGrams;
    remainingG += d.remainingGrams;
    purchaseTotal += d.purchasePricePerGramCZK * d.initialGrams;
    supplierSet.add(d.supplier.name);

    if (d.variant.sellingMode === "BY_PIECE" && d.variant.retailPricePerPiece) {
      retailTotal += d.variant.retailPricePerPiece * (d.initialPieces || 1);
    } else {
      retailTotal += d.variant.retailPricePerGram * d.initialGrams;
    }
  }

  const marginPercent = purchaseTotal > 0
    ? Math.round(((retailTotal - purchaseTotal) / purchaseTotal) * 100)
    : 0;

  return {
    totalPieces,
    totalWeightG,
    purchaseTotal,
    retailTotal,
    marginPercent,
    suppliers: Array.from(supplierSet),
    remainingG,
    remainingPercent: totalWeightG > 0 ? Math.round((remainingG / totalWeightG) * 100) : 0,
  };
}

function formatCzk(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", { maximumFractionDigits: 0 }) + " Kc";
}

function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}

function marginColor(percent: number): string {
  if (percent >= 80) return "text-green-700";
  if (percent >= 50) return "text-amber-700";
  return "text-red-700";
}

export function BatchOverviewClient({ batches }: { batches: StockBatch[] }) {
  const t = useTranslations("stock");
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<"" | "OPEN" | "CLOSED">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (fromDate && new Date(b.createdAt) < new Date(fromDate)) return false;
      if (toDate && new Date(b.createdAt) > new Date(`${toDate}T23:59:59.999Z`)) return false;
      return true;
    });
  }, [batches, statusFilter, fromDate, toDate]);

  const openBatches = filtered.filter((b) => b.status === "OPEN");
  const closedBatches = filtered.filter((b) => b.status === "CLOSED");

  const closedTotals = useMemo(() => {
    const all = closedBatches.flatMap((b) => b.deliveries);
    return computeSummary(all);
  }, [closedBatches]);

  async function handleCloseBatch(batchId: string, batchName: string) {
    if (!confirm(t("batchCloseConfirm", { name: batchName }))) return;
    setClosingId(batchId);
    try {
      const res = await fetch(`/api/inventory/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setClosingId(null);
    }
  }

  async function handleCreateBatch() {
    setCreatingBatch(true);
    try {
      const res = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) router.refresh();
    } finally {
      setCreatingBatch(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">{t("batchFilterFrom")}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">{t("batchFilterTo")}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">{t("batchStatus")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "OPEN" | "CLOSED")}
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          >
            <option value="">{t("batchAll")}</option>
            <option value="OPEN">{t("batchOpen")}</option>
            <option value="CLOSED">{t("batchClosed")}</option>
          </select>
        </div>
        <button
          onClick={handleCreateBatch}
          disabled={creatingBatch}
          className="inline-flex items-center px-4 py-1.5 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep disabled:opacity-50"
        >
          + {t("batchNew")}
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-12">{t("batchNoData")}</p>
      )}

      {/* Open batches */}
      {openBatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {t("batchOpen")}
          </h2>
          <div className="space-y-3">
            {openBatches.map((batch) => {
              const s = computeSummary(batch.deliveries);
              return (
                <div key={batch.id} className="bg-white rounded-xl border-2 border-amber-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-espresso">{batch.name}</h3>
                      <p className="text-xs text-muted mt-0.5">
                        {s.totalPieces} {t("batchPieces")} &middot; {formatWeight(s.totalWeightG)}
                        {s.suppliers.length > 0 && (
                          <> &middot; {t("batchSuppliers")}: {s.suppliers.join(", ")}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {t("batchOpen")}
                      </span>
                      <button
                        onClick={() => handleCloseBatch(batch.id, batch.name)}
                        disabled={closingId === batch.id}
                        className="px-3 py-1 rounded-lg border border-line text-xs font-medium text-espresso hover:bg-nude-50 disabled:opacity-50"
                      >
                        {t("batchClose")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed batches */}
      {closedBatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {t("batchClosed")}
          </h2>
          <div className="space-y-2">
            {closedBatches.map((batch) => {
              const s = computeSummary(batch.deliveries);
              const isExpanded = expandedId === batch.id;

              return (
                <div key={batch.id} className="bg-white rounded-xl border border-line overflow-hidden">
                  {/* Summary row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                    className="w-full text-left p-4 hover:bg-nude-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{isExpanded ? "\u25BC" : "\u25B6"}</span>
                        <h3 className="font-semibold text-espresso">{batch.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>{s.totalPieces} {t("batchPieces")}</span>
                        <span>{formatWeight(s.totalWeightG)}</span>
                        <span>{formatCzk(s.purchaseTotal)}</span>
                        <span>{formatCzk(s.retailTotal)}</span>
                        <span className={`font-semibold ${marginColor(s.marginPercent)}`}>
                          {s.marginPercent}%
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-line px-4 pb-4">
                      <table className="w-full text-xs mt-3">
                        <thead>
                          <tr className="text-muted text-left border-b border-line">
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium">{t("batchName")}</th>
                            <th className="pb-2 font-medium text-right">{t("length")}</th>
                            <th className="pb-2 font-medium text-right">{t("color")}</th>
                            <th className="pb-2 font-medium text-right">{t("grams")}</th>
                            <th className="pb-2 font-medium text-right">{t("batchPurchase")}</th>
                            <th className="pb-2 font-medium text-right">{t("batchRetail")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.deliveries.map((d) => {
                            const sku = generateSku(
                              d.variant.product.category,
                              d.variant.product.texture,
                              d.variant.color,
                              d.variant.lengthCm,
                            );
                            const purchasePerG = d.purchasePricePerGramCZK;
                            const retailPerG = d.variant.retailPricePerGram;
                            return (
                              <tr key={d.id} className="border-b border-line/50">
                                <td className="py-2 font-mono text-espresso">{sku}</td>
                                <td className="py-2 text-espresso">{d.variant.product.name}</td>
                                <td className="py-2 text-right">{d.variant.lengthCm} cm</td>
                                <td className="py-2 text-right">{d.variant.color}</td>
                                <td className="py-2 text-right">{d.initialGrams} g</td>
                                <td className="py-2 text-right">{formatCzk(purchasePerG)}/g</td>
                                <td className="py-2 text-right">{formatCzk(retailPerG)}/g</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mt-3 text-right text-xs text-muted">
                        {t("batchRemaining")}: {formatWeight(s.remainingG)} ({s.remainingPercent}%)
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          {closedBatches.length > 1 && (
            <div className="mt-4 p-4 rounded-xl bg-nude-50 border border-line">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-espresso">{t("batchTotal")} ({t("batchClosed").toLowerCase()})</span>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{closedTotals.totalPieces} {t("batchPieces")}</span>
                  <span>{formatWeight(closedTotals.totalWeightG)}</span>
                  <span>{formatCzk(closedTotals.purchaseTotal)}</span>
                  <span>{formatCzk(closedTotals.retailTotal)}</span>
                  <span className={`font-semibold ${marginColor(closedTotals.marginPercent)}`}>
                    {closedTotals.marginPercent}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
