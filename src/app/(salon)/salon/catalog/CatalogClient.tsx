"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import type { Role } from "@prisma/client";

interface CatalogVariant {
  id: string;
  lengthCm: number;
  color: string;
  pricePerGram: number;
  availableGrams: number;
  availablePieces: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  nameUk?: string;
  nameRu?: string;
  category: string;
  variants: CatalogVariant[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CatalogClient({ role }: { role: Role }) {
  const t = useTranslations("salonPortal");
  const tB2B = useTranslations("b2bSettings");
  const tCommon = useTranslations("common");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountPct, setDiscountPct] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/salon-portal/catalog")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/b2b-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.discountPct != null) {
          setDiscountPct(data.discountPct / 100);
        }
      })
      .catch(() => {});
  }, [role]);

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  if (products.length === 0) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">{t("noProducts")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("catalog")}</h1>
      <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
        role === "HAIRDRESSER"
          ? "bg-nude-50 text-espresso"
          : "bg-rose/5 text-rose"
      }`}>
        {role === "HAIRDRESSER"
          ? `${tB2B("tierHairdresser")} — ${discountPct ?? "..."}% ${tB2B("discount").toLowerCase()}`
          : `${tB2B("tierSalon")} — ${discountPct != null ? `${discountPct}% ${tB2B("discount").toLowerCase()}` : t("yourDiscount")}`}
      </div>
      {products.map((product) => (
        <Card key={product.id}>
          <h2 className="font-medium text-base mb-2">{product.name}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-1 pr-2">-</th>
                <th className="py-1 pr-2 text-right">{t("pricePerGram")}</th>
                <th className="py-1 text-right">{t("available")}</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">
                    {v.lengthCm}cm, {v.color}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    {formatCZK(v.pricePerGram)}
                  </td>
                  <td className="py-1.5 text-right">
                    {v.availableGrams > 0 ? (
                      <span className="text-green-600">{v.availableGrams}g</span>
                    ) : (
                      <span className="text-red-500">{t("outOfStock")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
