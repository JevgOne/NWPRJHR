"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { ProductGridCard, type ProductGridCardProduct } from "./ProductGridCard";

export function RecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const t = useTranslations("productDetail");
  const [products, setProducts] = useState<ProductGridCardProduct[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewed()
      .filter((s) => s !== excludeSlug)
      .slice(0, 4);
    if (slugs.length === 0) return;

    fetch(`/api/public/products?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((res) => {
        // Preserve the order from recently viewed (most recent first)
        const bySlug = new Map<string, ProductGridCardProduct>();
        for (const p of res.data ?? []) {
          bySlug.set(p.slug, p);
        }
        const ordered = slugs
          .map((s) => bySlug.get(s))
          .filter((p): p is ProductGridCardProduct => p != null);
        setProducts(ordered);
      })
      .catch(() => {});
  }, [excludeSlug]);

  if (products.length === 0) return null;

  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold text-ink mb-5">{t("recentlyViewed")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductGridCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
