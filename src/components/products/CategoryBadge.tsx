"use client";

import { useTranslations } from "next-intl";
import type { ProductCategory } from "@prisma/client";

const categoryStyles: Record<ProductCategory, string> = {
  VIRGIN: "bg-purple-100 text-purple-800",
  LUXE: "bg-violet-100 text-violet-800",
  STANDARD: "bg-nude-100 text-espresso",
  SALE: "bg-red-100 text-red-800",
  ACCESSORY: "bg-sky-100 text-sky-800",
};

const categoryKeys: Record<ProductCategory, "virgin" | "luxe" | "standard" | "sale" | "accessory"> = {
  VIRGIN: "virgin",
  LUXE: "luxe",
  STANDARD: "standard",
  SALE: "sale",
  ACCESSORY: "accessory",
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
