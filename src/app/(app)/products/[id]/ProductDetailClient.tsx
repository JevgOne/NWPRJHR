"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CategoryBadge } from "@/components/products/CategoryBadge";
import { VariantTable } from "@/components/products/VariantTable";
import { VariantBatchCreate } from "@/components/products/VariantBatchCreate";
import { PhotoUpload } from "@/components/products/PhotoUpload";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TextureSwatch } from "@/components/TextureSwatch";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { COLOR_TONE_OPTIONS, getColorToneInfo } from "@/lib/color-tones";
import { SocialPostModal } from "@/components/products/SocialPostModal";
import { generateProductBio } from "@/lib/product-bio";
import { getHairColor } from "@/lib/hair-colors";
import { ORIGIN_OPTIONS } from "@/lib/origin-flags";
import { slugify } from "@/lib/slugify";
import { formatCZK } from "@/lib/pricing";

const PROCESSING_TYPES = ["CLIP_IN", "TAPE_IN", "KERATIN", "WEFT", "MICRO_RING", "OTHER"] as const;
const CATEGORIES = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;

interface ProductDetail {
  id: string;
  slug?: string | null;
  name: string;
  nameUk?: string | null;
  nameRu?: string | null;
  description?: string | null;
  descriptionUk?: string | null;
  descriptionRu?: string | null;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  colorTone?: string | null;
  photos?: string;
  video?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  variants?: Array<{
    id: string;
    lengthCm: number;
    color: string;
    costPricePerGram?: number;
    wholesalePricePerGram?: number;
    retailPricePerGram?: number;
    retailManualOverride?: boolean;
    pricePerGram?: number;
    sellingMode?: string;
    pricePerPiece?: number | null;
    retailPricePerPiece?: number | null;
    availableToOrder?: boolean;
    orderLeadDays?: number | null;
    active: boolean;
  }>;
}

interface DeliveryData {
  id: string;
  stockedAt: string;
  initialGrams: number;
  remainingGrams: number;
  initialPieces: number;
  remainingPieces: number;
  purchasePricePerGramRaw: number;
  currency: string;
  barcode?: string | null;
  note?: string | null;
  pieceWeightGrams?: number | null;
  supplier?: { id: string; name: string } | null;
  variant: { id: string; lengthCm: number; color: string; sellingMode: string };
}

interface EditValues {
  name: string;
  nameUk: string;
  nameRu: string;
  category: string;
  origin: string;
  processingType: string;
  description: string;
  descriptionUk: string;
  descriptionRu: string;
  slug: string;
}

export function ProductDetailClient({
  product,
  isOwner,
}: {
  product: ProductDetail;
  isOwner: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [showBatchCreate, setShowBatchCreate] = useState(false);
  const [showSocialPost, setShowSocialPost] = useState(false);
  const [metaTitleValue, setMetaTitleValue] = useState(product.metaTitle ?? "");
  const [metaDescValue, setMetaDescValue] = useState(product.metaDescription ?? "");
  const [ogImageValue, setOgImageValue] = useState(product.ogImage ?? "");
  const [savingSeo, setSavingSeo] = useState(false);
  const [editingTexture, setEditingTexture] = useState(false);
  const [textureValue, setTextureValue] = useState(product.texture ?? "");
  const textureRef = useRef<HTMLDivElement>(null);
  const [editingColorTone, setEditingColorTone] = useState(false);
  const [colorToneValue, setColorToneValue] = useState(product.colorTone ?? "");
  const colorToneRef = useRef<HTMLDivElement>(null);

  // Phase 1: Product edit mode
  const [editMode, setEditMode] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editValues, setEditValues] = useState<EditValues>({
    name: product.name,
    nameUk: product.nameUk ?? "",
    nameRu: product.nameRu ?? "",
    category: product.category,
    origin: product.origin ?? "",
    processingType: product.processingType,
    description: product.description ?? "",
    descriptionUk: product.descriptionUk ?? "",
    descriptionRu: product.descriptionRu ?? "",
    slug: product.slug ?? "",
  });

  // Phase 3: Deliveries
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [editingDeliveryField, setEditingDeliveryField] = useState<string | null>(null);
  const [deliveryEditValue, setDeliveryEditValue] = useState("");

  // Phase 4: Unsaved changes warning
  useEffect(() => {
    if (!editMode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editMode]);

  const enterEditMode = useCallback(() => {
    setEditValues({
      name: product.name,
      nameUk: product.nameUk ?? "",
      nameRu: product.nameRu ?? "",
      category: product.category,
      origin: product.origin ?? "",
      processingType: product.processingType,
      description: product.description ?? "",
      descriptionUk: product.descriptionUk ?? "",
      descriptionRu: product.descriptionRu ?? "",
      slug: product.slug ?? "",
    });
    setEditMode(true);
  }, [product]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  const saveProduct = useCallback(async () => {
    setSavingProduct(true);
    const changes: Record<string, unknown> = {};
    if (editValues.name !== product.name) changes.name = editValues.name;
    if (editValues.nameUk !== (product.nameUk ?? "")) changes.nameUk = editValues.nameUk || null;
    if (editValues.nameRu !== (product.nameRu ?? "")) changes.nameRu = editValues.nameRu || null;
    if (editValues.category !== product.category) changes.category = editValues.category;
    if (editValues.origin !== (product.origin ?? "")) changes.origin = editValues.origin || null;
    if (editValues.processingType !== product.processingType) changes.processingType = editValues.processingType;
    if (editValues.description !== (product.description ?? "")) changes.description = editValues.description || null;
    if (editValues.descriptionUk !== (product.descriptionUk ?? "")) changes.descriptionUk = editValues.descriptionUk || null;
    if (editValues.descriptionRu !== (product.descriptionRu ?? "")) changes.descriptionRu = editValues.descriptionRu || null;
    if (editValues.slug !== (product.slug ?? "")) changes.slug = editValues.slug || undefined;

    if (Object.keys(changes).length === 0) {
      setEditMode(false);
      setSavingProduct(false);
      return;
    }

    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setSavingProduct(false);
    if (res.ok) {
      setEditMode(false);
      router.refresh();
    }
  }, [editValues, product, router]);

  const updateEditField = useCallback((field: keyof EditValues, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Deliveries fetch
  const fetchDeliveries = useCallback(async () => {
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`/api/products/${product.id}/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } finally {
      setLoadingDeliveries(false);
    }
  }, [product.id]);

  const toggleDeliveries = useCallback(() => {
    if (!showDeliveries) {
      fetchDeliveries();
    }
    setShowDeliveries(prev => !prev);
  }, [showDeliveries, fetchDeliveries]);

  const saveDeliveryField = useCallback(async (deliveryId: string, field: string, value: string) => {
    await fetch(`/api/deliveries/${deliveryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    setEditingDeliveryField(null);
    fetchDeliveries();
  }, [fetchDeliveries]);

  const saveDeliveryQuantity = useCallback(async (deliveryId: string, field: string, value: number, oldValue: number) => {
    if (value === oldValue) { setEditingDeliveryField(null); return; }
    if (!confirm(`${oldValue} -> ${value}?`)) { setEditingDeliveryField(null); return; }
    await fetch(`/api/deliveries/${deliveryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setEditingDeliveryField(null);
    fetchDeliveries();
    router.refresh();
  }, [fetchDeliveries, router]);

  const deleteDelivery = useCallback(async (deliveryId: string) => {
    if (!confirm("Smazat tuto dodávku?")) return;
    const res = await fetch(`/api/deliveries/${deliveryId}`, { method: "DELETE" });
    if (res.ok) {
      fetchDeliveries();
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Nelze smazat");
    }
  }, [fetchDeliveries, router]);

  const saveTexture = useCallback(async (newTexture: string) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texture: newTexture || null }),
    });
    setEditingTexture(false);
    router.refresh();
  }, [product.id, router]);

  const saveColorTone = useCallback(async (newColorTone: string) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colorTone: newColorTone || null }),
    });
    setEditingColorTone(false);
    router.refresh();
  }, [product.id, router]);

  useEffect(() => {
    if (!editingTexture && !editingColorTone) return;
    function handleClick(e: MouseEvent) {
      if (textureRef.current && !textureRef.current.contains(e.target as Node)) {
        setEditingTexture(false);
      }
      if (colorToneRef.current && !colorToneRef.current.contains(e.target as Node)) {
        setEditingColorTone(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editingTexture, editingColorTone]);

  const [generatingBio, setGeneratingBio] = useState(false);

  const handleGenerateBio = useCallback(async () => {
    const lengths = [...new Set((product.variants ?? []).map((v) => v.lengthCm))].sort((a, b) => a - b);
    const colorCount = new Set((product.variants ?? []).map((v) => v.color)).size;
    const bio = generateProductBio({
      name: product.name,
      category: product.category,
      processingType: product.processingType,
      origin: product.origin,
      texture: product.texture,
      colorTone: product.colorTone,
      lengths,
      colorCount,
    });
    setGeneratingBio(true);
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: bio }),
    });
    setGeneratingBio(false);
    router.refresh();
  }, [product, router]);

  const parsedPhotos: string[] = (() => {
    try {
      return product.photos ? JSON.parse(product.photos) : [];
    } catch {
      return [];
    }
  })();

  const handlePhotosChange = useCallback(
    async (newPhotos: string[]) => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: JSON.stringify(newPhotos) }),
      });
      if (!res.ok) {
        console.error("Failed to save photos:", await res.text());
      }
      router.refresh();
    },
    [product.id, router]
  );

  const handleVideoChange = useCallback(
    async (videoUrl: string | null) => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video: videoUrl }),
      });
      if (!res.ok) {
        console.error("Failed to save video:", await res.text());
      }
      router.refresh();
    },
    [product.id, router]
  );

  const handleSaveSeo = useCallback(async () => {
    setSavingSeo(true);
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaTitle: metaTitleValue || null,
        metaDescription: metaDescValue || null,
        ogImage: ogImageValue || null,
      }),
    });
    setSavingSeo(false);
    router.refresh();
  }, [product.id, metaTitleValue, metaDescValue, ogImageValue, router]);

  // Auto-generated SEO preview
  const lengths = [...new Set((product.variants ?? []).map((v) => v.lengthCm))].sort((a, b) => a - b);
  const lengthStr = lengths.map((l) => `${l}cm`).join(", ");
  const colorCodes = [...new Set((product.variants ?? []).map((v) => v.color))];
  const tColors = useTranslations("public.colors");
  const colorNames = colorCodes.map((c) => {
    try { return tColors(getHairColor(c).nameKey); } catch { return c; }
  });
  const colorStr = colorNames.length <= 2 ? colorNames.join(", ") : "";
  const baseTitle = [product.name, lengthStr].filter(Boolean).join(" ");
  const titleWithColor = colorStr ? `${baseTitle} ${colorStr}` : baseTitle;
  const autoTitle = (titleWithColor.length + 11 <= 60) ? titleWithColor : baseTitle;
  const autoDescParts: string[] = [product.name];
  if (product.origin) autoDescParts.push(`${t("product.originPrefix")} ${product.origin}`);
  if (product.texture) autoDescParts.push(product.texture.toLowerCase());
  if (lengthStr) autoDescParts.push(lengthStr);
  autoDescParts.push(t("product.autoSeoDesc"));
  const autoDescription = autoDescParts.join(". ").slice(0, 155);
  const previewTitle = metaTitleValue || autoTitle;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="text-muted hover:text-gray-600"
        >
          {t("common.back")}
        </Link>
      </div>

      <Card>
        {editMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{t("product.editProduct")}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={savingProduct}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={saveProduct} disabled={savingProduct}>
                  {savingProduct ? "..." : t("common.save")}
                </Button>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.nameCz")}</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => updateEditField("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.nameUk")}</label>
                <input
                  type="text"
                  value={editValues.nameUk}
                  onChange={(e) => updateEditField("nameUk", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.nameRu")}</label>
                <input
                  type="text"
                  value={editValues.nameRu}
                  onChange={(e) => updateEditField("nameRu", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                />
              </div>
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t("product.category")}</label>
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateEditField("category", cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      editValues.category === cat
                        ? "bg-espresso text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin + Processing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.origin")}</label>
                <select
                  value={editValues.origin}
                  onChange={(e) => updateEditField("origin", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                >
                  <option value="">—</option>
                  {ORIGIN_OPTIONS.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.flag} {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.processingType")}</label>
                <select
                  value={editValues.processingType}
                  onChange={(e) => updateEditField("processingType", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                >
                  {PROCESSING_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt.replace(/_/g, "-")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.descriptionCz")}</label>
                <textarea
                  value={editValues.description}
                  onChange={(e) => updateEditField("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.descriptionUk")}</label>
                <textarea
                  value={editValues.descriptionUk}
                  onChange={(e) => updateEditField("descriptionUk", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">{t("product.descriptionRu")}</label>
                <textarea
                  value={editValues.descriptionRu}
                  onChange={(e) => updateEditField("descriptionRu", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose resize-none"
                />
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValues.slug}
                  onChange={(e) => updateEditField("slug", e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateEditField("slug", slugify(editValues.name))}
                >
                  Auto
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">
                  {product.name}
                </h1>
                {product.nameUk && (
                  <p className="text-sm text-muted">UK: {product.nameUk}</p>
                )}
                {product.nameRu && (
                  <p className="text-sm text-muted">RU: {product.nameRu}</p>
                )}
              </div>
              {isOwner && (
                <Button size="sm" variant="secondary" onClick={enterEditMode}>
                  {t("common.edit")}
                </Button>
              )}
            </div>

            {/* Product attributes row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CategoryBadge
                category={
                  product.category as "VIRGIN" | "LUXE" | "STANDARD" | "SALE"
                }
              />
              {product.processingType !== "OTHER" && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {product.processingType.replace(/_/g, "-")}
                </span>
              )}
              {product.origin && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {product.origin}
                </span>
              )}

              {/* Texture */}
              {isOwner ? (
                <div ref={textureRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setEditingTexture(!editingTexture)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    {textureValue ? (
                      <>
                        <TextureSwatch texture={textureValue} size={16} />
                        {textureValue}
                      </>
                    ) : (
                      <span className="text-violet-400">+ {t("product.texture")}</span>
                    )}
                  </button>
                  {editingTexture && (
                    <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-line shadow-lg">
                      {TEXTURE_OPTIONS.map((opt) => (
                        <button
                          key={opt.name}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
                          onClick={() => {
                            setTextureValue(opt.name);
                            saveTexture(opt.name);
                          }}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.name}</span>
                        </button>
                      ))}
                      {textureValue && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left border-t border-line"
                          onClick={() => {
                            setTextureValue("");
                            saveTexture("");
                          }}
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : product.texture ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700">
                  <TextureSwatch texture={product.texture} size={16} />
                  {product.texture}
                </span>
              ) : null}

              {/* Color tone */}
              {isOwner ? (
                <div ref={colorToneRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setEditingColorTone(!editingColorTone)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    {colorToneValue ? (
                      <>
                        <span className="w-3 h-3 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(colorToneValue).hex }} />
                        {colorToneValue}
                      </>
                    ) : (
                      <span className="text-amber-400">+ {t("product.colorTone")}</span>
                    )}
                  </button>
                  {editingColorTone && (
                    <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-line shadow-lg">
                      {COLOR_TONE_OPTIONS.map((opt) => (
                        <button
                          key={opt.name}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
                          onClick={() => {
                            setColorToneValue(opt.name);
                            saveColorTone(opt.name);
                          }}
                        >
                          <span className="w-4 h-4 rounded-full inline-block border border-line/50" style={{ backgroundColor: opt.hex }} />
                          <span>{opt.name}</span>
                        </button>
                      ))}
                      {colorToneValue && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left border-t border-line"
                          onClick={() => {
                            setColorToneValue("");
                            saveColorTone("");
                          }}
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : product.colorTone ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                  <span className="w-3 h-3 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
                  {product.colorTone}
                </span>
              ) : null}
            </div>

            {/* Description */}
            {product.description ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600 whitespace-pre-line">{product.description}</div>
                {isOwner && (
                  <button
                    onClick={handleGenerateBio}
                    disabled={generatingBio}
                    className="mt-2 text-xs text-muted hover:text-rose transition-colors disabled:opacity-50"
                  >
                    {generatingBio ? "..." : t("product.regenerateBio")}
                  </button>
                )}
              </div>
            ) : isOwner ? (
              <button
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="mt-3 text-sm text-rose hover:text-rose/70 transition-colors disabled:opacity-50"
              >
                {generatingBio ? "..." : t("product.generateBio")}
              </button>
            ) : null}
          </div>
        )}
      </Card>

      {isOwner && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSocialPost(true)}
          >
            {t("product.generatePost")}
          </Button>
        </div>
      )}

      {isOwner && (
        <Card>
          <PhotoUpload
            photos={parsedPhotos}
            onChange={handlePhotosChange}
            video={product.video}
            onVideoChange={handleVideoChange}
            productId={product.id}
          />
        </Card>
      )}

      {/* SEO section — owner only */}
      {isOwner && (
        <Card>
          <h2 className="text-lg font-semibold text-ink mb-4">SEO</h2>

          {/* Meta Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-espresso mb-1">
              Meta Title
              <span className={`ml-2 text-xs ${(metaTitleValue || autoTitle).length > 60 ? "text-red-500" : "text-muted"}`}>
                {(metaTitleValue || autoTitle).length}/60
              </span>
            </label>
            <input
              type="text"
              value={metaTitleValue}
              onChange={(e) => setMetaTitleValue(e.target.value)}
              placeholder={autoTitle}
              className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
            />
            <p className="text-xs text-muted mt-1">
              Auto: {autoTitle}
            </p>
          </div>

          {/* Meta Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-espresso mb-1">
              Meta Description
              <span className={`ml-2 text-xs ${(metaDescValue || autoDescription).length > 155 ? "text-red-500" : "text-muted"}`}>
                {(metaDescValue || autoDescription).length}/155
              </span>
            </label>
            <textarea
              value={metaDescValue}
              onChange={(e) => setMetaDescValue(e.target.value)}
              placeholder={autoDescription}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose resize-none"
            />
          </div>

          {/* OG Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-espresso mb-1">
              OG Image URL
            </label>
            <input
              type="text"
              value={ogImageValue}
              onChange={(e) => setOgImageValue(e.target.value)}
              placeholder={t("product.ogImagePlaceholder")}
              className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:ring-1 focus:ring-rose focus:border-rose"
            />
            <p className="text-xs text-muted mt-1">{t("product.ogImageHint")}</p>
          </div>

          {/* Google Preview */}
          <div className="p-3 bg-nude-50 rounded-lg border border-line mb-4">
            <p className="text-xs text-muted mb-1">Google</p>
            <p className="text-blue-700 text-sm font-medium truncate">{previewTitle}</p>
            <p className="text-green-700 text-xs">hairland.cz/offer/{product.slug ?? product.id}</p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
              {metaDescValue || autoDescription}
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleSaveSeo}
            disabled={savingSeo}
          >
            {savingSeo ? "..." : t("product.saveSeo")}
          </Button>
        </Card>
      )}

      {!isOwner && (parsedPhotos.length > 0 || product.video) && (
        <Card>
          <label className="block text-sm font-medium text-espresso mb-2">
            {t("photos.title")}
          </label>
          {product.video && (
            <div className="mb-3">
              <video
                src={product.video}
                controls
                className="w-full max-w-md rounded-lg border border-line"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {parsedPhotos.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${t("photos.photo")} ${i + 1}`}
                className="w-32 h-32 object-cover rounded-lg border border-line"
              />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">
            {t("salon.priceVariant")}
          </h2>
          {isOwner && (
            <Button size="sm" onClick={() => setShowBatchCreate(true)}>
              {t("common.add")}
            </Button>
          )}
        </div>

        {showBatchCreate && (
          <div className="mb-6">
            <VariantBatchCreate
              productId={product.id}
              onClose={() => setShowBatchCreate(false)}
            />
          </div>
        )}

        <VariantTable
          productId={product.id}
          category={product.category}
          texture={product.texture}
          variants={product.variants ?? []}
          isOwner={isOwner}
        />
      </Card>

      {/* Deliveries section — owner only */}
      {isOwner && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-ink">{t("product.deliveries")}</h2>
            <Button size="sm" variant="secondary" onClick={toggleDeliveries}>
              {showDeliveries ? t("common.hide") : t("common.show")}
            </Button>
          </div>

          {showDeliveries && (
            loadingDeliveries ? (
              <p className="text-sm text-muted py-4 text-center">...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">{t("product.noDeliveries")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="pb-2 pr-3">{t("product.variant")}</th>
                      <th className="pb-2 pr-3">{t("product.supplier")}</th>
                      <th className="pb-2 pr-3">{t("product.date")}</th>
                      <th className="pb-2 pr-3">{t("product.initial")}</th>
                      <th className="pb-2 pr-3">{t("product.remaining")}</th>
                      <th className="pb-2 pr-3">{t("product.purchasePrice")}</th>
                      <th className="pb-2 pr-3">{t("product.barcode")}</th>
                      <th className="pb-2 pr-3">{t("product.note")}</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => {
                      const isByPiece = d.variant.sellingMode === "BY_PIECE";
                      const isUntouched = d.remainingGrams === d.initialGrams && d.remainingPieces === d.initialPieces;
                      const isFullyConsumed = d.remainingGrams === 0 && d.remainingPieces === 0;
                      const canDelete = isUntouched || isFullyConsumed;
                      return (
                        <tr key={d.id} className="border-b border-line/30 hover:bg-nude-50/50">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {d.variant.lengthCm}cm / {d.variant.color}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {d.supplier?.name ?? "—"}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {new Date(d.stockedAt).toLocaleDateString("cs")}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {isByPiece ? `${d.initialPieces} ks` : `${d.initialGrams} g`}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {editingDeliveryField === `remaining-${d.id}` ? (
                              <input
                                type="number"
                                className="w-20 border border-line rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose/30"
                                value={deliveryEditValue}
                                onChange={(e) => setDeliveryEditValue(e.target.value)}
                                onBlur={() => {
                                  const val = parseInt(deliveryEditValue);
                                  if (isNaN(val) || val < 0) { setEditingDeliveryField(null); return; }
                                  const field = isByPiece ? "remainingPieces" : "remainingGrams";
                                  const oldVal = isByPiece ? d.remainingPieces : d.remainingGrams;
                                  saveDeliveryQuantity(d.id, field, val, oldVal);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                  if (e.key === "Escape") setEditingDeliveryField(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                className={`text-xs hover:text-rose transition-colors ${d.remainingGrams === 0 && d.remainingPieces === 0 ? "text-red-400" : "text-emerald-600"}`}
                                onClick={() => {
                                  setEditingDeliveryField(`remaining-${d.id}`);
                                  setDeliveryEditValue(String(isByPiece ? d.remainingPieces : d.remainingGrams));
                                }}
                              >
                                {isByPiece ? `${d.remainingPieces} ks` : `${d.remainingGrams} g`}
                              </button>
                            )}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {formatCZK(d.purchasePricePerGramRaw)}/g {d.currency !== "CZK" && `(${d.currency})`}
                          </td>
                          <td className="py-2 pr-3">
                            {editingDeliveryField === `barcode-${d.id}` ? (
                              <input
                                type="text"
                                className="w-24 border border-line rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose/30"
                                value={deliveryEditValue}
                                onChange={(e) => setDeliveryEditValue(e.target.value)}
                                onBlur={() => saveDeliveryField(d.id, "barcode", deliveryEditValue)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveDeliveryField(d.id, "barcode", deliveryEditValue);
                                  if (e.key === "Escape") setEditingDeliveryField(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                className="text-xs text-muted hover:text-ink transition-colors"
                                onClick={() => {
                                  setEditingDeliveryField(`barcode-${d.id}`);
                                  setDeliveryEditValue(d.barcode ?? "");
                                }}
                              >
                                {d.barcode || "—"}
                              </button>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {editingDeliveryField === `note-${d.id}` ? (
                              <input
                                type="text"
                                className="w-32 border border-line rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose/30"
                                value={deliveryEditValue}
                                onChange={(e) => setDeliveryEditValue(e.target.value)}
                                onBlur={() => saveDeliveryField(d.id, "note", deliveryEditValue)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveDeliveryField(d.id, "note", deliveryEditValue);
                                  if (e.key === "Escape") setEditingDeliveryField(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                className="text-xs text-muted hover:text-ink transition-colors max-w-[120px] truncate block"
                                onClick={() => {
                                  setEditingDeliveryField(`note-${d.id}`);
                                  setDeliveryEditValue(d.note ?? "");
                                }}
                              >
                                {d.note || "—"}
                              </button>
                            )}
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => canDelete && deleteDelivery(d.id)}
                              className={`text-xs transition-colors ${
                                canDelete
                                  ? "text-red-400 hover:text-red-600"
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                              title={canDelete ? t("common.delete") : t("product.cannotDeleteDelivery")}
                              disabled={!canDelete}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Card>
      )}

      {showSocialPost && (
        <SocialPostModal
          product={product}
          onClose={() => setShowSocialPost(false)}
        />
      )}
    </div>
  );
}
