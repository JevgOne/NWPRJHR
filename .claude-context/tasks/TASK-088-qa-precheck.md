# QA Pre-check: TASK-088 — Category change must update product name/slug/variant prices

**Status:** Pre-implementation code analysis (no impl file yet)
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## Current State Analysis

### PUT /api/products/[id] (route.ts:28–60)

```ts
const parsed = updateProductSchema.safeParse(body);
const product = await prisma.product.update({
  where: { id },
  data: parsed.data,  // saves only what was sent, no derived fields
});
```

The current PUT handler is a "raw update" — it saves exactly what the client sends. When `category` changes, it only updates `category` in DB. It does NOT:
- ❌ Regenerate product name (still "Luxe Vlasy" after changing to STANDARD)
- ❌ Regenerate slug (still contains old category slug)
- ❌ Recalculate variant `retailPricePerGram` based on new category markup

### Required data for the fix

**CATEGORY_NAMES map** — exists in `deliveries/route.ts:60–65`:
```ts
const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};
```

**slugify function** — exists in `deliveries/route.ts:67–72`:
```ts
function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

**priceSettings** — exists in `prisma.priceSettings` (queried in deliveries/route.ts:102)
- `markupPercent` determines retailPrice = costPrice * (10000 + markupPercent*100) / 10000

---

## Implementation Plan for TASK-088

The fix must go into `src/app/api/products/[id]/route.ts` PUT handler.

When `parsed.data.category` is present AND differs from current product category:

1. Fetch current product (need: `name`, `texture`, `category`, `slug`, `variants`)
2. Fetch new category's `priceSettings.markupPercent`
3. Regenerate name:
   - `name = "${CATEGORY_NAMES[newCategory].cs} — ${texture}"`
   - `nameUk = "${CATEGORY_NAMES[newCategory].uk} — ${texture}"`
   - `nameRu = "${CATEGORY_NAMES[newCategory].ru} — ${texture}"`
4. Regenerate slug: `slugify("${newCategory}-${origin}-${texture}-${existingColor}-${existingLength}cm")`
   - Or simpler: replace old category prefix in slug
5. Recalculate variant prices: for each active variant, recompute `retailPricePerGram` using new markup

### Potential slug regeneration issue

The slug is currently: `${category}-${origin}-${texture}-${color}-${length}cm` (from deliveries/route.ts:118).
But a product can have MULTIPLE variants with different colors/lengths — the slug is product-level, not per-variant.

**Recommendation:** Only replace the category part of the slug, not regenerate from a specific variant. Or just re-run slugify on `${newCategory}-${origin}-${texture}` (dropping color/length which vary per variant).

### Variant price recalculation concern

`retailPricePerGram` = `costPricePerGram * (10000 + markupPercent*100) / 10000` (deliveries/route.ts:143)

But variants may have `retailManualOverride = true` — those should NOT be recalculated automatically.

**Must check `retailManualOverride` flag before updating prices.**

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/products/[id]/route.ts` | PUT handler: detect category change, regenerate name/slug, update variant prices |

**Reference files (read-only):**
- `src/app/api/deliveries/route.ts` — CATEGORY_NAMES, slugify, price formula
- `src/lib/validations/product.ts` — updateProductSchema (already allows category, slug, name changes)

---

## Summary

The bug is real and straightforward. Current PUT handler does a raw DB update with no derived field logic. Fix requires:
1. Detecting category change in PUT handler
2. Fetching current product + new priceSettings in parallel
3. Computing new name, nameUk, nameRu, slug
4. Updating variants (skip `retailManualOverride = true` ones)

No schema changes needed. All data is already available.
