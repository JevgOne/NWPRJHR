"use client";

import { useTranslations } from "next-intl";
import type { ProductCategory } from "@prisma/client";

const categoryStyles: Record<ProductCategory, string> = {
  VIRGIN: "bg-purple-100 text-purple-800",
  PREMIUM: "bg-amber-100 text-amber-800",
  STANDARD: "bg-blue-100 text-blue-800",
  SALE: "bg-red-100 text-red-800",
};

const categoryKeys: Record<ProductCategory, "virgin" | "premium" | "standard" | "sale"> = {
  VIRGIN: "virgin",
  PREMIUM: "premium",
  STANDARD: "standard",
  SALE: "sale",
};

export function CategoryBadge({ category }: { category: ProductCategory }) {
  const t = useTranslations("category");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category]}`}
    >
      {t(categoryKeys[category])}
    </span>
  );
}
