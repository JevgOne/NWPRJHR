# TASK-050 Implementation: BY_PIECE partial gram sales

**Status:** Completed
**Date:** 2026-07-15

## Changes made

### 1. `src/components/sales/SaleItemRow.tsx`
- Added `sellByGrams?: boolean` to `SaleItemData` interface
- Added `onToggleSellByGrams?: () => void` to `SaleItemRowProps`
- Toggle button shows "Prodat po gramech" / "Prodat po kusech" for BY_PIECE items
- When `sellByGrams=true`: shows gram input instead of piece input
- Insufficient stock check uses `availableGrams` when in gram mode
- Available stock display switches between grams/pieces based on mode
- Price display shows pricePerGram when in gram mode

### 2. `src/app/(app)/sales/new/NewSaleWizard.tsx`
- Added `sellByGrams?: boolean` to `SaleItem` interface
- `addItemFromVariantId`: BY_PIECE items now also capture `pricePerGram` and `availableGrams` (were hardcoded to 0)
- New `toggleSellByGrams(index)` handler: resets quantities when toggling
- `updateItem`: BY_PIECE gram mode uses `pricePerGram * grams` for lineTotal
- `handleSubmit`: sends `pieces: 0, grams: X` when `sellByGrams=true`
- `canSubmit`: allows BY_PIECE items with `grams > 0` when in gram mode
- Summary section displays gram-based info when `sellByGrams=true`
- Passes `onToggleSellByGrams` to SaleItemRow for BY_PIECE items

### 3. `src/lib/sales.ts`
- `lineTotal`: uses `pricePerGram * grams` when `isByPiece && pieces === 0`
- `fifoLineTotal`: uses `pricePerGram * grams` when `isByPiece && pieces === 0`

### 4. `src/lib/fifo.ts`
- Gram-deduction path: when all grams consumed from a BY_PIECE delivery, also marks pieces as consumed (`piecesFromThis = delivery.remainingPieces`)

### 5. `src/app/api/sales/price-preview/route.ts`
- BY_PIECE: when `pieces=0`, calculates lineTotal from `pricePerGram * grams`

### 6. i18n (cs.json, uk.json, ru.json)
- Added `sellByGrams` and `sellByPieces` translation keys

## TypeScript check
- `tsc --noEmit` passes with no errors
