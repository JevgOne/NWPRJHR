"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CategoryBadge } from "@/components/products/CategoryBadge";
import { VariantTable } from "@/components/products/VariantTable";
import { VariantBatchCreate } from "@/components/products/VariantBatchCreate";
import { PhotoUpload } from "@/components/products/PhotoUpload";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ProductDetail {
  id: string;
  name: string;
  nameUk?: string | null;
  nameRu?: string | null;
  description?: string | null;
  category: string;
  processingType: string;
  origin?: string | null;
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
          className="text-gray-400 hover:text-gray-600"
        >
          {t("common.back")}
        </Link>
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product.name}
            </h1>
            {product.nameUk && (
              <p className="text-sm text-gray-500">UK: {product.nameUk}</p>
            )}
            {product.nameRu && (
              <p className="text-sm text-gray-500">RU: {product.nameRu}</p>
            )}
            {product.description && (
              <p className="mt-2 text-gray-600">{product.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge
              category={
                product.category as "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE"
              }
            />
            <span className="text-sm text-gray-500">
              {product.processingType.replace(/_/g, "-")}
            </span>
            {product.origin && (
              <span className="text-sm text-gray-500">
                🌍 {product.origin}
              </span>
            )}
          </div>
        </div>
      </Card>

      {isOwner && (
        <Card>
          <PhotoUpload
            photos={parsedPhotos}
            onChange={handlePhotosChange}
          />
        </Card>
      )}

      {!isOwner && parsedPhotos.length > 0 && (
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("photos.title")}
          </label>
          <div className="flex flex-wrap gap-2">
            {parsedPhotos.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${t("photos.photo")} ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
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
    </div>
  );
}
