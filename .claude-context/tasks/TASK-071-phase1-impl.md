# TASK-071 Phase 1 Implementation

**Commit:** d0a82be
**Date:** 2026-07-14

## 1.1 Cache related products query

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

- Added `getCachedRelatedCandidates()` function using `unstable_cache` with:
  - Cache key: `["related-product-candidates"]`
  - Revalidate: 120s
  - Tags: `["products"]`
- Replaced inline `prisma.product.findMany()` in IIFE with cached version
- Eliminates 1-3 uncached DB roundtrips per product detail page view

## 1.2 B2B settings in-memory cache

**New file:** `src/lib/b2b-pricing.ts`

- `getCachedB2BSettings()` — returns `{ hairdresserDiscountPct, salonDiscountPct }` with 5min TTL
- `invalidateB2BCache()` — clears cache on settings update

**Updated callers (5 files):**
- `src/app/[locale]/(public)/offer/[...slug]/page.tsx:314` — product detail
- `src/app/[locale]/(public)/offer/page.tsx:96` — products list
- `src/app/[locale]/(public)/offer/[...slug]/CategoryPage.tsx:160` — category page
- `src/app/[locale]/(public)/offer/[...slug]/AttributeLandingPage.tsx:171` — attribute page
- `src/app/api/salon-portal/catalog/route.ts:25` — salon catalog API

**Cache invalidation:**
- `src/app/api/b2b-settings/route.ts` PUT handler — calls `invalidateB2BCache()` after upsert

## Notes
- Removed unused `prisma` import from `offer/page.tsx`
- TypeScript compiles with 0 errors
- Pattern follows existing `src/lib/loyalty.ts` cache pattern
