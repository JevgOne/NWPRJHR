# TASK-094: SEO Product Page — Implementation Plan

**Status:** Done (implemented)
**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

---

## Fix 1: Availability — real stock check (lines 660-669)

**Problem:** Schema always showed `InStock` regardless of actual inventory.

**Fix:** Check `pickerVariants` for real stock:
```typescript
const hasStock = pickerVariants.some(v => v.availableGrams > 0 || v.availablePieces > 0);
const hasPreOrder = pickerVariants.some(v => v.availableToOrder);
const schemaAvailability = product.archived
  ? "https://schema.org/Discontinued"
  : hasStock
    ? "https://schema.org/InStock"
    : hasPreOrder
      ? "https://schema.org/PreOrder"
      : "https://schema.org/OutOfStock";
```

## Fix 2: itemCondition (line 708)

**Problem:** Missing `itemCondition` in Offer schema — Google requires it.

**Fix:** Added `itemCondition: "https://schema.org/NewCondition"` to the Offer object.

## Fix 3: og:type product meta tags (lines 367-375)

**Problem:** Next.js `OpenGraphType` doesn't support `"product"`. No product-specific OG tags.

**Fix:** Keep `type: "website"` (Next.js limitation), add product meta via `other`:
```typescript
other: {
  ...(minPrice && {
    "product:price:amount": (minPrice / 100).toFixed(2),
    "product:price:currency": "CZK",
  }),
  "product:availability": product.archived ? "oos" : "instock",
  "product:brand": "Hairland",
  "product:condition": "new",
},
```

## Fix 4: Review fallback — product-only in schema (lines 33-70)

**Problem:** Site-wide reviews were used as fallback in Product JSON-LD schema, making it look like the product had reviews when it didn't.

**Fix:** Separated into two data paths:
- `productStats` / `schemaReviews` — product-specific only, used in JSON-LD (no fallback)
- `stats` / `reviews` — falls back to site-wide, used for display only

Usage on line 561: `const { productStats: reviewStats, schemaReviews: reviewsForSchema } = ...`

## Fix 5: Meta title with processing type (lines 313-321)

**Problem:** Title was just `"{name} {lengths}"` — missing processing type (clip-in, tape-in).

**Fix:** Added `procLabel` from `PROCESSING_LABELS[locale]`:
```typescript
const procLabel = PROCESSING_LABELS[locale]?.[product.processingType] ?? "";
const baseTitle = [product.name, procLabel, lengthStr].filter(Boolean).join(" ");
```
Result: "Luxusní vlasy Clip-in 45cm, 55cm" instead of just "Luxusní vlasy 45cm, 55cm".

## Fix 6: priceValidUntil (line 709)

**Problem:** Missing `priceValidUntil` in Offer — Google recommends it.

**Fix:** `priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]`

Rolling 30-day validity window.

## Fix 7: color top-level field (lines 677-695)

**Problem:** Color only in `additionalProperty`, not as top-level Product field.

**Fix:** Resolve translated color name from focused/first variant:
```typescript
const schemaColor = (() => {
  const v = focusedVariant ?? (product.variants.length > 0 ? product.variants[0] : null);
  if (!v) return product.colorTone ?? undefined;
  const key = getHairColor(v.color).nameKey;
  try { return t(`colors.${key}`); } catch { return key; }
})();
// ...
...(schemaColor && { color: schemaColor }),
```

## Fix 8: SKU/MPN multi-variant (lines 671-675)

**Problem:** SKU was always first variant, ignoring URL-focused variant. No `mpn` field.

**Fix:** Use `focusedVariant` (from URL search params) when available:
```typescript
const skuVariant = focusedVariant ?? (product.variants.length > 0 ? product.variants[0] : null);
const productSku = skuVariant
  ? generateSku(product.category, product.texture, skuVariant.color, skuVariant.lengthCm)
  : product.id;
// Used as both sku and mpn
```
