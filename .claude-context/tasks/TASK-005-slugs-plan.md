# TASK-005: URL slugy misto CUID pro produkty

## Overview

Change product URLs from `/offer/cmqslco8b000dj0ts0bikbbz0` to `/offer/panenske-vlasy-clip-in`. The `slug` field already exists on the Product model (`String? @unique`). Requires: slug generation for existing products, route change from `[id]` to `[slug]`, updating all links, and redirect for old CUID URLs.

## Current State

- **Prisma**: `Product.slug` is `String? @unique` (line 137)
- **Product detail page**: `src/app/(public)/offer/[id]/page.tsx` — queries by `prisma.product.findUnique({ where: { id } })`
- **CreateProductForm**: auto-generates slug from name but **without diacritics stripping** (lines 90-95) — uses `toLowerCase().replace(/[^a-z0-9]+/g, "-")` which strips Czech chars
- **StylistForm**: has proper `slugify()` with NFD normalization (line 12-19)
- **Slug routing reference**: `kadernice/[slug]/page.tsx` — uses `findUnique({ where: { slug } })`
- **API**: `/api/public/products` does NOT serve `slug` field

### All places that build `/offer/{productId}` links:

| File | Line | Pattern |
|------|------|---------|
| `src/app/(public)/offer/ProductsShowcase.tsx` | 442, 496 | `href={/offer/${p.id}}` |
| `src/components/public/HeroProductSlider.tsx` | 100 | `href={/offer/${product.id}}` |
| `src/app/sitemap.ts` | 70 | `url: ${BASE_URL}/offer/${product.id}` |
| `src/app/(public)/offer/[id]/page.tsx` | 103, 218 | canonical + JSON-LD |
| `src/components/inventory/StockInForm.tsx` | 125 | QR code URL |
| `src/lib/social-post-generator.ts` | 56 | `buildProductUrl(productId)` |

## Implementation Plan

### Step 1: Extract shared slugify utility
**New file:** `src/lib/slugify.ts`

Extract the slugify function from StylistForm into a shared utility so both products and stylists use the same logic.

```typescript
/**
 * Convert text to URL-safe slug.
 * Handles Czech/Ukrainian diacritics via NFD normalization.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")      // non-alphanumeric to hyphens
    .replace(/^-+|-+$/g, "");          // trim leading/trailing hyphens
}
```

**Lines:** ~10

---

### Step 2: Create migration script for existing products
**New file:** `scripts/generate-product-slugs.ts`

A one-time script to generate slugs for all existing products that don't have one.

```typescript
import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  for (const product of products) {
    let slug = slugify(product.name);
    
    // Ensure uniqueness
    let suffix = 0;
    let candidate = slug;
    while (await prisma.product.findUnique({ where: { slug: candidate } })) {
      suffix++;
      candidate = `${slug}-${suffix}`;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { slug: candidate },
    });
    console.log(`${product.name} -> ${candidate}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

**Run:** `npx tsx scripts/generate-product-slugs.ts`

**Lines:** ~30

---

### Step 3: Rename route folder from `[id]` to `[slug]`
**Action:** Rename `src/app/(public)/offer/[id]/` -> `src/app/(public)/offer/[slug]/`

All files inside move with it:
- `page.tsx`
- `PhotoGallery.tsx`
- `WriteReviewForm.tsx`
- `ProductReviews.tsx`
- `ColorCircles.tsx`
- `AddToInquiryForm.tsx`

---

### Step 4: Update product detail page to query by slug (with CUID fallback)
**File:** `src/app/(public)/offer/[slug]/page.tsx` (renamed from `[id]`)

**Change the `getProduct` function and param type:**

**Before:**
```typescript
type Props = { params: Promise<{ id: string }> };

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    ...
  });
```

**After:**
```typescript
type Props = { params: Promise<{ slug: string }> };

async function getProduct(slugOrId: string) {
  // Try slug first, fall back to CUID for backwards compatibility
  let product = await prisma.product.findUnique({
    where: { slug: slugOrId },
    ...
  });
  
  if (!product) {
    // Fallback: try as CUID id for old URLs
    product = await prisma.product.findUnique({
      where: { id: slugOrId },
      ...
    });
    // If found by ID and has slug, redirect to slug URL
    if (product?.slug) {
      redirect(`/offer/${product.slug}`);
    }
  }
```

**Also update all param references:**
- `generateMetadata`: `const { slug } = await params;` then call `getProduct(slug)`
- `ProductDetailPage`: `const { slug } = await params;` then call `getProduct(slug)`
- `canonical`: use `slug` instead of `id`: `alternates: { canonical: \`/offer/${product.slug ?? slug}\` }`
- JSON-LD `url`: use `product.slug`

**Important:** Import `redirect` from `next/navigation` (already imported).

**Lines changed:** ~20

---

### Step 5: Add slug to public products API response
**File:** `src/app/api/public/products/route.ts`

**Change 1 — Add `slug` to the Prisma select (line 46):**
```typescript
select: {
  id: true,
  slug: true,   // <-- ADD
  name: true,
  ...
```

**Change 2 — Include slug in the response mapping (line 89):**
```typescript
return {
  id: p.id,
  slug: p.slug,   // <-- ADD
  name: p.name,
  ...
```

**Lines changed:** 2

---

### Step 6: Update ProductsShowcase to use slug in links
**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

**Change 1 — Add `slug` to `PublicProduct` interface (line 20):**
```typescript
interface PublicProduct {
  id: string;
  slug: string | null;   // <-- ADD
  name: string;
  ...
```

**Change 2 — Update links (lines 442, 496):**

**Before:**
```tsx
<Link href={`/offer/${p.id}`}>
```

**After:**
```tsx
<Link href={`/offer/${p.slug ?? p.id}`}>
```

**Lines changed:** 4

---

### Step 7: Update HeroProductSlider to use slug
**File:** `src/components/public/HeroProductSlider.tsx`

**Change 1 — Add `slug` to `SliderProduct` interface (after line 17):**
```typescript
interface SliderProduct {
  id: string;
  slug: string | null;   // <-- ADD
  ...
```

**Change 2 — Update link (line 100):**
```tsx
href={`/offer/${product.slug ?? product.id}`}
```

**Lines changed:** 2

---

### Step 8: Update sitemap
**File:** `src/app/sitemap.ts`

**Change 1 — Add `slug` to Prisma select (line 66):**
```typescript
select: { id: true, slug: true, updatedAt: true },
```

**Change 2 — Use slug in URL (line 70):**
```typescript
url: `${BASE_URL}/offer/${product.slug ?? product.id}`,
```

**Lines changed:** 2

---

### Step 9: Update social-post-generator
**File:** `src/lib/social-post-generator.ts`

**Change the `buildProductUrl` function (line 55-57):**

The function currently takes `productId`. It should take the product object or accept slug.

**Before:**
```typescript
function buildProductUrl(productId: string): string {
  return `https://www.hairland.cz/offer/${productId}`;
}
```

**After:**
```typescript
function buildProductUrl(product: { id: string; slug?: string | null }): string {
  return `https://www.hairland.cz/offer/${product.slug ?? product.id}`;
}
```

Update the caller to pass the product object instead of just `product.id`.

**Lines changed:** ~4

---

### Step 10: Update StockInForm QR code URL
**File:** `src/components/inventory/StockInForm.tsx`

The QR code URL (line 125) currently uses `result.productId`. The deliveries API response should also include `productSlug` (already added in Task #3 plan).

**Change:**
```typescript
const productUrl = `${window.location.origin}/offer/${result.productSlug ?? result.productId}`;
```

**Lines changed:** 1

---

### Step 11: Fix CreateProductForm slugify
**File:** `src/app/(app)/products/new/CreateProductForm.tsx`

**Change — Import shared slugify and use it (lines 90-95):**

**Add import:**
```typescript
import { slugify } from "@/lib/slugify";
```

**Replace slug generation (lines 90-95):**
```typescript
slug: (form.get("slug") as string) || slugify(form.get("name") as string) || undefined,
```

**Lines changed:** ~3

---

### Step 12: Update StylistForm to use shared slugify
**File:** `src/app/(app)/stylists/StylistForm.tsx`

**Remove inline `slugify` function (lines 12-19) and import shared one:**

```typescript
import { slugify } from "@/lib/slugify";
```

**Lines changed:** -8 (remove), +1 (import)

---

### Step 13: Update product detail page canonical and JSON-LD
**File:** `src/app/(public)/offer/[slug]/page.tsx`

Already covered in Step 4. Key changes:
- `alternates: { canonical: \`/offer/${product.slug}\` }` (line 103)
- `url: \`https://www.hairland.cz/offer/${product.slug}\`` (line 218)

---

## Summary

| # | File | What | Lines | Type |
|---|------|------|-------|------|
| 1 | `src/lib/slugify.ts` | Shared slugify utility | ~10 | NEW |
| 2 | `scripts/generate-product-slugs.ts` | One-time migration script | ~30 | NEW |
| 3 | `src/app/(public)/offer/[id]/` -> `[slug]/` | Rename folder | 0 | RENAME |
| 4 | `src/app/(public)/offer/[slug]/page.tsx` | Query by slug with CUID fallback + redirect | ~20 | EDIT |
| 5 | `src/app/api/public/products/route.ts` | Add slug to response | 2 | EDIT |
| 6 | `src/app/(public)/offer/ProductsShowcase.tsx` | Use slug in links | 4 | EDIT |
| 7 | `src/components/public/HeroProductSlider.tsx` | Use slug in links | 2 | EDIT |
| 8 | `src/app/sitemap.ts` | Use slug in URLs | 2 | EDIT |
| 9 | `src/lib/social-post-generator.ts` | Use slug in product URL | ~4 | EDIT |
| 10 | `src/components/inventory/StockInForm.tsx` | Use slug in QR URL | 1 | EDIT |
| 11 | `src/app/(app)/products/new/CreateProductForm.tsx` | Use shared slugify | ~3 | EDIT |
| 12 | `src/app/(app)/stylists/StylistForm.tsx` | Use shared slugify | -7 | EDIT |

**Total files:** 12 (2 new, 1 rename, 9 edits)
**Total lines:** ~80
**Risk:** MEDIUM — URL change affects SEO, needs CUID fallback + redirect to preserve old links

## Critical Design Decisions

1. **CUID fallback with redirect**: The product detail page tries `slug` first, then falls back to `id` lookup. If found by ID and slug exists, issues 301 redirect to slug URL. This preserves all existing links, QR codes, bookmarks, and Google index.

2. **`slug ?? id` pattern**: All link-building code uses `product.slug ?? product.id` as fallback. If a product somehow has no slug, it still works with the CUID.

3. **NFD diacritics stripping**: Uses `normalize("NFD").replace(/[\u0300-\u036f]/g, "")` so "Panenské vlasy" becomes "panenske-vlasy" instead of "pnsk-vlsy".

4. **Slug uniqueness**: Migration script checks for conflicts and appends `-1`, `-2` etc. The Prisma `@unique` constraint is the ultimate guard.

## Execution Order

**IMPORTANT:** Must run in this order:
1. Steps 1-2: Create slugify utility + migration script
2. Step 2 (run): Execute migration script to populate slugs in DB
3. Steps 3-13: All code changes (can be done in parallel)
4. Deploy

**Do NOT rename the folder (Step 3) before slugs exist in DB** — this would break all product pages.

## Testing

1. Run migration script — verify all products get slugs, no duplicates
2. Visit `/offer/panenske-vlasy-clip-in` — should render product page
3. Visit `/offer/cmqslco8b000dj0ts0bikbbz0` (old CUID) — should 301 redirect to slug URL
4. Check sitemap.xml — should show slug URLs
5. Check `/offer` page — product links should use slugs
6. Check homepage slider — product links should use slugs
7. Create new product in admin — verify slug auto-generated with diacritics handled
8. Check social post generator — verify product URL uses slug
9. Stock-in + QR code — verify QR points to slug URL
10. Google Search Console — monitor for 404s (should be zero with redirect)
