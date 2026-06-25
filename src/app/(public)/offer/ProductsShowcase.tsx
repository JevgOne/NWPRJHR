"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getHairColor } from "@/lib/hair-colors";

interface PublicVariant {
  lengthCm: number;
  color: string;
}

interface PublicProduct {
  id: string;
  name: string;
  nameUk: string | null;
  nameRu: string | null;
  description: string | null;
  descriptionUk: string | null;
  descriptionRu: string | null;
  category: string;
  processingType: string;
  origin: string | null;
  photos: string[];
  variants: PublicVariant[];
}

export function ProductsShowcase() {
  const t = useTranslations("public.products");
  const tCategory = useTranslations("category");
  const tCommon = useTranslations("common");

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = ["ALL", "VIRGIN", "PREMIUM", "STANDARD", "SALE"];

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "ALL") {
      params.set("category", activeCategory);
    }
    fetch(`/api/public/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const lengths = (p: PublicProduct) => [
    ...new Set(p.variants.map((v) => v.lengthCm)),
  ].sort((a, b) => a - b);

  const colors = (p: PublicProduct) => [
    ...new Set(p.variants.map((v) => v.color)),
  ];

  const categoryLabel = (cat: string) => {
    if (cat === "ALL") return tCommon("all");
    return tCategory(cat.toLowerCase());
  };

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setLoading(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          {t("noProducts")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/offer/${p.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product image */}
              <div className="h-72 bg-gray-100 flex items-center justify-center">
                {p.photos.length > 0 ? (
                  <img
                    src={p.photos[0]}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                    {tCategory(p.category.toLowerCase())}
                  </span>
                  {p.origin && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                      {p.origin}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{p.name}</h3>

                {/* Lengths & Colors summary */}
                <div className="mt-2 text-xs text-gray-500 space-y-2">
                  <div>
                    <span className="font-medium">{t("lengths")}:</span>{" "}
                    {lengths(p)
                      .map((l) => `${l} cm`)
                      .join(", ")}
                  </div>
                  <div>
                    <span className="font-medium">{t("colors")}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {colors(p).map((code) => {
                        const { hex, name } = getHairColor(code);
                        return (
                          <span
                            key={code}
                            className="w-5 h-5 rounded-full border border-gray-300 inline-block"
                            style={{ backgroundColor: hex }}
                            title={`${code} - ${name}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
