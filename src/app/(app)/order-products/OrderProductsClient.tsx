"use client";

import { useState, useCallback, useMemo, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getHairColor, COLOR_CODES } from "@/lib/hair-colors";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { ORIGIN_OPTIONS, getOriginFlag } from "@/lib/origin-flags";
import { generateSku } from "@/lib/sku";
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
  { code: "CZK", symbol: "Kč" },
];

export function OrderProductsClient({ products: initialProducts }: { products: OrderProduct[] }) {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("category");
  const tColors = useTranslations("public.colors");
  const router = useRouter();

  const [products, setProducts] = useState(initialProducts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    supplierCode: "",
    photoCode: "",
    retailPricePerGram: "",
    retailPricePerPiece: "",
    orderLeadDays: "",
    photos: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

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
        setError(data.error ?? "Chyba při ukládání");
        return;
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Chyba při ukládání");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Opravdu smazat tento produkt?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/order-products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Chyba při mazání");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch {
      alert("Chyba při mazání");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (p: OrderProduct) => {
    const variant = p.variants[0];
    setEditingId(p.id);
    setEditForm({
      supplierCode: p.supplierCode ?? "",
      photoCode: p.photoCode ?? "",
      retailPricePerGram: variant ? String(variant.retailPricePerGram / 100) : "",
      retailPricePerPiece: variant?.retailPricePerPiece ? String(variant.retailPricePerPiece / 100) : "",
      orderLeadDays: variant?.orderLeadDays ? String(variant.orderLeadDays) : "14",
      photos: (() => { try { return JSON.parse(p.photos); } catch { return []; } })(),
    });
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/order-products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierCode: editForm.supplierCode.trim() || null,
          photoCode: editForm.photoCode.trim() || null,
          photos: editForm.photos,
          retailPricePerGram: Math.round(parseFloat(editForm.retailPricePerGram) * 100) || undefined,
          retailPricePerPiece: editForm.retailPricePerPiece
            ? Math.round(parseFloat(editForm.retailPricePerPiece) * 100)
            : undefined,
          orderLeadDays: parseInt(editForm.orderLeadDays) || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditError(data.error || "Chyba při ukládání");
        return;
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== editingId) return p;
          const variant = p.variants[0];
          return {
            ...p,
            supplierCode: editForm.supplierCode.trim() || null,
            photoCode: editForm.photoCode.trim() || null,
            photos: JSON.stringify(editForm.photos),
            variants: variant
              ? [{
                  ...variant,
                  retailPricePerGram: Math.round(parseFloat(editForm.retailPricePerGram) * 100) || variant.retailPricePerGram,
                  retailPricePerPiece: editForm.retailPricePerPiece
                    ? Math.round(parseFloat(editForm.retailPricePerPiece) * 100)
                    : variant.retailPricePerPiece,
                  orderLeadDays: parseInt(editForm.orderLeadDays) || variant.orderLeadDays,
                }]
              : p.variants,
          };
        })
      );
      setEditingId(null);
      router.refresh();
    } catch {
      setEditError("Chyba při ukládání");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Na objednávku</h1>
        <Button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}>
          {showForm ? tCommon("cancel") : "+ Přidat produkt"}
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
                        <> = {formatCzk(Math.round(preview.pricePerGramCzk * 100))} Kč</>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {t("retailPreview")}: {formatCzk(Math.round(preview.retailPerGram * 100))} Kč/g ({t("margin")} 110%)
                    </p>
                    <p className="text-sm font-semibold text-espresso">
                      {t("retailPer100g")}: {formatCzk(Math.round(preview.retailPer100g * 100))} Kč
                    </p>
                  </div>
                )}

                {/* Supplier code */}
                <Input
                  label="Kód produktu u dodavatele"
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  placeholder="např. SRB-60-BL"
                />

                {/* Photo code + lead days */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Kód fotky"
                    value={photoCode}
                    onChange={(e) => setPhotoCode(e.target.value)}
                    placeholder="např. IMG-4521"
                  />
                  <Input
                    label="Dodací lhůta (dnů)"
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
                    {submitting ? tCommon("loading") : "Uložit produkt"}
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
          <p className="text-muted text-center py-8">Zatím žádné produkty na objednávku</p>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 px-2 text-xs text-muted font-medium">Produkt</th>
                  <th className="py-2 px-2 text-xs text-muted font-medium">{t("color")}</th>
                  <th className="py-2 px-2 text-xs text-muted font-medium">{t("length")}</th>
                  <th className="py-2 px-2 text-xs text-muted font-medium text-right">Cena</th>
                  <th className="py-2 px-2 text-xs text-muted font-medium text-right">Lhůta</th>
                  <th className="py-2 px-1 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const photoArr: string[] = (() => { try { return JSON.parse(p.photos); } catch { return []; } })();
                  const variant = p.variants[0];
                  const catLabel = tCat(p.category.toLowerCase() as "virgin");

                  const priceDisplay = variant
                    ? (variant.sellingMode === "BY_PIECE" && (variant.retailPricePerPiece ?? 0) > 0)
                      ? `${((variant.retailPricePerPiece!) / 100).toLocaleString("cs-CZ")} Kč/ks`
                      : variant.retailPricePerGram > 0
                        ? `${(variant.retailPricePerGram / 100).toLocaleString("cs-CZ")} Kč/g`
                        : "\u2014"
                    : "\u2014";

                  const leadDaysDisplay = variant?.orderLeadDays ? `~${variant.orderLeadDays} d` : "\u2014";

                  return (
                    <Fragment key={p.id}>
                    <tr
                      className="border-b border-gray-100 hover:bg-nude-50 cursor-pointer"
                      onClick={() => editingId === p.id ? setEditingId(null) : startEdit(p)}
                    >
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          {photoArr[0] ? (
                            <img src={photoArr[0]} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-nude-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-ink text-sm">{p.name}</div>
                            {variant && variant.lengthCm > 0 && (
                              <div className="font-mono text-[10px] text-muted">
                                {generateSku(p.category, p.texture, variant.color, variant.lengthCm)}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                p.category === "VIRGIN" ? "bg-amber-100 text-amber-700" :
                                p.category === "LUXE" ? "bg-violet-100 text-violet-700" :
                                p.category === "STANDARD" ? "bg-emerald-100 text-emerald-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {catLabel}
                              </span>
                              {p.origin && (
                                <span className="text-[10px] text-muted">
                                  {getOriginFlag(p.origin)} {p.origin}
                                </span>
                              )}
                              {p.texture && (
                                <span className="text-[10px] text-muted">{p.texture}</span>
                              )}
                            </div>
                            {(p.supplierCode || p.photoCode) && (
                              <div className="text-[10px] text-muted mt-0.5">
                                {p.supplierCode && <span>Kód: {p.supplierCode}</span>}
                                {p.supplierCode && p.photoCode && <span className="mx-1">&middot;</span>}
                                {p.photoCode && <span>Foto: {p.photoCode}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-2">
                        {variant && variant.color !== "0" && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-line flex-shrink-0"
                              style={{ backgroundColor: getHairColor(variant.color).hex }}
                            />
                            <span className="text-xs text-espresso">{colorName(variant.color)}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-xs text-espresso">
                        {variant && variant.lengthCm > 0 ? `${variant.lengthCm} cm` : "\u2014"}
                      </td>

                      <td className="py-2.5 px-2 text-right text-emerald-700 font-medium text-xs">
                        {priceDisplay}
                      </td>

                      <td className="py-2.5 px-2 text-right text-amber-600 text-xs">
                        {leadDaysDisplay}
                      </td>

                      <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => editingId === p.id ? setEditingId(null) : startEdit(p)}
                            className="p-1 rounded hover:bg-nude-100 text-muted hover:text-ink transition-colors"
                            title="Upravit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className={`p-1 rounded hover:bg-red-50 text-muted hover:text-red-600 transition-colors ${deletingId === p.id ? "opacity-50" : ""}`}
                            title="Smazat"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === p.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-nude-50/50 border-b border-line">
                          <div className="max-w-lg space-y-4">
                            <h3 className="text-sm font-semibold text-espresso">Upravit produkt</h3>

                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Cena (Kč/g)"
                                type="number"
                                value={editForm.retailPricePerGram}
                                onChange={(e) => setEditForm((f) => ({ ...f, retailPricePerGram: e.target.value }))}
                                min={0}
                                step="0.01"
                              />
                              <Input
                                label="Dodací lhůta (dnů)"
                                type="number"
                                value={editForm.orderLeadDays}
                                onChange={(e) => setEditForm((f) => ({ ...f, orderLeadDays: e.target.value }))}
                                min={1}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Kód dodavatele"
                                value={editForm.supplierCode}
                                onChange={(e) => setEditForm((f) => ({ ...f, supplierCode: e.target.value }))}
                                placeholder="např. SRB-60-BL"
                              />
                              <Input
                                label="Kód fotky"
                                value={editForm.photoCode}
                                onChange={(e) => setEditForm((f) => ({ ...f, photoCode: e.target.value }))}
                                placeholder="např. IMG-4521"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-espresso mb-1">Fotky</label>
                              <PhotoUpload photos={editForm.photos} onChange={(photos) => setEditForm((f) => ({ ...f, photos }))} />
                            </div>

                            {editError && (
                              <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{editError}</div>
                            )}

                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? tCommon("loading") : tCommon("save")}
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                                {tCommon("cancel")}
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
