"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { QrLabelSheet } from "@/components/inventory/QrLabelSheet";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";

interface StockItem {
  variantId: string;
  product: { id: string; name: string; category: string; origin?: string | null };
  lengthCm: number;
  color: string;
  physicalGrams: number;
  physicalPieces: number;
  reservedGrams: number;
  reservedPieces: number;
  availableGrams: number;
  availablePieces: number;
  barcode?: string | null;
}

const CATEGORIES = ["ALL", "VIRGIN", "LUXE", "STANDARD", "SALE"] as const;

function stockClass(grams: number): string {
  if (grams <= 0) return "text-red-600 font-semibold";
  if (grams < 100) return "text-amber-600 font-medium";
  return "text-green-600";
}

export function InventoryClient({
  items,
  role,
}: {
  items: StockItem[];
  role: string;
}) {
  const router = useRouter();
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");

  const [search, setSearch] = useState("");
  const [showSoldOut, setShowSoldOut] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(false);
  const [qrModal, setQrModal] = useState<{
    variantId: string;
    dataUrl: string;
    category: string;
    lengthCm: number;
    availableGrams: number;
  } | null>(null);

  const openQr = async (item: StockItem) => {
    try {
      const QRCode = await import("qrcode");
      const url = `${window.location.origin}/sales/new?variantId=${item.variantId}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
      setQrModal({
        variantId: item.variantId,
        dataUrl,
        category: item.product.category,
        lengthCm: item.lengthCm,
        availableGrams: item.availableGrams,
      });
    } catch (e) {
      console.error("QR generation failed:", e);
    }
  };

  const downloadQr = () => {
    if (!qrModal) return;
    const [header, b64] = qrModal.dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `qr-${qrModal.variantId}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Extract filter options
  const filterOptions = useMemo(() => {
    const origins = new Set<string>();
    const productNames = new Map<string, string>(); // id -> name
    items.forEach((item) => {
      if (item.product.origin) origins.add(item.product.origin);
      productNames.set(item.product.id, item.product.name);
    });
    return {
      origins: [...origins].sort(),
      products: [...productNames.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!showSoldOut && item.availableGrams <= 0) return false;
      if (categoryFilter !== "ALL" && item.product.category !== categoryFilter) return false;
      if (originFilter && item.product.origin !== originFilter) return false;
      if (productFilter && item.product.id !== productFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.product.name.toLowerCase().includes(q) &&
          !item.color.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [items, showSoldOut, categoryFilter, originFilter, productFilter, search]);

  // Summary stats
  const totalGrams = filtered.reduce((s, i) => s + i.availableGrams, 0);
  const totalReserved = filtered.reduce((s, i) => s + i.reservedGrams, 0);

  const colorName = (code: string) => {
    try { return tColors(getHairColor(code).nameKey); } catch { return code; }
  };

  const toggleSelect = (variantId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.variantId)));
    }
  };

  const selectedLabelData = useMemo(() => {
    return filtered
      .filter((i) => selected.has(i.variantId))
      .map((i) => ({
        variantId: i.variantId,
        productName: i.product.name,
        lengthCm: i.lengthCm,
        color: i.color,
        category: i.product.category,
        barcode: i.barcode,
      }));
  }, [filtered, selected]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t("barcode")} / ${t("selectVariant")}...`}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-1 focus:ring-rose focus:border-rose"
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? "border-rose bg-blush-100 text-rose-deep"
                  : "border-line text-muted hover:bg-nude-50"
              }`}
            >
              {cat === "ALL" ? tCommon("all") : tCat(cat.toLowerCase())}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.origins.length > 1 && (
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="px-2 py-1.5 border border-line rounded-lg text-xs text-espresso bg-white"
            >
              <option value="">{t("originAll")}</option>
              {filterOptions.origins.map((o) => (
                <option key={o} value={o}>{getOriginFlag(o)} {o}</option>
              ))}
            </select>
          )}
          {filterOptions.products.length > 1 && (
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-2 py-1.5 border border-line rounded-lg text-xs text-espresso bg-white"
            >
              <option value="">{t("productAll")}</option>
              {filterOptions.products.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer whitespace-nowrap ml-auto">
            <input
              type="checkbox"
              checked={showSoldOut}
              onChange={(e) => setShowSoldOut(e.target.checked)}
              className="rounded border-line text-rose focus:ring-rose"
            />
            {t("showSoldOut")}
          </label>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="text-muted">{filtered.length} variant</span>
        <span className="text-emerald-600 font-medium">{totalGrams} g skladem</span>
        {totalReserved > 0 && (
          <span className="text-amber-600 font-medium">{t("reservedGrams", { count: totalReserved })}</span>
        )}
        {selected.size > 0 && (
          <button
            onClick={() => setShowLabels(true)}
            className="ml-auto px-3 py-1 bg-rose text-white text-xs font-medium rounded-lg hover:bg-rose-deep transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg>
            {t("printLabels")} ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-3 px-1 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-line text-rose focus:ring-rose"
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
                <th className="py-3 px-2 font-medium">{t("selectVariant")}</th>
                <th className="py-3 px-2 font-medium">{t("color")}</th>
                <th className="py-3 px-2 font-medium">{t("lengthCol")}</th>
                <th className="py-3 px-2 font-medium text-right">
                  {t("physical")}
                </th>
                {role === "OWNER" && (
                  <th className="py-3 px-2 font-medium text-right">
                    {t("reserved")}
                  </th>
                )}
                <th className="py-3 px-2 font-medium text-right">
                  {t("availableShort")}
                </th>
                <th className="py-3 px-1 w-8"><span className="sr-only">QR</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    {t("noStock")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.variantId}
                    className="border-b border-gray-100 hover:bg-nude-50 cursor-pointer"
                    onClick={() => router.push(`/products/${item.product.id}`)}
                  >
                    <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(item.variantId)}
                        onChange={() => toggleSelect(item.variantId)}
                        className="rounded border-line text-rose focus:ring-rose"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-ink text-sm">
                        {item.product.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.product.category === "VIRGIN" ? "bg-amber-100 text-amber-700" :
                          item.product.category === "LUXE" ? "bg-violet-100 text-violet-700" :
                          item.product.category === "STANDARD" ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {tCat(item.product.category.toLowerCase() as "virgin")}
                        </span>
                        {item.product.origin && (
                          <span className="text-[10px] text-muted">
                            {getOriginFlag(item.product.origin)} {item.product.origin}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-line flex-shrink-0"
                          style={{ backgroundColor: getHairColor(item.color).hex }}
                        />
                        <span className="text-xs text-espresso">{colorName(item.color)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-espresso">
                      {item.lengthCm} cm
                    </td>
                    <td className={`py-2.5 px-2 text-right ${stockClass(item.physicalGrams)}`}>
                      {item.physicalGrams} g
                    </td>
                    {role === "OWNER" && (
                      <td className="py-2.5 px-2 text-right text-amber-600">
                        {item.reservedGrams > 0 ? `${item.reservedGrams} g` : "—"}
                      </td>
                    )}
                    <td className={`py-2.5 px-2 text-right font-medium ${stockClass(item.availableGrams)}`}>
                      {item.availableGrams} g
                    </td>
                    <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openQr(item)}
                        className="p-1 rounded hover:bg-nude-100 text-muted hover:text-espresso transition-colors"
                        title="QR"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.625m0 3v.375m0-3h3.375m-3.375 0h-.375m3.75 0h.375m0 0v.375m0-.375h.375" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showLabels && selectedLabelData.length > 0 && (
        <QrLabelSheet
          items={selectedLabelData}
          onClose={() => setShowLabels(false)}
        />
      )}

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-ink">QR kód</h3>
              <button onClick={() => setQrModal(null)} className="text-muted hover:text-ink text-lg leading-none">&times;</button>
            </div>
            <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
            <p className="mt-3 text-sm font-medium text-ink text-center">
              {tCat(qrModal.category.toLowerCase() as "virgin")}, {qrModal.lengthCm} cm
            </p>
            <button
              onClick={downloadQr}
              className="mt-4 w-full py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
            >
              {t("downloadQr")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
