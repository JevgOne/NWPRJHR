# TASK-005: URL slugy misto CUID pro produkty — Implementation

## Status: DONE

## Changes Implemented (13 steps from plan)

### Step 1: Shared slugify utility
**New file:** `src/lib/slugify.ts`
- NFD normalization for Czech/Ukrainian diacritics
- Lowercase, strip diacritics, replace non-alphanumeric with hyphens

### Step 2: Migration script
**New file:** `scripts/generate-product-slugs.ts`
- Generates slugs for all products without one
- Includes processingType in slug for uniqueness (e.g., "panenske-vlasy-clip-in")
- Handles uniqueness conflicts with `-1`, `-2` suffixes

### Step 3: Route folder rename
- `src/app/(public)/offer/[id]/` -> `src/app/(public)/offer/[slug]/`

### Step 4: Product detail page slug query + CUID fallback
**File:** `src/app/(public)/offer/[slug]/page.tsx`
- Params type changed from `{ id: string }` to `{ slug: string }`
- `getProduct()` tries slug first, falls back to CUID id lookup
- If found by ID and has slug, issues `redirect()` to slug URL (301)
- Canonical URL and JSON-LD use `product.slug ?? slug`
- Extracted `productSelect` const to avoid duplication between the two queries

### Step 5: Public products API
**File:** `src/app/api/public/products/route.ts`
- Added `slug` to Prisma select and response mapping

### Step 6: ProductsShowcase links
**File:** `src/app/(public)/offer/ProductsShowcase.tsx`
- Added `slug` to PublicProduct interface
- Both Link hrefs use `p.slug ?? p.id`

### Step 7: HeroProductSlider links
**File:** `src/components/public/HeroProductSlider.tsx`
- Added `slug` to SliderProduct interface
- Link href uses `product.slug ?? product.id`

### Step 8: Sitemap
**File:** `src/app/sitemap.ts`
- Added `slug` to Prisma select
- URL uses `product.slug ?? product.id`

### Step 9: Social post generator
**File:** `src/lib/social-post-generator.ts`
- Added `slug` to PostProductData interface
- `buildProductUrl()` now takes product object, uses `product.slug ?? product.id`

### Step 10: StockInForm QR code URL
**Files:** `src/app/api/deliveries/route.ts`, `src/components/inventory/StockInForm.tsx`
- Deliveries API now returns `productSlug`
- QR URL uses `result.productSlug ?? result.productId`

### Step 11: CreateProductForm slugify
**File:** `src/app/(app)/products/new/CreateProductForm.tsx`
- Replaced inline slug generation with shared `slugify()` import
- Now handles Czech diacritics properly

### Step 12: StylistForm shared slugify
**File:** `src/app/(app)/stylists/StylistForm.tsx`
- Removed inline `slugify()` function (8 lines)
- Added import from `@/lib/slugify`

### Step 13: SocialPostModal + ProductDetailClient
**Files:** `src/components/products/SocialPostModal.tsx`, `src/app/(app)/products/[id]/ProductDetailClient.tsx`
- Added `slug` to product interfaces so social post links use slug URL

## Files Changed

| File | Type |
|------|------|
| `src/lib/slugify.ts` | NEW |
| `scripts/generate-product-slugs.ts` | NEW |
| `src/app/(public)/offer/[id]/` -> `[slug]/` | RENAME |
| `src/app/(public)/offer/[slug]/page.tsx` | EDIT |
| `src/app/api/public/products/route.ts` | EDIT |
| `src/app/(public)/offer/ProductsShowcase.tsx` | EDIT |
| `src/components/public/HeroProductSlider.tsx` | EDIT |
| `src/app/sitemap.ts` | EDIT |
| `src/lib/social-post-generator.ts` | EDIT |
| `src/app/api/deliveries/route.ts` | EDIT |
| `src/components/inventory/StockInForm.tsx` | EDIT |
| `src/app/(app)/products/new/CreateProductForm.tsx` | EDIT |
| `src/app/(app)/stylists/StylistForm.tsx` | EDIT |
| `src/components/products/SocialPostModal.tsx` | EDIT |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | EDIT |

## Verification

- `npx tsc --noEmit` — passes with zero errors (after clearing stale `.next/types` cache from old `[id]` path)

## Action Required Before Deploy

Run the migration script to populate slugs for existing products:
```
npx tsx scripts/generate-product-slugs.ts
```
This MUST be done before deploying the code changes.
