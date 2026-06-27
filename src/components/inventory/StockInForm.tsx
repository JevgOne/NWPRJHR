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
  category: string;
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
  const tCat = useTranslations("category");
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("CZK");
  const [exchangeRate, setExchangeRate] = useState("10000");
  const [totalGrams, setTotalGrams] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const body = {
      variantId,
      supplierId,
      purchasePricePerGramRaw: parseInt(purchasePrice),
      currency,
      exchangeRate: parseInt(exchangeRate),
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
        {/* Product + Variant selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("selectVariant")}
            </label>
            <select
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
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
                  {p.name} ({tCat(p.category.toLowerCase() as "virgin" | "premium" | "standard" | "sale")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-1">
              &nbsp;
            </label>
            <select
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              required
              disabled={!productId}
            >
              <option value="">--</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.lengthCm} cm — barva {v.color}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        {/* Purchase price + currency (+ exchange rate only for non-CZK) */}
        <div className={`grid grid-cols-1 gap-4 ${currency !== "CZK" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
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
            <label className="block text-sm font-medium text-espresso mb-1">
              {t("currency")}
            </label>
            <select
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
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

          {currency !== "CZK" && (
            <Input
              label={t("exchangeRate")}
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              required
              min={1}
              placeholder="e.g. 254350"
            />
          )}
        </div>

        {/* Calculated CZK preview */}
        {calculatedCZK !== null && currency !== "CZK" && (
          <div className="text-sm text-muted">
            {t("calculatedCZK")}:{" "}
            <span className="font-semibold text-ink">
              {(calculatedCZK / 100).toFixed(2)} CZK/{t("grams")}
            </span>
          </div>
        )}

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
