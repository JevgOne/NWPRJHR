"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProductOption {
  id: string;
  name: string;
  category: string;
  variants: { id: string; lengthCm: number; color: string }[];
}

interface SupplierOption {
  id: string;
  name: string;
}

export function StockInForm({
  products,
  suppliers,
}: {
  products: ProductOption[];
  suppliers: SupplierOption[];
}) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const router = useRouter();

  const colorName = (code: string) => {
    const { nameKey } = getHairColor(code);
    try { return tColors(nameKey as "c1"); } catch { return code; }
  };

  const [productId, setProductId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedLength, setSelectedLength] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
  const [stockedAt, setStockedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const variants = selectedProduct?.variants ?? [];

  // Unique colors available for selected product
  const uniqueColors = useMemo(() => {
    const codes = [...new Set(variants.map((v) => v.color))];
    return codes.sort((a, b) => parseInt(a) - parseInt(b));
  }, [variants]);

  // Lengths available for selected color
  const availableLengths = useMemo(() => {
    if (!selectedColor) return [];
    return variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.lengthCm)
      .sort((a, b) => a - b);
  }, [variants, selectedColor]);

  // Resolved variantId from color + length
  const variantId = useMemo(() => {
    if (!selectedColor || !selectedLength) return "";
    return variants.find((v) => v.color === selectedColor && v.lengthCm === parseInt(selectedLength))?.id ?? "";
  }, [variants, selectedColor, selectedLength]);

  // Currency is always CZK — user converts manually at current rate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variantId) {
      setError(t("selectColorAndLength"));
      return;
    }
    setSubmitting(true);
    setError("");

    const body = {
      variantId,
      supplierId,
      purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100),
      currency: "CZK",
      exchangeRate: 10000,
      totalGrams: parseInt(totalGrams),
      totalPieces: 0,
      stockedAt: new Date(stockedAt).toISOString(),
      ...(note ? { note } : {}),
    };

    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? JSON.stringify(data.error) ?? "Error");
      setSubmitting(false);
      return;
    }

    router.push("/inventory");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">
            {t("selectVariant")}
          </label>
          <select
            className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setSelectedColor("");
              setSelectedLength("");
            }}
            required
          >
            <option value="">--</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color + Length selection */}
        {productId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color selector with swatches */}
            <div>
              <label className="block text-sm font-medium text-espresso mb-2">
                {t("color")}
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((code) => {
                  const isSelected = selectedColor === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setSelectedColor(code);
                        setSelectedLength("");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-rose bg-rose/10 text-ink ring-1 ring-rose"
                          : "border-line bg-white text-muted hover:border-espresso/30"
                      }`}
                      title={colorName(code)}
                    >
                      <span className="w-5 h-5 rounded-full border border-line overflow-hidden flex-shrink-0">
                        <img src={`/swatches/color-${code}.png`} alt="" className="w-full h-full object-cover" />
                      </span>
                      {colorName(code)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Length selector */}
            <div>
              <label className="block text-sm font-medium text-espresso mb-2">
                {t("length")}
              </label>
              {selectedColor ? (
                <div className="flex flex-wrap gap-2">
                  {availableLengths.map((cm) => {
                    const isSelected = selectedLength === String(cm);
                    return (
                      <button
                        key={cm}
                        type="button"
                        onClick={() => setSelectedLength(String(cm))}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-rose bg-rose/10 text-ink ring-1 ring-rose"
                            : "border-line bg-white text-muted hover:border-espresso/30"
                        }`}
                      >
                        {cm} cm
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted py-2">{t("selectColorFirst")}</p>
              )}
            </div>
          </div>
        )}

        {/* Hidden required input for form validation */}
        <input type="hidden" name="variantId" value={variantId} required />

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">
            {t("supplier")}
          </label>
          <select
            className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          >
            <option value="">{t("selectSupplier")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase price in CZK per gram */}
        <Input
          label={`${t("purchasePrice")} (Kč/g)`}
          type="number"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          required
          min={1}
          step="0.01"
          placeholder="např. 50"
        />

        {/* Total grams + date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("totalGrams")}
            type="number"
            value={totalGrams}
            onChange={(e) => setTotalGrams(e.target.value)}
            required
            min={1}
          />
          <Input
            label={t("stockedAt")}
            type="date"
            value={stockedAt}
            onChange={(e) => setStockedAt(e.target.value)}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">
            {t("note")}
          </label>
          <textarea
            className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? tCommon("loading") : tCommon("save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/inventory")}
          >
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
