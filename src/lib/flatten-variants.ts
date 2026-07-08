import type { ProductGridCardProduct } from "@/components/public/ProductGridCard";

/**
 * Flatten a product with multiple variants into individual card items.
 * Each variant becomes its own "product card" with exactly 1 color, 1 length, 1 price.
 * The card still links to the same product detail page.
 */
export function flattenProductVariants<T extends ProductGridCardProduct>(
  products: T[],
): (T & { _variantKey: string })[] {
  const result: (T & { _variantKey: string })[] = [];

  for (const product of products) {
    if (product.variants.length === 0) {
      result.push({ ...product, _variantKey: `${product.id}-empty` });
      continue;
    }

    for (const variant of product.variants) {
      result.push({
        ...product,
        variants: [variant],
        _variantKey: `${product.id}-${variant.lengthCm}-${variant.color}`,
      });
    }
  }

  return result;
}
