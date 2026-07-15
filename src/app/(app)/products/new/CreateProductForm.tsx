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

const CATEGORIES = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;

const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};

interface VariantRow {
  lengthCm: string;
  color: string;
}

export function CreateProductForm() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<string>("VIRGIN");
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

  // Auto-generated name preview
  const catNames = CATEGORY_NAMES[category] ?? CATEGORY_NAMES.VIRGIN;
  const namePreview = texture ? `${catNames.cs} — ${texture}` : catNames.cs;

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

  const tColors = useTranslations("public.colors");
  const colorOptions = COLOR_CODES.map((code) => ({
    code,
    hex: HAIR_COLORS[code].hex,
    label: (() => { try { return tColors(HAIR_COLORS[code].nameKey as "c1"); } catch { return code; } })(),
  }));

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
    const validVariants = variants.filter((v) => v.lengthCm && v.color);
    if (validVariants.length === 0) {
      setError("Přidejte alespoň jednu variantu (délka + barva)");
      return;
    }

    setLoading(true);

    const name = texture ? `${catNames.cs} — ${texture}` : catNames.cs;
    const nameUk = texture ? `${catNames.uk} — ${texture}` : catNames.uk;
    const nameRu = texture ? `${catNames.ru} — ${texture}` : catNames.ru;

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

      // 2. Create variants
      const variantData = validVariants.map((v) => ({
        lengthCm: parseInt(v.lengthCm),
        color: v.color,
        wholesalePricePerGram: 0,
        retailPricePerGram: 0,
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
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`category.${cat.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Origin */}
        <div ref={originRef} className="relative">
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
        </div>

        {/* Texture */}
        <div ref={textureRef} className="relative">
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
        </div>

        {/* Color Tone */}
        <div ref={colorToneRef} className="relative">
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
        </div>

        {/* Name preview */}
        <div className="px-3 py-2 bg-nude-50 rounded-lg border border-line/50">
          <span className="text-[10px] uppercase tracking-wider text-muted">{t("product.namePreview")}</span>
          <p className="text-sm font-medium text-ink mt-0.5">{namePreview}</p>
        </div>

        {/* Photos */}
        <PhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />

        {/* Variants */}
        <div>
          <label className="block text-sm font-medium text-espresso mb-2">
            {t("product.variants")}
          </label>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={150}
                  placeholder={`${t("product.length")} (cm)`}
                  value={v.lengthCm}
                  onChange={(e) => updateVariant(i, "lengthCm", e.target.value)}
                  className="w-24 rounded-lg border border-line px-3 py-2 text-sm"
                />
                <select
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <option value="">{t("stock.color")}...</option>
                  {colorOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                  ))}
                </select>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariantRow(i)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
