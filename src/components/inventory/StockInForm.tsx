"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ProductOption {
  id: string;
  name: string;
  variants: { id: string; lengthCm: number; color: string }[];
}

interface SupplierOption {
  id: string;
  name: string;
}

const CURRENCIES = ["CZK", "USD", "EUR", "UAH"] as const;

export function StockInForm({
  products,
  suppliers,
}: {
  products: ProductOption[];
  suppliers: SupplierOption[];
}) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("CZK");
  const [exchangeRate, setExchangeRate] = useState("10000");
  const [totalGrams, setTotalGrams] = useState("");
  const [totalPieces, setTotalPieces] = useState("0");
  const [pieceWeight, setPieceWeight] = useState("");
  const [barcode, setBarcode] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [stockedAt, setStockedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const variants = selectedProduct?.variants ?? [];

  const calculatedCZK = useMemo(() => {
    const price = parseInt(purchasePrice);
    const rate = parseInt(exchangeRate);
    if (!price || !rate) return null;
    if (currency === "CZK") return price;
    return Math.round((price * rate) / 10000);
  }, [purchasePrice, exchangeRate, currency]);

  async function handleGenerateBarcode() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setBarcode(`HR-${date}-${random}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const pieces = parseInt(totalPieces) || 0;

    const body = {
      variantId,
      supplierId,
      purchasePricePerGramRaw: parseInt(purchasePrice),
      currency,
      exchangeRate: parseInt(exchangeRate),
      totalGrams: parseInt(totalGrams),
      totalPieces: pieces,
      ...(pieces > 0 ? { pieceWeightGrams: parseInt(pieceWeight) } : {}),
      ...(barcode ? { barcode } : {}),
      ...(batchCode ? { batchCode } : {}),
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
        {/* Product + Variant selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("selectVariant")}
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setVariantId("");
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              &nbsp;
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              required
              disabled={!productId}
            >
              <option value="">--</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.lengthCm} cm / {v.color}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("supplier")}
          </label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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

        {/* Purchase price + currency + exchange rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t("purchasePrice")}
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
            min={1}
            placeholder="e.g. 500"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("currency")}
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => {
                const c = e.target.value as (typeof CURRENCIES)[number];
                setCurrency(c);
                if (c === "CZK") setExchangeRate("10000");
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={t("exchangeRate")}
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            required
            min={1}
            disabled={currency === "CZK"}
            placeholder="e.g. 254350"
          />
        </div>

        {/* Calculated CZK preview */}
        {calculatedCZK !== null && (
          <div className="text-sm text-gray-600">
            {t("calculatedCZK")}:{" "}
            <span className="font-semibold text-gray-900">
              {(calculatedCZK / 100).toFixed(2)} CZK/{t("grams")}
            </span>
          </div>
        )}

        {/* Quantities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t("totalGrams")}
            type="number"
            value={totalGrams}
            onChange={(e) => setTotalGrams(e.target.value)}
            required
            min={1}
          />
          <Input
            label={t("totalPieces")}
            type="number"
            value={totalPieces}
            onChange={(e) => setTotalPieces(e.target.value)}
            min={0}
          />
          {parseInt(totalPieces) > 0 && (
            <Input
              label={t("pieceWeight")}
              type="number"
              value={pieceWeight}
              onChange={(e) => setPieceWeight(e.target.value)}
              required
              min={1}
            />
          )}
        </div>

        {/* Barcode */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label={t("barcode")}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="HR-20260601-A1B2"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateBarcode}
          >
            {t("generateBarcode")}
          </Button>
        </div>

        {/* Batch code + date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("batchCode")}
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("note")}
          </label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
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
