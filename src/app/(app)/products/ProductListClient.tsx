"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CategoryBadge } from "@/components/products/CategoryBadge";
import { Card } from "@/components/ui/Card";
import { TextureSwatch } from "@/components/TextureSwatch";
import { getColorToneInfo } from "@/lib/color-tones";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  processingType: string;
  variants?: unknown[];
  [key: string]: unknown;
}

export function ProductListClient({ products }: { products: ProductItem[] }) {
  const t = useTranslations();

  if (products.length === 0) {
    return (
      <Card>
        <p className="text-muted text-center py-4">
          {t("common.search")} — 0
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-ink">{product.name}</h3>
              <CategoryBadge
                category={product.category as "VIRGIN" | "PREMIUM" | "STANDARD" | "SALE"}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-sm text-muted">
                {product.processingType.replace(/_/g, "-")}
              </span>
              {typeof product.texture === "string" && product.texture && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
                  <TextureSwatch texture={product.texture} size={16} />
                  {product.texture}
                </span>
              )}
              {typeof product.colorTone === "string" && product.colorTone && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
                  {product.colorTone}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {product.variants?.length ?? 0} {t("salon.priceVariant").toLowerCase()}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
