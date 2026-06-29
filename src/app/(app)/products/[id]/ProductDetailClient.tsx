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
            {product.description ? (
              <p className="mt-2 text-gray-600">{product.description}</p>
            ) : isOwner ? (
              <button
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="mt-2 text-sm text-rose hover:text-rose/70 transition-colors disabled:opacity-50"
              >
                {generatingBio ? "..." : t("product.generateBio")}
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge
              category={
                product.category as "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE"
              }
            />
            <span className="text-sm text-muted">
              {product.processingType.replace(/_/g, "-")}
            </span>
            {product.origin && (
              <span className="text-sm text-muted">
                🌍 {product.origin}
              </span>
            )}
            {isOwner ? (
              <div ref={textureRef} className="relative">
                <button
                  type="button"
                  onClick={() => setEditingTexture(!editingTexture)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                  {textureValue ? (
                    <>
                      <TextureSwatch texture={textureValue} size={20} />
                      {textureValue}
                    </>
                  ) : (
                    <span className="text-violet-400">+ {t("product.texture")}</span>
                  )}
                </button>
                {editingTexture && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-line shadow-lg">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
                <TextureSwatch texture={product.texture} size={20} />
                {product.texture}
              </span>
            ) : null}
            {isOwner ? (
              <div ref={colorToneRef} className="relative">
                <button
                  type="button"
                  onClick={() => setEditingColorTone(!editingColorTone)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                >
                  {colorToneValue ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(colorToneValue).hex }} />
                      {colorToneValue}
                    </>
                  ) : (
                    <span className="text-amber-400">+ {t("product.colorTone")}</span>
                  )}
                </button>
                {editingColorTone && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-line shadow-lg">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                <span className="w-3.5 h-3.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
                {product.colorTone}
              </span>
            ) : null}
          </div>
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
            productId={product.id}
          />
        </Card>
      )}

      {!isOwner && parsedPhotos.length > 0 && (
        <Card>
          <label className="block text-sm font-medium text-espresso mb-2">
            {t("photos.title")}
          </label>
          <div className="flex flex-wrap gap-2">
            {parsedPhotos.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${t("photos.photo")} ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-line"
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
