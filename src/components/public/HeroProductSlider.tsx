"use client";

import { ProductGridCard, type ProductGridCardProduct } from "@/components/public/ProductGridCard";

interface HeroProductSliderProps {
  products: (ProductGridCardProduct & { _variantKey: string })[];
}

export function HeroProductSlider({ products }: HeroProductSliderProps) {
  if (products.length === 0) {
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
      {products.map((p) => (
        <ProductGridCard key={p._variantKey} product={p} priority />
      ))}
    </div>
  );
}
