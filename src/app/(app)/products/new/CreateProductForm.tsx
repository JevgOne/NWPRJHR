"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { COLOR_TONE_OPTIONS } from "@/lib/color-tones";
import { PhotoUpload } from "@/components/products/PhotoUpload";
import { slugify } from "@/lib/slugify";
import { HAIR_COLORS, COLOR_CODES } from "@/lib/hair-colors";

const CATEGORIES = ["VIRGIN", "LUXE", "STANDARD", "SALE", "ACCESSORY"] as const;

const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
  ACCESSORY: { cs: "Příslušenství", uk: "Аксесуари", ru: "Аксессуары" },
};

interface VariantRow {
  lengthCm: string;
  color: string;
}

export function CreateProductForm() {
  const t = useTranslations();
  const tColors = useTranslations("public.colors");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<string>("VIRGIN");
  const [customName, setCustomName] = useState("");
  const [origin, setOrigin] = useState("");
  const [originOpen, setOriginOpen] = useState(false);
  const [texture, setTexture] = useState("");
  const [textureOpen, setTextureOpen] = useState(false);
  const [dbTextures, setDbTextures] = useState<string[]>([]);
  const [colorTone, setColorTone] = useState("");
  const [colorToneOpen, setColorToneOpen] = useState(false);
  const [dbColorTones, setDbColorTones] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([{ lengthCm: "", color: "" }]);
  const originRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<HTMLDivElement>(null);
  const colorToneRef = useRef<HTMLDivElement>(null);

  // Pricing state
  const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");
  const [costPrice, setCostPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [retailManual, setRetailManual] = useState(false);

  // Available to order state
  const [availableToOrder, setAvailableToOrder] = useState(false);
  const [orderLeadDays, setOrderLeadDays] = useState("");

  const isByPiece = sellingMode === "BY_PIECE";

  // Auto-generated name preview
  const catNames = CATEGORY_NAMES[category] ?? CATEGORY_NAMES.VIRGIN;
  const isAccessoryCategory = category === "ACCESSORY";
  const namePreview = isAccessoryCategory
    ? (customName || catNames.cs)
    : (texture ? `${catNames.cs} — ${texture}` : catNames.cs);

  // Price preview
  const retailPreview = isByPiece
    ? (parseFloat(retailPrice) || 0)
    : (parseFloat(retailPrice) || 0) * 100;
  const costPreview = isByPiece
    ? (parseFloat(costPrice) || 0)
    : (parseFloat(costPrice) || 0) * 100;
  const marginPreview = retailPreview > 0 && costPreview > 0
    ? Math.round(((retailPreview - costPreview) / retailPreview) * 100)
    : null;

  const filteredOrigins = ORIGIN_OPTIONS.filter((o) =>
    o.name.toLowerCase().includes(origin.toLowerCase())
  );

  const allTextureNames = [...new Set([
    ...TEXTURE_OPTIONS.map((t) => t.name),
    ...dbTextures,
  ])];
  const filteredTextures = allTextureNames
    .filter((n) => n.toLowerCase().includes(texture.toLowerCase()))
    .map((n) => {
      const opt = TEXTURE_OPTIONS.find((t) => t.name === n);
      return { name: n, icon: opt?.icon ?? "?" };
    });

  const allColorToneNames = [...new Set([
    ...COLOR_TONE_OPTIONS.map((t) => t.name),
    ...dbColorTones,
  ])];
  const filteredColorTones = allColorToneNames
    .filter((n) => n.toLowerCase().includes(colorTone.toLowerCase()))
    .map((n) => {
      const opt = COLOR_TONE_OPTIONS.find((t) => t.name === n);
      return { name: n, hex: opt?.hex ?? "#9CA3AF" };
    });

  const colorLabel = (code: string) => {
    try { return tColors(HAIR_COLORS[code]?.nameKey as "c1"); } catch { return code; }
  };

  useEffect(() => {
    fetch("/api/products/options")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.textures) setDbTextures(data.textures);
        if (data?.colorTones) setDbColorTones(data.colorTones);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setOriginOpen(false);
      }
      if (textureRef.current && !textureRef.current.contains(e.target as Node)) {
        setTextureOpen(false);
      }
      if (colorToneRef.current && !colorToneRef.current.contains(e.target as Node)) {
        setColorToneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addVariantRow() {
    setVariants([...variants, { lengthCm: "", color: "" }]);
  }

  function removeVariantRow(index: number) {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Validate variants
    const isAccessory = category === "ACCESSORY";
    const validVariants = isAccessory
      ? variants.filter((v) => v.color)
      : variants.filter((v) => v.lengthCm && v.color);
    if (validVariants.length === 0) {
      setError(isAccessory ? "Přidejte alespoň jednu variantu (název)" : "Přidejte alespoň jednu variantu (délka + barva)");
      return;
    }

    // Validate pricing
    const retailHalere = Math.round(parseFloat(retailPrice) * 100);
    if (!retailHalere || retailHalere <= 0) {
      setError(t("variant.enterValidPrice"));
      return;
    }
    const costHalere = costPrice ? Math.round(parseFloat(costPrice) * 100) : 0;

    setLoading(true);

    const name = isAccessory
      ? (customName || catNames.cs)
      : (texture ? `${catNames.cs} — ${texture}` : catNames.cs);
    const nameUk = isAccessory
      ? (customName || catNames.uk)
      : (texture ? `${catNames.uk} — ${texture}` : catNames.uk);
    const nameRu = isAccessory
      ? (customName || catNames.ru)
      : (texture ? `${catNames.ru} — ${texture}` : catNames.ru);

    const data = {
      name,
      nameUk,
      nameRu,
      category,
      processingType: "OTHER",
      origin: origin || undefined,
      texture: texture || undefined,
      colorTone: colorTone || undefined,
      photos: photos.length > 0 ? JSON.stringify(photos) : undefined,
      slug: slugify(name) || undefined,
    };

    try {
      // 1. Create product
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.toString() || t("productForm.createError"));
        return;
      }

      const product = await res.json();

      // 2. Create variants with pricing
      const leadDays = orderLeadDays ? parseInt(orderLeadDays) : null;
      const variantData = isByPiece
        ? validVariants.map((v) => ({
            lengthCm: isAccessory ? 0 : parseInt(v.lengthCm),
            color: v.color,
            costPricePerGram: costHalere,
            wholesalePricePerGram: 0,
            retailPricePerGram: 0,
            sellingMode: "BY_PIECE" as const,
            pricePerPiece: retailHalere,
            retailPricePerPiece: retailHalere,
            availableToOrder,
            orderLeadDays: availableToOrder ? leadDays : null,
          }))
        : validVariants.map((v) => ({
            lengthCm: parseInt(v.lengthCm),
            color: v.color,
            costPricePerGram: costHalere,
            wholesalePricePerGram: retailHalere,
            retailPricePerGram: retailHalere,
            sellingMode: "BY_GRAM" as const,
          }));

      await fetch(`/api/products/${product.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: variantData }),
      });

      router.push(`/products/${product.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-ink mb-6">
        {t("common.add")} — {t("nav.products")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1">
            {t("category.virgin")} / {t("category.luxe")} / ...
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value === "ACCESSORY") {
                setSellingMode("BY_PIECE");
                setOrigin("");
                setTexture("");
                setColorTone("");
              }
            }}
            className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`category.${cat.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Origin — hidden for ACCESSORY */}
        {category !== "ACCESSORY" && <div ref={originRef} className="relative">
          <label htmlFor="origin" className="block text-sm font-medium text-espresso mb-1">
            {t("product.origin")}
          </label>
          <input
            id="origin"
            type="text"
            className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setOriginOpen(true);
            }}
            onFocus={() => setOriginOpen(true)}
            placeholder={t("product.originPlaceholder")}
            autoComplete="off"
          />
          {originOpen && filteredOrigins.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
              {filteredOrigins.map((o) => (
                <li key={o.name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOrigin(o.name);
                      setOriginOpen(false);
                    }}
                  >
                    <span>{o.flag}</span>
                    <span>{o.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>}

        {/* Texture — hidden for ACCESSORY */}
        {category !== "ACCESSORY" && <div ref={textureRef} className="relative">
          <label htmlFor="texture" className="block text-sm font-medium text-espresso mb-1">
            {t("product.texture")}
          </label>
          <input
            id="texture"
            type="text"
            className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
            value={texture}
            onChange={(e) => {
              setTexture(e.target.value);
              setTextureOpen(true);
            }}
            onFocus={() => setTextureOpen(true)}
            placeholder={t("product.texturePlaceholder")}
            autoComplete="off"
          />
          {textureOpen && filteredTextures.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
              {filteredTextures.map((opt) => (
                <li key={opt.name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTexture(opt.name);
                      setTextureOpen(false);
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>}

        {/* Color Tone — hidden for ACCESSORY */}
        {category !== "ACCESSORY" && <div ref={colorToneRef} className="relative">
          <label htmlFor="colorTone" className="block text-sm font-medium text-espresso mb-1">
            {t("product.colorTone")}
          </label>
          <input
            id="colorTone"
            type="text"
            className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
            value={colorTone}
            onChange={(e) => {
              setColorTone(e.target.value);
              setColorToneOpen(true);
            }}
            onFocus={() => setColorToneOpen(true)}
            placeholder={t("product.colorTonePlaceholder")}
            autoComplete="off"
          />
          {colorToneOpen && filteredColorTones.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
              {filteredColorTones.map((opt) => (
                <li key={opt.name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setColorTone(opt.name);
                      setColorToneOpen(false);
                    }}
                  >
                    <span className="w-4 h-4 rounded-full inline-block border border-line/50" style={{ backgroundColor: opt.hex }} />
                    <span>{opt.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>}

        {/* Custom name for ACCESSORY */}
        {category === "ACCESSORY" && (
          <div>
            <label htmlFor="customName" className="block text-sm font-medium text-espresso mb-1">
              Název produktu
            </label>
            <input
              id="customName"
              type="text"
              className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Žehlička na vlasy, Šampon 250ml..."
            />
          </div>
        )}

        {/* Name preview */}
        <div className="px-3 py-2 bg-nude-50 rounded-lg border border-line/50">
          <span className="text-[10px] uppercase tracking-wider text-muted">{t("product.namePreview")}</span>
          <p className="text-sm font-medium text-ink mt-0.5">{namePreview}</p>
        </div>

        {/* Photos */}
        <PhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />

        {/* Selling mode toggle */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-1.5">
            {t("variant.sellingMode")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSellingMode("BY_GRAM"); setRetailManual(false); setCostPrice(""); setRetailPrice(""); }}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isByPiece
                  ? "border-rose bg-rose/5 text-rose"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {t("variant.byGram")}
            </button>
            <button
              type="button"
              onClick={() => { setSellingMode("BY_PIECE"); setRetailManual(false); setCostPrice(""); setRetailPrice(""); }}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isByPiece
                  ? "border-rose bg-rose/5 text-rose"
                  : "border-line text-muted hover:border-muted"
              }`}
            >
              {t("variant.byPiece")}
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={isByPiece ? t("variant.purchasePricePiece") : t("variant.purchasePriceGram")}
            type="number"
            step="0.01"
            placeholder={isByPiece ? "5000" : "5.00"}
            value={costPrice}
            onChange={(e) => {
              setCostPrice(e.target.value);
              if (!retailManual) {
                const cost = parseFloat(e.target.value);
                setRetailPrice(cost > 0 ? (cost * 2).toString() : "");
              }
            }}
          />
          <div>
            <Input
              label={isByPiece ? t("variant.retailPricePiece") : t("variant.retailPriceGram")}
              type="number"
              step="0.01"
              placeholder={isByPiece ? "10000" : "10.00"}
              value={retailPrice}
              onChange={(e) => {
                setRetailPrice(e.target.value);
                setRetailManual(true);
              }}
            />
            {!retailManual && costPrice && (
              <p className="text-[10px] text-muted mt-0.5">Auto: nákupní x 2</p>
            )}
          </div>
        </div>

        {/* Price preview */}
        {retailPreview > 0 && (
          <div className="bg-nude-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t("variant.retailPriceLabel")} {isByPiece ? t("variant.perPiece") : t("variant.per100g")}:</span>
              <span className="font-semibold text-ink">
                {retailPreview.toLocaleString("cs-CZ")} Kč
              </span>
            </div>
            {costPreview > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t("variant.purchasePriceLabel")} {isByPiece ? t("variant.perPiece") : t("variant.per100g")}:</span>
                <span className="text-muted">
                  {costPreview.toLocaleString("cs-CZ")} Kč
                </span>
              </div>
            )}
            {marginPreview !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Marže:</span>
                <span className={`font-medium ${marginPreview > 30 ? "text-emerald-600" : marginPreview > 0 ? "text-amber-600" : "text-red-600"}`}>
                  {marginPreview}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Available to order — for ACCESSORY/BY_PIECE products */}
        {isByPiece && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableToOrder}
                onChange={(e) => setAvailableToOrder(e.target.checked)}
                className="w-4 h-4 rounded border-line text-rose focus:ring-rose"
              />
              <span className="text-sm font-medium text-espresso">Na objednávku</span>
            </label>
            {availableToOrder && (
              <div className="ml-6">
                <Input
                  label="Dodací lhůta (dny)"
                  type="number"
                  min={1}
                  max={90}
                  placeholder="7"
                  value={orderLeadDays}
                  onChange={(e) => setOrderLeadDays(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Variants */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-2">
            {t("product.variants")}
          </label>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="space-y-2 p-3 rounded-lg border border-line/50 bg-white">
                {category === "ACCESSORY" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Název varianty (standard, 250ml, mini...)"
                      value={v.color}
                      onChange={(e) => updateVariant(i, "color", e.target.value)}
                      className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={150}
                        placeholder={`${t("product.length")} (cm)`}
                        value={v.lengthCm}
                        onChange={(e) => updateVariant(i, "lengthCm", e.target.value)}
                        className="w-28 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      {v.color && (
                        <span className="flex items-center gap-1.5 text-xs text-espresso">
                          <span
                            className="w-4 h-4 rounded-full border border-line/50"
                            style={{ backgroundColor: HAIR_COLORS[v.color]?.hex ?? "#9CA3AF" }}
                          />
                          {colorLabel(v.color)}
                        </span>
                      )}
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(i)}
                          className="ml-auto p-1.5 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* Color grid */}
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_CODES.map((code) => {
                        const hc = HAIR_COLORS[code];
                        const selected = v.color === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => updateVariant(i, "color", code)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selected
                                ? "border-rose ring-2 ring-rose/30 scale-110"
                                : "border-white hover:border-line shadow-sm"
                            }`}
                            style={{ backgroundColor: hc.hex }}
                            title={colorLabel(code)}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVariantRow}
              className="text-xs text-rose hover:text-rose-deep font-medium"
            >
              + {t("common.add")}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "..." : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
