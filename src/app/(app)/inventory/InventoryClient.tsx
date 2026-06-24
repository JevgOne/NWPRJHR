"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface StockItem {
  variantId: string;
  product: { id: string; name: string; category: string; processingType: string };
  lengthCm: number;
  color: string;
  physicalGrams: number;
  physicalPieces: number;
  reservedGrams: number;
  reservedPieces: number;
  availableGrams: number;
  availablePieces: number;
}

function stockClass(grams: number): string {
  if (grams <= 0) return "text-red-600 font-semibold";
  if (grams < 100) return "text-amber-600 font-medium";
  return "text-green-600";
}

export function InventoryClient({
  items,
  role,
}: {
  items: StockItem[];
  role: string;
}) {
  const t = useTranslations("stock");
  const tCat = useTranslations("category");
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card padding="sm">
      <div className="mb-4">
        <Input
          placeholder={`${t("barcode")} / ${t("selectVariant")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-3 px-2 font-medium">{t("selectVariant")}</th>
              <th className="py-3 px-2 font-medium text-right">
                {t("physical")} ({t("grams")})
              </th>
              <th className="py-3 px-2 font-medium text-right">
                {t("physical")} ({t("pieces")})
              </th>
              {role === "OWNER" && (
                <th className="py-3 px-2 font-medium text-right">
                  {t("reserved")} ({t("grams")})
                </th>
              )}
              <th className="py-3 px-2 font-medium text-right">
                {t("availableShort")} ({t("grams")})
              </th>
              <th className="py-3 px-2 font-medium text-right">
                {t("availableShort")} ({t("pieces")})
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  {t("noStock")}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.variantId}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.lengthCm} cm / {item.color} /{" "}
                      {tCat(item.product.category.toLowerCase() as "virgin" | "premium" | "standard" | "sale")}
                    </div>
                  </td>
                  <td className={`py-3 px-2 text-right ${stockClass(item.physicalGrams)}`}>
                    {item.physicalGrams} {t("grams")}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700">
                    {item.physicalPieces} {t("pieces")}
                  </td>
                  {role === "OWNER" && (
                    <td className="py-3 px-2 text-right text-gray-500">
                      {item.reservedGrams} {t("grams")}
                    </td>
                  )}
                  <td className={`py-3 px-2 text-right ${stockClass(item.availableGrams)}`}>
                    {item.availableGrams} {t("grams")}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-700">
                    {item.availablePieces} {t("pieces")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
