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

interface ProductDetail {
  id: string;
  slug?: string | null;
  name: string;
  nameUk?: string | null;
  nameRu?: string | null;
  description?: string | null;
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
    active: boolean;
  }>;
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
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: JSON.stringify(newPhotos) }),
      });
      router.refresh();
    },
    [product.id, router]
  );

  const handleVideoChange = useCallback(
    async (videoUrl: string | null) => {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video: videoUrl }),
      });
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

          {/* Product attributes row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <CategoryBadge
              category={
                product.category as "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE"
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
          variants={product.variants ?? []}
          isOwner={isOwner}
        />
      </Card>

      {showSocialPost && (
        <SocialPostModal
          product={product}
          onClose={() => setShowSocialPost(false)}
        />
      )}
    </div>
  );
}
