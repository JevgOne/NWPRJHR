"use client";

import { ProductGridCard, type ProductGridCardProduct } from "@/components/public/ProductGridCard";
import { flattenProductVariants } from "@/lib/flatten-variants";
import { useMemo } from "react";

interface HeroProductSliderProps {
  products: ProductGridCardProduct[];
}

export function HeroProductSlider({ products }: HeroProductSliderProps) {
  const topProducts = useMemo(() => {
    const inStock = products.filter((p) => p.variants.some((v) =>
      (v.retailPricePerGram > 0 && v.availableGrams > 0) ||
      (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0 && (v.availablePieces ?? 0) > 0)
    ));
    const flat = flattenProductVariants(inStock);
    return flat
      .filter((c) => {
        const v = c.variants[0];
        return v && ((v.availableGrams > 0 && v.retailPricePerGram > 0) || (v.sellingMode === "BY_PIECE" && (v.availablePieces ?? 0) > 0 && (v.retailPricePerPiece ?? 0) > 0));
      })
      .sort((a, b) => {
        const va = a.variants[0];
        const vb = b.variants[0];
        const sa = (va?.availableGrams ?? 0) + (va?.availablePieces ?? 0);
        const sb = (vb?.availableGrams ?? 0) + (vb?.availablePieces ?? 0);
        return sb - sa;
      })
      .slice(0, 4);
  }, [products]);

  if (topProducts.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[3/4] bg-nude-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {topProducts.map((p) => (
        <ProductGridCard
          key={p._variantKey}
          product={p}
          priority
        />
      ))}
    </div>
  );
}
