"use client";

import { useState, useEffect, useMemo } from "react";
import { ProductCard } from "@/components/public/ProductCard";

interface SliderVariant {
  lengthCm: number;
  color: string;
  retailPricePerGram: number;
  availableGrams: number;
}

interface SliderProduct {
  id: string;
  slug: string | null;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  category: string;
  origin: string | null;
  texture: string | null;
  colorTone: string | null;
  photos: string[];
  variants: SliderVariant[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<SliderProduct[]>([]);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  // Flatten to variant cards, pick top 4 with most stock
  const cards = useMemo(() => {
    return products
      .flatMap((p) =>
        p.variants
          .filter((v) => v.retailPricePerGram > 0 && v.availableGrams > 0)
          .map((v) => ({ product: p, variant: v }))
      )
      .sort((a, b) => b.variant.availableGrams - a.variant.availableGrams)
      .slice(0, 4);
  }, [products]);

  if (cards.length === 0) {
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
      {cards.map(({ product: p, variant: v }) => (
        <ProductCard
          key={`${p.id}-${v.lengthCm}-${v.color}`}
          product={p}
          variant={v}
        />
      ))}
    </div>
  );
}
