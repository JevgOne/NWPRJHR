"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getHairColor, COLOR_CODES } from "@/lib/hair-colors";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SupplierOption {
  id: string;
  name: string;
}

interface SuccessData {
  productName: string;
  totalGrams: number;
  barcode: string;
}

type Category = "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE";

const LENGTH_PRESETS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

export function StockInForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const router = useRouter();

  // Progressive form state
  const [category, setCategory] = useState<Category | "">("");
  const [origin, setOrigin] = useState("");
  const [texture, setTexture] = useState("");
  const [color, setColor] = useState("");
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [customLength, setCustomLength] = useState("");

  // Details form state
  const [supplierId, setSupplierId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [totalGrams, setTotalGrams] = useState("");
  const [stockedAt, setStockedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const colorName = (code: string) => {
    const { nameKey } = getHairColor(code);
    try {
      return tColors(nameKey as "c1");
    } catch {
      return code;
    }
  };

  // Reset from a given level forward
  function resetFrom(level: number) {
    if (level <= 1) { setCategory(""); setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 2) { setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 3) { setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 4) { setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 5) { setLengthCm(null); setCustomLength(""); }
  }

  // Badge row showing selected attributes
  function BadgeRow() {
    const badges: { label: string; level: number }[] = [];
    if (category)
      badges.push({ label: tCat(category.toLowerCase() as "virgin"), level: 1 });
    if (origin) badges.push({ label: origin, level: 2 });
    if (texture) badges.push({ label: texture, level: 3 });
    if (color) badges.push({ label: colorName(color), level: 4 });
    if (lengthCm) badges.push({ label: `${lengthCm} cm`, level: 5 });

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {badges.map((b) => (
          <button
            key={b.level}
            type="button"
            onClick={() => resetFrom(b.level)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-nude-100 text-espresso hover:bg-nude-200 transition-colors"
          >
            {b.label}
            <span className="text-muted ml-0.5">&times;</span>
          </button>
        ))}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !origin || !texture || !color || !lengthCm) return;
    setSubmitting(true);
    setError("");

    const body = {
      category,
      origin,
      texture,
      color,
      lengthCm,
      supplierId,
      purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100),
      currency: "CZK" as const,
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
      setError(
        data.error?.formErrors?.[0] ?? JSON.stringify(data.error) ?? "Error"
      );
      setSubmitting(false);
      return;
    }

    const result = await res.json();
    const productUrl = `${window.location.origin}/offer/${result.productSlug ?? result.productId}`;
    const QRCode = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(productUrl, {
      errorCorrectionLevel: "M",
      width: 200,
      margin: 2,
    });
    setQrDataUrl(dataUrl);
    setSuccessData({
      productName: result.productName ?? "",
      totalGrams: parseInt(totalGrams),
      barcode: result.barcode ?? "",
    });
    setSubmitting(false);
  }

  // Success screen
  if (successData) {
    return (
      <Card>
        <div className="flex flex-col items-center py-8 max-w-sm mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-espresso">
            {t("stockedSuccess")}
          </h2>
          <p className="text-sm text-muted">
            {successData.productName} &mdash; {successData.totalGrams} g
          </p>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR"
              width={200}
              height={200}
              className="mx-auto"
            />
          )}
          {successData.barcode && (
            <p className="text-xs text-muted font-mono">{successData.barcode}</p>
          )}
          <p className="text-xs text-muted">{t("qrLinkDesc")}</p>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              {t("printLabel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setQrDataUrl("");
                setCategory("");
                setOrigin("");
                setTexture("");
                setColor("");
                setLengthCm(null);
                setCustomLength("");
                setSupplierId("");
                setPurchasePrice("");
                setTotalGrams("");
                setNote("");
                setStockedAt(new Date().toISOString().slice(0, 10));
              }}
            >
              {t("stockAnother")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                router.push("/inventory");
                router.refresh();
              }}
            >
              {tCommon("done")}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <BadgeRow />

      <div className="space-y-6">
        {/* Category — always visible */}
        <div>
          <h2 className="text-sm font-medium text-espresso mb-3">
            {t("wizCategory")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(["VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); resetFrom(2); }}
                className={`p-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  category === cat
                    ? "border-rose bg-rose/5 text-ink"
                    : "border-line bg-white text-muted hover:border-espresso/30"
                }`}
              >
                {tCat(cat.toLowerCase() as "virgin")}
              </button>
            ))}
          </div>
        </div>

        {/* Origin — after category */}
        {category && (
          <div>
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("wizOrigin")}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ORIGIN_OPTIONS.map((o) => (
                <button
                  key={o.name}
                  type="button"
                  onClick={() => { setOrigin(o.name); resetFrom(3); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                    origin === o.name
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  <span className="text-xl">{o.flag}</span>
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Texture — after origin */}
        {category && origin && (
          <div>
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("wizTexture")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TEXTURE_OPTIONS.map((tex) => (
                <button
                  key={tex.name}
                  type="button"
                  onClick={() => { setTexture(tex.name); resetFrom(4); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                    texture === tex.name
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  <span className="text-2xl">{tex.icon}</span>
                  {tex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color — after texture */}
        {category && origin && texture && (
          <div>
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("color")}
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_CODES.map((code) => {
                const hc = getHairColor(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { setColor(code); resetFrom(5); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                      color === code
                        ? "border-rose bg-rose/5"
                        : "border-line bg-white hover:border-espresso/30"
                    }`}
                  >
                    <span
                      className="w-10 h-10 rounded-full border border-line flex-shrink-0"
                      style={{ backgroundColor: hc.hex }}
                    />
                    <span className="text-xs font-medium text-ink">
                      {colorName(code)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Length — after color */}
        {category && origin && texture && color && (
          <div>
            <h2 className="text-sm font-medium text-espresso mb-3">
              {t("length")}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {LENGTH_PRESETS.map((cm) => (
                <button
                  key={cm}
                  type="button"
                  onClick={() => { setLengthCm(cm); setCustomLength(""); }}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                    lengthCm === cm
                      ? "border-rose bg-rose/5 text-ink"
                      : "border-line bg-white text-muted hover:border-espresso/30"
                  }`}
                >
                  {cm} cm
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 max-w-xs">
              <Input
                label={t("wizCustomLength")}
                type="number"
                value={customLength}
                onChange={(e) => setCustomLength(e.target.value)}
                min={10}
                max={150}
                placeholder="cm"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!customLength || parseInt(customLength) < 10}
                onClick={() => { setLengthCm(parseInt(customLength)); setCustomLength(""); }}
              >
                OK
              </Button>
            </div>
          </div>
        )}

        {/* Details — after length */}
        {category && origin && texture && color && lengthCm && (
          <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
            <h2 className="text-sm font-medium text-espresso mb-1">
              {t("wizDetails")}
            </h2>

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

            {/* Purchase price */}
            <Input
              label={`${t("purchasePrice")} (Kc/g)`}
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              min={1}
              step="0.01"
            />

            {/* Grams + Date */}
            <div className="grid grid-cols-2 gap-4">
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
                {submitting ? tCommon("loading") : t("stockIn")}
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
        )}
      </div>
    </Card>
  );
}
