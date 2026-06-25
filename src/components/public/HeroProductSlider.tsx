"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface SliderProduct {
  id: string;
  name: string;
  category: string;
  processingType: string;
  origin: string | null;
  photos: string[];
  variants: { lengthCm: number; color: string }[];
}

export function HeroProductSlider() {
  const [products, setProducts] = useState<SliderProduct[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.data ?? []) as SliderProduct[];
        setProducts(items);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    if (products.length === 0) return;
    setCurrent((c) => (c + 1) % products.length);
  }, [products.length]);

  const prev = useCallback(() => {
    if (products.length === 0) return;
    setCurrent((c) => (c - 1 + products.length) % products.length);
  }, [products.length]);

  // Auto-slide every 4s
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, products.length]);

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Show 3 products at a time on desktop, 1 on mobile
  const visible = getVisibleProducts(products, current, 3);

  return (
    <div className="relative">
      {/* Desktop: 3 cards */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Mobile: 1 card */}
      <div className="sm:hidden">
        <ProductCard product={products[current]} />
      </div>

      {/* Navigation */}
      {products.length > 3 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? "bg-indigo-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getVisibleProducts(products: SliderProduct[], start: number, count: number): SliderProduct[] {
  const result: SliderProduct[] = [];
  for (let i = 0; i < Math.min(count, products.length); i++) {
    result.push(products[(start + i) % products.length]);
  }
  return result;
}

function ProductCard({ product }: { product: SliderProduct }) {
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);

  const categoryLabels: Record<string, string> = {
    VIRGIN: "Virgin",
    PREMIUM: "Premium",
    STANDARD: "Standard",
    SALE: "Akce",
  };

  return (
    <Link
      href="/offer"
      className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-64 bg-gray-100 flex items-center justify-center">
        {product.photos.length > 0 ? (
          <img
            src={product.photos[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
            {categoryLabels[product.category] ?? product.category}
          </span>
          {product.origin && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
              {product.origin}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
        {lengths.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {lengths.map((l) => `${l} cm`).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
