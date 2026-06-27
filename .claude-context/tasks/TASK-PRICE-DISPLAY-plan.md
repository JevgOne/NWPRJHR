# Task #10: Fix Price Display -- No "od" Prices, Must Be Exact

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

Product cards use `Math.min()` across variants to show the lowest price, which is effectively an "od" (from) price. User explicitly said: "ceny nesmi byt OD ale presne!!"

---

## Analysis

### How prices work in this system

Each **Variant** = a specific combination of `product + lengthCm + color`, with its own `retailPricePerGram`.

A **Product** has multiple variants (e.g., "Ukrainian Virgin Clip-in" in lengths 40cm, 50cm, 60cm and colors 1-10). Each variant may have a different price.

The current code (`Math.min(...)`) shows the cheapest variant's price.

### The options

1. **Show price range (X-Y Kc/g):** Accurate but complex -- user said "exact", not "range"
2. **Show nothing if variants have different prices:** Bad UX
3. **Show price per variant (on detail page only):** The product card is just a summary -- showing per-variant prices isn't feasible in a small card
4. **Show a single price if all variants are the same, or a range if they differ:** Most honest approach

### Recommended approach

Since the user wants "exact" prices and NOT "od" prices:

- If all variants of a product have the SAME `retailPricePerGram` -> show that price (it IS exact)
- If variants have DIFFERENT prices -> show as a range: "X - Y Kc/g"
- This avoids the misleading "od" (from) framing while being truthful

Alternatively, if the user truly means a single number, the most common approach is the **median or most-common price**, but a range is more honest.

---

## Implementation Steps

### Step 1: Fix HeroProductSlider.tsx

**File:** `src/components/public/HeroProductSlider.tsx`

Lines 58-59 -- change from:
```tsx
const minPrice = Math.min(...product.variants.map((v) => v.retailPricePerGram));
const pricePerGram = minPrice > 0 ? (minPrice / 100).toFixed(0) : null;
```

To:
```tsx
const prices = product.variants.map((v) => v.retailPricePerGram).filter((p) => p > 0);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const priceDisplay = prices.length === 0
  ? null
  : minPrice === maxPrice
    ? `${(minPrice / 100).toFixed(0)}`
    : `${(minPrice / 100).toFixed(0)}-${(maxPrice / 100).toFixed(0)}`;
```

And update the price display (lines 128-132):
```tsx
{priceDisplay && (
  <div className="text-sm font-bold text-ink">
    {priceDisplay} Kč<span className="text-[10px] font-normal text-muted">/g</span>
  </div>
)}
```

### Step 2: Fix ProductsShowcase.tsx

**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

Lines 417-418 -- same change:
```tsx
const prices = p.variants.map((v) => v.retailPricePerGram).filter((pr) => pr > 0);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const priceDisplay = prices.length === 0
  ? null
  : minPrice === maxPrice
    ? `${(minPrice / 100).toFixed(0)}`
    : `${(minPrice / 100).toFixed(0)}-${(maxPrice / 100).toFixed(0)}`;
```

And update lines 526-529:
```tsx
{priceDisplay && (
  <div className="text-sm font-bold text-ink">
    {priceDisplay} Kč<span className="text-[10px] font-normal text-muted">/g</span>
  </div>
)}
```

---

## Important: Check if prices actually vary across variants

Before implementing, it's worth checking whether `retailPricePerGram` actually varies between variants of the same product. If all variants always have the same price (because price is set per-gram, not per-length), then `minPrice === maxPrice` and the current display is effectively correct -- just misleadingly named with `Math.min`.

In that case, the fix is simply removing the perception of "od" by not using `Math.min` in a misleading way, and the visual output stays the same.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/public/HeroProductSlider.tsx` | Lines 58-59, 128-132: price range display |
| `src/app/(public)/offer/ProductsShowcase.tsx` | Lines 417-418, 526-529: price range display |

## Dependencies

None.

## Risk

- LOW: purely display logic change
- If prices across variants differ significantly, the range might look odd on small cards (e.g., "150-350 Kc/g") but it's honest
