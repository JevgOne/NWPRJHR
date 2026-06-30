"use client";

import { useState, useEffect, useMemo } from "react";
import { ProductGridCard } from "@/components/public/ProductGridCard";

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
  variants: {
    lengthCm: number;
    color: string;
    retailPricePerGram: number;
    availableGrams: number;
    sellingMode?: "BY_GRAM" | "BY_PIECE";
    retailPricePerPiece?: number;
    availablePieces?: number;
  }[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<SliderProduct[]>([]);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  // Top 4 products by total stock
  const topProducts = useMemo(() => {
    return products
      .filter((p) => p.variants.some((v) =>
        (v.retailPricePerGram > 0 && v.availableGrams > 0) ||
        (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0 && (v.availablePieces ?? 0) > 0)
      ))
      .sort((a, b) => {
        const stockA = a.variants.reduce((s, v) => s + v.availableGrams + (v.availablePieces ?? 0), 0);
        const stockB = b.variants.reduce((s, v) => s + v.availableGrams + (v.availablePieces ?? 0), 0);
        return stockB - stockA;
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
          key={p.id}
          product={p}
        />
      ))}
    </div>
  );
}
