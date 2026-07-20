# TASK-071 Phase 3 Implementation

**Commit:** 7f8422f
**Date:** 2026-07-14

## 3.1 Related products Suspense component

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

- Extracted inline async IIFE into `RelatedProducts` async server component
- Wrapped in `<Suspense>` with skeleton fallback
- Component receives minimal props: productId, category, origin, texture, colorTone
- Calls `getTranslations("public")` internally for i18n
- Uses existing `getCachedRelatedCandidates()` (from Phase 1) + `getAllStockNumbers()`
- Main product detail now renders immediately; related products stream in

## 3.2 Composite index on Sale

**File:** `prisma/schema.prisma`

- Added `@@index([status, completedAt])` on Sale model
- Optimizes dashboard queries that filter `WHERE status = 'COMPLETED' ORDER BY completedAt DESC`
- Existing separate indexes on `status` and `completedAt` kept (used independently elsewhere)
- **Note:** Index requires migration to Turso via manual SQL: `CREATE INDEX idx_sales_status_completedAt ON sales (status, completedAt)`

## Notes
- TypeScript: 0 errors
