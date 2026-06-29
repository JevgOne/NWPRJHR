# TASK-006: Bio popisky produktu pro web — Implementation

## Status: DONE

## Changes Implemented

### Step 1: Product bio generator utility
**New file:** `src/lib/product-bio.ts`
- `generateProductBio()` — full description combining category quality, processing type, texture, origin, lengths, color count
- `generateProductBioShort()` — one-liner tagline for product cards (e.g., "Panenske clip-in vlasy | rovne | Ukrajina | 40-60 cm")
- Czech text templates for all categories, processing types, and textures

### Step 2: Product detail page — auto bio fallback
**File:** `src/app/(public)/offer/[slug]/page.tsx`
- Replaced generic `catDesc` fallback with `generateProductBio()` output
- `const description = localizedDesc || autoBio` — manual descriptions still take priority

### Step 3: Product cards — short bio tagline
**File:** `src/app/(public)/offer/ProductsShowcase.tsx`
- Added `<p>` with `generateProductBioShort()` output under product name on each card
- Compact `text-[10px]` with `line-clamp-1`

### Step 4: SEO meta description
**File:** `src/app/(public)/offer/[slug]/page.tsx`
- Replaced template-based meta description with `generateProductBio()` output
- Truncated to 155 chars + " | Hairland" suffix for SEO best practice

### Step 5: Admin "Generate bio" button
**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`
- Added "Vygenerovat popis" button shown when product has no description and user is OWNER
- Clicking generates bio via `generateProductBio()` and saves to `description` field via PUT API
- Owner can then manually edit the saved text

### Step 6: Translation keys
**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`
- Added `product.generateBio` key in all 3 languages

## Files Changed

| File | Type |
|------|------|
| `src/lib/product-bio.ts` | NEW |
| `src/app/(public)/offer/[slug]/page.tsx` | EDIT |
| `src/app/(public)/offer/ProductsShowcase.tsx` | EDIT |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | EDIT |
| `messages/cs.json` | EDIT |
| `messages/uk.json` | EDIT |
| `messages/ru.json` | EDIT |

## Verification

- `npx tsc --noEmit` — passes with zero errors
