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

/**
 * Select hero products for homepage/landing page display.
 * Filters in-stock products, sorts by stock desc, takes top 12 candidates,
 * shuffles them (Fisher-Yates), and returns `count` items.
 * Must be called on the server to avoid hydration mismatch.
 */
export function selectHeroProducts<T extends ProductGridCardProduct>(
  products: T[],
  count = 4,
): (T & { _variantKey: string })[] {
  const inStock = products.filter((p) => p.variants.some((v) =>
    (v.retailPricePerGram > 0 && v.availableGrams > 0) ||
    (v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0 && (v.availablePieces ?? 0) > 0)
  ));
  const flat = flattenProductVariants(inStock);
  const eligible = flat.filter((c) => {
    const v = c.variants[0];
    return v && ((v.availableGrams > 0 && v.retailPricePerGram > 0) ||
      (v.sellingMode === "BY_PIECE" && (v.availablePieces ?? 0) > 0 && (v.retailPricePerPiece ?? 0) > 0));
  });

  eligible.sort((a, b) => {
    const va = a.variants[0], vb = b.variants[0];
    const sa = (va?.availableGrams ?? 0) + (va?.availablePieces ?? 0);
    const sb = (vb?.availableGrams ?? 0) + (vb?.availablePieces ?? 0);
    return sb - sa;
  });
  const pool = eligible.slice(0, Math.min(eligible.length, 12));

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
