# TASK-023: Fix Salon Catalog — Implementation Plan

## Problem Summary

The salon portal catalog (`/salon/catalog`) is a bare table with multiple issues:
1. **Color shown as number** ("30cm, 10") instead of name ("30cm, Černá")
2. **Column header is "-"** instead of a meaningful label ("Varianta")
3. **Duplicate product groups** — two "Panenské vlasy" blocks (likely different products with same name, or API returning duplicates)
4. **No product photos** — API returns `photos` field but client ignores it
5. **No description, no category badge** — API returns `category` and `processingType` but client ignores them
6. **Ugly bare table** — needs redesign as professional B2B catalog

---

## Root Cause Analysis

### Current State: `CatalogClient.tsx` (114 lines)

The client receives this data from the API:
```typescript
interface CatalogProduct {
  id: string;
  name: string;
  nameUk?: string;
  nameRu?: string;
  category: string;        // ← NOT USED in display
  variants: CatalogVariant[];
}
// Missing from interface (but API returns them):
// - photos: string (JSON array as string)
// - processingType: string
```

**Issue 1 — Color as number**: Line 94 renders `{v.lengthCm}cm, {v.color}` where `v.color` is the raw color code ("1", "2", ..., "10"). Should use `getHairColor(v.color).nameKey` with i18n translation `t("colors.cX")`.

**Issue 2 — Header "-"**: Line 85 has `<th>-</th>` as the first column header. Should be "Varianta" or similar.

**Issue 3 — Duplicate products**: The API (`/api/salon-portal/catalog`) queries `prisma.product.findMany({ where: { archived: false } })`. If there are two non-archived products both named "Panenské vlasy", they'll appear as separate cards. This is likely a **data issue** (duplicate products in DB) or **products with same display name but different processingType** (e.g., Clip-in vs Tape-in "Panenské vlasy"). The fix is to show the `processingType` alongside the product name to differentiate.

**Issue 4 — No photos**: API returns `photos` (raw JSON string from Prisma) but:
- Client interface doesn't include `photos` field
- Client doesn't render any images
- API should parse `JSON.parse(photos)` like the public API does

**Issue 5 — No category/processingType display**: API returns these but client doesn't use them.

---

## Implementation Plan

### FILE 1: API — `src/app/api/salon-portal/catalog/route.ts`

**Change**: Parse photos JSON before returning.

Line 85, change:
```typescript
photos: product.photos,
```
To:
```typescript
photos: JSON.parse(product.photos || "[]") as string[],
```

Also include `description`, `descriptionUk`, `descriptionRu`, `origin`, `texture` in the response (already available from Prisma query, just not returned):

```typescript
return {
  id: product.id,
  name: product.name,
  nameUk: product.nameUk,
  nameRu: product.nameRu,
  description: product.description,
  descriptionUk: product.descriptionUk,
  descriptionRu: product.descriptionRu,
  category: product.category,
  processingType: product.processingType,
  origin: product.origin,
  texture: product.texture,
  photos: JSON.parse(product.photos || "[]") as string[],
  variants,
};
```

**Note**: The Prisma query at line 34 already fetches the full product model — `description`, `origin`, `texture` etc. are already in `product` object, just not included in the return value.

### FILE 2: Client — `src/app/(salon)/salon/catalog/CatalogClient.tsx`

**Full redesign** — transform from bare table to professional B2B catalog card layout.

#### 2a. Update TypeScript interfaces

Add missing fields from API:
```typescript
interface CatalogProduct {
  id: string;
  name: string;
  nameUk?: string;
  nameRu?: string;
  description?: string;
  descriptionUk?: string;
  descriptionRu?: string;
  category: string;
  processingType: string;
  origin?: string;
  texture?: string;
  photos: string[];
  variants: CatalogVariant[];
}
```

#### 2b. Add imports

```typescript
import { getHairColor } from "@/lib/hair-colors";
```

#### 2c. Add color name helper

Use `useTranslations("public")` to access color name translations (they live under `public.colors.c1`, `public.colors.c2`, etc.):
```typescript
const tPublic = useTranslations("public");
const colorName = (nameKey: string) => {
  try { return tPublic(`colors.${nameKey}`); } catch { return nameKey; }
};
```

#### 2d. Redesign product cards

Each product card should include:

1. **Product photo** (first from `photos[]` array, or placeholder SVG)
2. **Product name** + **processingType badge** (to differentiate "Panenské vlasy Clip-in" from "Panenské vlasy Tape-in")
3. **Category badge** (VIRGIN/PREMIUM/STANDARD/SALE with brand colors)
4. **Color swatch circles** (using `/swatches/color-{code}.png` images like ProductsShowcase does)
5. **Variant table** with:
   - Header: "Délka" | "Barva" | "Cena/g" | "Dostupnost" (not "-")
   - Color swatch circle + translated name (e.g., `🟤 Černá`) instead of raw number "10"
   - Stock indicator (green/red)
   - B2B price with discount applied

**Proposed layout** (card-based, not full-page table):

```
┌─────────────────────────────────────────────────────┐
│ [Photo]  Product Name                    [VIRGIN]   │
│          Clip-in · Slavic                           │
│          ○○○○●●●  (color swatches)                  │
│                                                     │
│  Délka   Barva              Cena/g    Dostupnost    │
│  ─────────────────────────────────────────────────  │
│  30 cm   ● Platinová        12,50 Kč   250g ✓      │
│  30 cm   ●● Světlá blond    12,50 Kč   Vyprodáno   │
│  40 cm   ● Platinová        14,00 Kč   180g ✓      │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

#### 2e. Category badge colors

Follow the same pattern as dashboard/ProductsShowcase:
```typescript
const categoryBadgeColors: Record<string, string> = {
  VIRGIN: "bg-amber-100 text-amber-800",
  PREMIUM: "bg-indigo-100 text-indigo-800",
  STANDARD: "bg-emerald-100 text-emerald-800",
  SALE: "bg-rose-100 text-rose-800",
};
```

Category labels from `useTranslations("category")`:
- `t("virgin")` → "Panenské vlasy"
- `t("premium")` → "Premium"
- etc.

#### 2f. Processing type labels

Map the enum values to Czech labels:
```typescript
const processingLabels: Record<string, string> = {
  CLIP_IN: "Clip-in",
  TAPE_IN: "Tape-in",
  KERATIN: "Keratín",
  WEFT: "Tresa",
  MICRO_RING: "Micro ring",
  OTHER: "Ostatní",
};
```

Or use i18n if translations exist (check first).

#### 2g. Fix duplicate product names

The product name + processingType together should be unique. Display as:
```
Panenské vlasy · Clip-in
```

This distinguishes "Panenské vlasy Clip-in" from "Panenské vlasy Tape-in" even if both products exist with the same `name` field.

---

## i18n Translations Needed

The `salonPortal` namespace in `messages/{cs,uk,ru}.json` needs additional keys:

```json
{
  "salonPortal": {
    "variant": "Varianta",
    "length": "Délka",
    "color": "Barva",
    "pricePerGram": "CZK/g",    // already exists
    "available": "Dostupné",     // already exists
    "outOfStock": "Vyprodáno",   // already exists
    "noProducts": "Žádné produkty" // already exists
  }
}
```

**Color name translations already exist** under `public.colors.c1` through `public.colors.c10` + `public.colors.other` in all 3 locales (cs, uk, ru).

---

## Files to Modify

| # | File | Changes | Lines |
|---|------|---------|-------|
| 1 | `src/app/api/salon-portal/catalog/route.ts` | Parse `photos` JSON, add description/origin/texture to response | ~5 lines |
| 2 | `src/app/(salon)/salon/catalog/CatalogClient.tsx` | Full redesign: update interface, add photo display, color name resolution, category/processingType badges, proper table headers, color swatch circles | ~100+ lines (rewrite) |
| 3 | `messages/cs.json` | Add missing salonPortal keys if needed | ~3 lines |
| 4 | `messages/uk.json` | Same | ~3 lines |
| 5 | `messages/ru.json` | Same | ~3 lines |

---

## Data Verification Needed

Before implementing, the implementor should verify:

1. **Duplicate "Panenské vlasy"**: Query the DB or API to check if there are actually two distinct products with the same `name` but different `processingType`. If same `processingType` too, it's a data bug that needs a DB fix (merge/archive one).

2. **Photos exist**: Check if products actually have photos uploaded (non-empty `photos` JSON). If all products have `"[]"`, the placeholder SVG will show for everything — which is still better than no image at all.

3. **Color swatch images**: Verify `/public/swatches/color-{1..10}.png` exist — **confirmed, all 10 exist**.

---

## Design Reference

Follow the public ProductsShowcase (`src/app/(public)/offer/ProductsShowcase.tsx`) as the design reference for:
- Color swatch circles with tooltip: lines 516-535
- Category badge styling: lines 452-458
- Photo with placeholder: lines 440-450
- Price display: lines 538+
- Origin/texture badges: lines 464-489

The salon catalog should feel like a professional, simplified version of the public showcase — same visual quality but optimized for B2B ordering (table layout for variants, wholesale prices, stock quantities).
