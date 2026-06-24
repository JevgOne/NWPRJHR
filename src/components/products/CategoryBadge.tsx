import type { ProductCategory } from "@prisma/client";

const categoryStyles: Record<ProductCategory, string> = {
  VIRGIN: "bg-purple-100 text-purple-800",
  PREMIUM: "bg-amber-100 text-amber-800",
  STANDARD: "bg-blue-100 text-blue-800",
  SALE: "bg-red-100 text-red-800",
};

const categoryLabels: Record<ProductCategory, string> = {
  VIRGIN: "Virgin",
  PREMIUM: "Premium",
  STANDARD: "Standard",
  SALE: "Sale",
};

export function CategoryBadge({ category }: { category: ProductCategory }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}
