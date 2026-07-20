# TASK-071 Phase 2 Implementation

**Commit:** 06122c0
**Date:** 2026-07-14

## 2.1 Sales list API — select optimization + security fix

**Files:**
- `src/app/api/sales/route.ts` — GET and POST handlers
- `src/app/api/sales/[id]/route.ts` — detail endpoint
- `src/lib/api/sale-serializer.ts` — type update

**Changes:**
- Replaced `salon: true` with `salon: { select: { id: true, name: true } }`
- Replaced `customer: true` with `customer: { select: { id: true, name: true } }`
- Replaced `user: true` with `user: { select: { id: true, name: true, email: true, role: true } }`
- **Security fix:** Eliminates `hashedPassword` leak from `user: true` include
- Updated `SaleWithRelations` type in serializer to match partial relations
- Kept `items: true` and `discounts` with full includes (serializer needs all fields)

## 2.2 Salon catalog API — select optimization

**File:** `src/app/api/salon-portal/catalog/route.ts`

- Changed product query from `include: { variants }` to `select` with only needed fields
- Product fields: id, name, nameUk, nameRu, category, processingType, origin, texture, photos
- Variant fields: id, lengthCm, color, retailPricePerGram, retailPricePerPiece, pricePerPiece, sellingMode

## 2.3 Admin products page — unstable_cache

**File:** `src/app/(app)/products/page.tsx`

- Wrapped product + stock queries in `unstable_cache` as `getCachedAdminProducts()`
- Cache key: `["admin-products"]`, revalidate: 15s, tags: `["products"]`
- Map entries serialized to array for cache compatibility, reconstructed on read

## Notes
- TypeScript: 0 errors
- Sale serializer types updated to accept partial user/salon/customer (no longer imports unused Salon, Customer, User types)
