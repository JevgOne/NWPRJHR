# TASK-090 Implementation: Fix wrong retail price after cost price change

**Status:** Implemented
**Author:** Implementer
**Date:** 2026-07-19

---

## Root Cause

Two bugs:

1. **Unit mismatch in admin UI**: VariantTable displayed prices as CZK/100g but the edit field worked in CZK/gram. When user saw "3 300 Kc/100g" and clicked to edit, the field showed "33" (CZK/gram). If user typed "3300" thinking it's per-100g, the system saved it as 330000 halere/gram (100x too high).

2. **Price-settings recalculation used `wholesalePricePerGram`** (which equals retail) instead of `costPricePerGram`, causing compounding on each recalculation.

## Changes

### File 1: `src/components/products/VariantTable.tsx`

- **PriceInput component**: Added `per100g` flag. When `per100g=true`, the save sends the value directly (no `*100` conversion), because halere/gram == CZK/100g numerically.
- **Retail price edit init** (BY_GRAM): Changed from `(retailPricePerGram / 100).toString()` to `retailPricePerGram.toString()` — now shows CZK/100g matching the display.
- **Retail PriceInput** (BY_GRAM): Added `per100g` prop.
- **Cost price edit init** (BY_GRAM): Changed from `(costPricePerGram / 100).toString()` to `costPricePerGram.toString()` — now shows CZK/100g matching the display.
- **Cost PriceInput** (BY_GRAM): Added `per100g={!isByPiece}` prop.
- **BY_PIECE fields**: Left unchanged (they work correctly with CZK/piece, `*100` conversion).

### File 2: `src/app/api/variants/[id]/route.ts`

- **Use `calculateRetailPrice`**: Replaced inline `Math.round(cost * (10000 + markup*100) / 10000)` with the centralized `calculateRetailPrice(cost, markup)` which uses `roundHalereUp`. The function was already imported but unused.
- **Set `retailManualOverride`**: When user manually edits `retailPricePerGram` (without cost change), automatically set `retailManualOverride: true` so future cost changes don't overwrite the manual price.

### File 3: `src/app/api/price-settings/route.ts`

- **Use `costPricePerGram`**: Changed `calculateRetailPrice(variant.wholesalePricePerGram, markup)` to `calculateRetailPrice(variant.costPricePerGram, markup)`. Prevents compounding (wholesale was set to retail value, causing doubled prices on each recalculation).
- Also syncs `wholesalePricePerGram` to the new retail value after recalculation.

## Verification

- TypeScript compilation: no errors
- Math verification:
  - `costPricePerGram = 3300` halere/gram = "3 300 Kc/100g" display
  - Edit field now shows "3300" (matches display)
  - User enters "4000" -> saved as 4000 halere/gram
  - `calculateRetailPrice(4000, 100)` = 8000 halere/gram = "8 000 Kc/100g" retail
