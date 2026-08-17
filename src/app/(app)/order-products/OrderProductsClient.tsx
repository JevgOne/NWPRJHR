"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getHairColor, COLOR_CODES } from "@/lib/hair-colors";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/products/PhotoUpload";

interface OrderProduct {
  id: string;
  name: string;
  category: string;
  origin: string | null;
  texture: string | null;
  colorTone: string | null;
  photos: string;
  supplierCode: string | null;
  photoCode: string | null;
  createdAt: Date;
  variants: {
    id: string;
    lengthCm: number;
    color: string;
    retailPricePerGram: number;
    retailPricePerPiece: number | null;
    sellingMode: string;
    availableToOrder: boolean;
    orderLeadDays: number | null;
  }[];
}

type Category = "VIRGIN" | "LUXE" | "STANDARD" | "SALE";
type CurrencyCode = "USD" | "EUR" | "CZK";

const LENGTH_PRESETS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

const CURRENCY_OPTIONS: { code: CurrencyCode; symbol: string }[] = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20AC" },
  { code: "CZK", symbol: "K\u010D" },
];

const CATEGORY_LABELS: Record<string, string> = {
  VIRGIN: "Virgin",
  LUXE: "Luxe",
  STANDARD: "Standard",
  SALE: "Sale",
};

export function OrderProductsClient({ products }: { products: OrderProduct[] }) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Progressive wizard state
  const [category, setCategory] = useState<Category | "">("");
  const [origin, setOrigin] = useState("");
  const [texture, setTexture] = useState("");
  const [color, setColor] = useState("");
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [customLength, setCustomLength] = useState("");

  // Currency & exchange rate
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateSource, setRateSource] = useState<"CNB" | "fallback" | "">("");

  // Pricing
  const [purchasePricePer100g, setPurchasePricePer100g] = useState("");

  // Extra fields
  const [supplierCode, setSupplierCode] = useState("");
  const [photoCode, setPhotoCode] = useState("");
  const [leadDays, setLeadDays] = useState("14");
  const [photos, setPhotos] = useState<string[]>([]);

  const scrollTo = useCallback((id: string) => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  // Fetch exchange rate from CNB
  const fetchRate = useCallback(async (cur: CurrencyCode) => {
    if (cur === "CZK") {
      setExchangeRateInput("");
      setRateSource("");
      return;
    }
    setRateLoading(true);
    try {
      const res = await fetch(`/api/exchange-rates?currency=${cur}`);
      if (res.ok) {
        const data = await res.json();
        setExchangeRateInput(String(data.rate));
        setRateSource(data.source === "fallback" ? "fallback" : "CNB");
      }
    } catch {
      // keep existing rate
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currency !== "CZK") {
      fetchRate(currency);
    }
  }, [currency, fetchRate]);

  // Price preview
  const preview = useMemo(() => {
    const rate = currency === "CZK" ? 1 : parseFloat(exchangeRateInput);
    if (!rate || rate <= 0) return null;
    const pricePer100g = parseFloat(purchasePricePer100g);
    if (!pricePer100g || pricePer100g <= 0) return null;
    const pricePerGramOrig = pricePer100g / 100;
    const pricePerGramCzk = pricePerGramOrig * rate;
    const retailPerGram = pricePerGramCzk * 2.1;
    const retailPer100g = retailPerGram * 100;
    return { pricePerGramOrig, pricePerGramCzk, retailPerGram, retailPer100g };
  }, [currency, exchangeRateInput, purchasePricePer100g]);

  const colorName = (code: string) => {
    const { nameKey } = getHairColor(code);
    try {
      return tColors(nameKey as "c1");
    } catch {
      return code;
    }
  };

  function resetFrom(level: number) {
    if (level <= 1) { setCategory(""); setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 2) { setOrigin(""); setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 3) { setTexture(""); setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 4) { setColor(""); setLengthCm(null); setCustomLength(""); }
    if (level === 5) { setLengthCm(null); setCustomLength(""); }
  }

  function resetForm() {
    setCategory("");
    setOrigin("");
    setTexture("");
    setColor("");
    setLengthCm(null);
    setCustomLength("");
    setPurchasePricePer100g("");
    setSupplierCode("");
    setPhotoCode("");
    setLeadDays("14");
    setPhotos([]);
    setError("");
  }

  function formatCzk(halere: number): string {
    return (halere / 100).toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function BadgeRow() {
    const badges: { label: string; level: number }[] = [];
    if (category) badges.push({ label: tCat(category.toLowerCase() as "virgin"), level: 1 });
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

    try {
      const rateDecimal = currency === "CZK" ? 1 : parseFloat(exchangeRateInput);
      const exchangeRateInt = currency === "CZK" ? 10000 : Math.round(rateDecimal * 10000);

      const res = await fetch("/api/order-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          origin,
          texture,
          color,
          lengthCm,
          supplierCode: supplierCode.trim() || null,
          photoCode: photoCode.trim() || null,
          photos,
          purchasePricePer100g: parseFloat(purchasePricePer100g),
          currency,
          exchangeRate: exchangeRateInt,
          leadDays: parseInt(leadDays) || 14,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Chyba p\u0159i ukl\u00e1d\u00e1n\u00ed");
        return;
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Chyba p\u0159i ukl\u00e1d\u00e1n\u00ed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/order-products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Na objedn\u00e1vku</h1>
        <Button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}>
          {showForm ? tCommon("cancel") : "+ P\u0159idat produkt"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <BadgeRow />
          <div className="space-y-6">
            {/* Category */}
            <div id="section-category">
              <h2 className="text-sm font-medium text-espresso mb-3">{t("wizCategory")}</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["VIRGIN", "LUXE", "STANDARD", "SALE"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); resetFrom(2); scrollTo("section-origin"); }}
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

            {/* Origin */}
            {category && (
              <div id="section-origin">
                <h2 className="text-sm font-medium text-espresso mb-3">{t("wizOrigin")}</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {ORIGIN_OPTIONS.map((o) => (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => { setOrigin(o.name); resetFrom(3); scrollTo("section-texture"); }}
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

            {/* Texture */}
            {category && origin && (
              <div id="section-texture">
                <h2 className="text-sm font-medium text-espresso mb-3">{t("wizTexture")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TEXTURE_OPTIONS.map((tex) => (
                    <button
                      key={tex.name}
                      type="button"
                      onClick={() => { setTexture(tex.name); resetFrom(4); scrollTo("section-color"); }}
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

            {/* Color */}
            {category && origin && texture && (
              <div id="section-color">
                <h2 className="text-sm font-medium text-espresso mb-3">{t("color")}</h2>
                <div className="grid grid-cols-5 gap-3">
                  {COLOR_CODES.map((code) => {
                    const hc = getHairColor(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => { setColor(code); resetFrom(5); scrollTo("section-length"); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                          color === code
                            ? "border-rose bg-rose/5"
                            : "border-line bg-white hover:border-espresso/30"
                        }`}
                      >
                        <span
                          className="w-10 h-10 rounded-full border border-line flex-shrink-0"
                          style={{ background: hc.hex }}
                        />
                        <span className="text-xs font-medium text-ink">{colorName(code)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Length */}
            {category && origin && texture && color && (
              <div id="section-length">
                <h2 className="text-sm font-medium text-espresso mb-3">{t("length")}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {LENGTH_PRESETS.map((cm) => (
                    <button
                      key={cm}
                      type="button"
                      onClick={() => { setLengthCm(cm); setCustomLength(""); scrollTo("section-details"); }}
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
                    onClick={() => { setLengthCm(parseInt(customLength)); setCustomLength(""); scrollTo("section-details"); }}
                  >
                    OK
                  </Button>
                </div>
              </div>
            )}

            {/* Details form */}
            {category && origin && texture && color && lengthCm && (
              <form id="section-details" onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                <h2 className="text-sm font-medium text-espresso mb-1">{t("wizDetails")}</h2>

                {/* Currency selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-espresso">{t("currency")}</label>
                  <div className="flex gap-2">
                    {CURRENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setCurrency(opt.code)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
                          currency === opt.code
                            ? "border-rose bg-rose/5 text-ink"
                            : "border-line bg-white text-muted hover:border-espresso/30"
                        }`}
                      >
                        <span>{opt.symbol}</span>
                        <span>{opt.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exchange rate */}
                {currency !== "CZK" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          label={t("exchangeRateLabel", { currency })}
                          type="number"
                          value={exchangeRateInput}
                          onChange={(e) => setExchangeRateInput(e.target.value)}
                          required
                          min={0.01}
                          step="0.001"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchRate(currency)}
                        disabled={rateLoading}
                        className="mt-6 p-2 rounded-lg border border-line hover:bg-nude-50 transition-colors disabled:opacity-50"
                        title={t("rateRefresh")}
                      >
                        <svg className={`w-4 h-4 text-muted ${rateLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-muted">
                      {rateLoading
                        ? t("rateLoading")
                        : rateSource === "fallback"
                        ? t("rateFallback")
                        : rateSource === "CNB"
                        ? t("exchangeRateAuto")
                        : ""}
                    </p>
                  </div>
                )}

                {/* Purchase price per 100g */}
                <Input
                  label={`${t("purchasePricePer100g")} (${currency})`}
                  type="number"
                  value={purchasePricePer100g}
                  onChange={(e) => setPurchasePricePer100g(e.target.value)}
                  required
                  min={1}
                  step="0.01"
                />

                {/* Price preview */}
                {preview && (
                  <div className="p-3 rounded-xl border border-line bg-nude-50/50 space-y-1">
                    <p className="text-xs font-medium text-espresso">{t("pricePreview")}</p>
                    <p className="text-xs text-muted">
                      {t("pricePerGramOrig")}: {preview.pricePerGramOrig.toFixed(2)} {CURRENCY_OPTIONS.find((o) => o.code === currency)?.symbol ?? currency}
                      {currency !== "CZK" && (
                        <> = {formatCzk(Math.round(preview.pricePerGramCzk * 100))} K\u010D</>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {t("retailPreview")}: {formatCzk(Math.round(preview.retailPerGram * 100))} K\u010D/g ({t("margin")} 110%)
                    </p>
                    <p className="text-sm font-semibold text-espresso">
                      {t("retailPer100g")}: {formatCzk(Math.round(preview.retailPer100g * 100))} K\u010D
                    </p>
                  </div>
                )}

                {/* Supplier code */}
                <Input
                  label="K\u00f3d produktu u dodavatele"
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  placeholder="nap\u0159. SRB-60-BL"
                />

                {/* Photo code + lead days */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="K\u00f3d fotky"
                    value={photoCode}
                    onChange={(e) => setPhotoCode(e.target.value)}
                    placeholder="nap\u0159. IMG-4521"
                  />
                  <Input
                    label="Dodac\u00ed lh\u016fta (dn\u00ed)"
                    type="number"
                    value={leadDays}
                    onChange={(e) => setLeadDays(e.target.value)}
                    placeholder="14"
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1">Fotky</label>
                  <PhotoUpload photos={photos} onChange={setPhotos} />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? tCommon("loading") : "Ulo\u017eit produkt"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                    {tCommon("cancel")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      )}

      {products.length === 0 && !showForm && (
        <Card>
          <p className="text-muted text-center py-8">Zat\u00edm \u017e\u00e1dn\u00e9 produkty na objedn\u00e1vku</p>
        </Card>
      )}

      <div className="space-y-3">
        {products.map((p) => {
          const photoArr: string[] = (() => { try { return JSON.parse(p.photos); } catch { return []; } })();
          const variant = p.variants[0];
          const priceDisplay = variant
            ? variant.sellingMode === "BY_PIECE"
              ? `${((variant.retailPricePerPiece ?? 0) / 100).toLocaleString("cs-CZ")} CZK/ks`
              : `${(variant.retailPricePerGram / 100).toLocaleString("cs-CZ")} CZK/g`
            : "\u2014";
          const leadDaysDisplay = variant?.orderLeadDays ? `~${variant.orderLeadDays} dn\u00ed` : "\u2014";
          const catLabel = CATEGORY_LABELS[p.category] ?? p.category;

          return (
            <Card key={p.id}>
              <div className="flex gap-4">
                {photoArr[0] && (
                  <img src={photoArr[0]} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-nude-100 text-espresso">
                          {catLabel}
                        </span>
                        {p.origin && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-nude-50 text-muted">
                            {p.origin}
                          </span>
                        )}
                        {p.texture && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-nude-50 text-muted">
                            {p.texture}
                          </span>
                        )}
                        {variant && variant.lengthCm > 0 && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-nude-50 text-muted">
                            {variant.lengthCm} cm
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted mt-1">
                        {p.supplierCode && <span>K\u00f3d: {p.supplierCode}</span>}
                        {p.photoCode && <span>Foto: {p.photoCode}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Smazat
                    </button>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-emerald-700 font-medium">{priceDisplay}</span>
                    <span className="text-amber-600">{"\u23F1"} {leadDaysDisplay}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
