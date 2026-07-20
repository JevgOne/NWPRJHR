# TASK-088: Category change must update product name/slug/variant prices

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-19

---

## Summary

When admin changes a product's category (e.g. LUXE → STANDARD) via the product PUT API, only the `category` field is saved. The API must also update:
1. Product name (cs/uk/ru) — replace category portion
2. Slug — regenerate with new category
3. Variant retail prices — recalculate using new category's markup

---

## Root Cause

The PUT handler in `src/app/api/products/[id]/route.ts:28-60` is a simple pass-through:
```ts
const product = await prisma.product.update({
  where: { id },
  data: parsed.data,
});
```

No side effects are triggered when `category` changes.

---

## Implementation Plan

### File: `src/app/api/products/[id]/route.ts`

**Step 1: Import/define CATEGORY_NAMES and slugify**

Copy these from `src/app/api/deliveries/route.ts:60-72` (or import from shared lib):

```ts
const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

**Step 2: Add category-change logic in PUT handler**

After validating `parsed.data`, check if `parsed.data.category` is present. If so:

```ts
// After: const parsed = updateProductSchema.safeParse(body);
// Before: const product = await prisma.product.update(...)

if (parsed.data.category) {
  // 1. Fetch current product for texture, origin, and old category
  const current = await prisma.product.findUnique({
    where: { id },
    select: {
      category: true,
      texture: true,
      origin: true,
      variants: {
        where: { active: true },
        select: {
          id: true,
          color: true,
          lengthCm: true,
          costPricePerGram: true,
          retailManualOverride: true,
          sellingMode: true,
          pricePerPiece: true,
          retailPricePerPiece: true,
        },
      },
    },
  });

  if (current && current.category !== parsed.data.category) {
    const newCat = parsed.data.category;
    const catNames = CATEGORY_NAMES[newCat] ?? CATEGORY_NAMES.STANDARD;
    const texture = parsed.data.texture ?? current.texture ?? "";

    // 2. Regenerate names
    parsed.data.name = `${catNames.cs} — ${texture}`;
    parsed.data.nameUk = `${catNames.uk} — ${texture}`;
    parsed.data.nameRu = `${catNames.ru} — ${texture}`;

    // 3. Regenerate slug
    const firstVariant = current.variants[0];
    if (firstVariant) {
      parsed.data.slug = slugify(
        `${newCat}-${current.origin ?? ""}-${texture}-${firstVariant.color}-${firstVariant.lengthCm}cm`
      );
    } else {
      parsed.data.slug = slugify(`${newCat}-${current.origin ?? ""}-${texture}`);
    }

    // 4. Recalculate variant prices
    const priceSetting = await prisma.priceSettings.findUnique({
      where: { category: newCat },
    });
    const markupPercent = priceSetting?.markupPercent ?? 100;

    const variantsToUpdate = current.variants.filter(v => !v.retailManualOverride);
    if (variantsToUpdate.length > 0) {
      await Promise.all(
        variantsToUpdate.map(v => {
          const newRetailPerGram = Math.round(
            v.costPricePerGram * (10000 + markupPercent * 100) / 10000
          );
          const data: Record<string, unknown> = { retailPricePerGram: newRetailPerGram };
          // Also recalculate piece price if applicable
          if (v.sellingMode === "BY_PIECE" && v.pricePerPiece) {
            data.retailPricePerPiece = Math.round(
              v.pricePerPiece * (10000 + markupPercent * 100) / 10000
            );
          }
          return prisma.variant.update({ where: { id: v.id }, data });
        })
      );
    }
  }
}

// Then: const product = await prisma.product.update(...)
```

### Key decisions:

1. **Name regeneration**: Always regenerate name as `"{CatName} — {Texture}"` pattern (same as creation in deliveries/route.ts)
2. **Slug regeneration**: Uses same pattern as creation: `{category}-{origin}-{texture}-{color}-{lengthCm}cm`
3. **Variant prices**: Only update variants where `retailManualOverride === false` (respect manual overrides)
4. **Price formula**: Same as stock-in: `Math.round(costPricePerGram * (10000 + markupPercent * 100) / 10000)`
5. **Piece prices**: Also recalculated for BY_PIECE variants using `pricePerPiece` as the cost base

---

## Edge cases to handle

1. **No variants** — Product has no active variants → skip price recalculation, slug uses shorter pattern
2. **Manual price overrides** — Variants with `retailManualOverride = true` → skip price recalculation
3. **Same category** — Category not actually changed → skip all side effects (compare old vs new)
4. **Missing texture** — If product has no texture, name becomes `"{CatName} — "` → handle gracefully
5. **Slug collision** — New slug might already exist for another product → Prisma will throw unique constraint error, which gets caught and returned as 500. Consider: append a counter suffix or use `upsert` pattern.

---

## Files to modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/api/products/[id]/route.ts` | Add CATEGORY_NAMES, slugify, category-change logic in PUT handler |

**Alternatively**, if CATEGORY_NAMES and slugify should be shared (DRY), extract to a shared lib file:

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/product-naming.ts` | NEW: export CATEGORY_NAMES and slugify |
| 2 | `src/app/api/products/[id]/route.ts` | Import from shared lib + add category-change logic |
| 3 | `src/app/api/deliveries/route.ts` | Import from shared lib (optional cleanup) |

**Recommendation:** Keep it simple — copy to route.ts. Refactoring to shared lib is optional improvement.

---

## Testing

1. Change product category from LUXE → STANDARD:
   - Verify name changes from "Luxe Vlasy — {Texture}" to "Standard Vlasy — {Texture}"
   - Verify nameUk and nameRu also update
   - Verify slug regenerates
   - Verify variant retailPricePerGram recalculates with STANDARD markup
   - Verify variants with `retailManualOverride = true` keep their prices
2. Change category from STANDARD → VIRGIN:
   - Verify retail prices increase (VIRGIN typically has higher markup)
3. Change category to same value (no change):
   - Verify no unnecessary updates
