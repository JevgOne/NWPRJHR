# TASK-050 Implementation: BY_PIECE partial gram sales + EXKLUZIV extension

**Status:** Completed
**Date:** 2026-07-15

## Part 1: BY_PIECE partial gram sales (committed as fcbe28f)

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

## Part 2: EXKLUZIV + gram price display + poptávka toggle (uncommitted)

### 7. `prisma/schema.prisma`
- Added `exclusive Boolean @default(false)` to Delivery model
- Schema pushed with `prisma db push`

### 8. `src/components/inventory/StockInForm.tsx`
- Added `exclusive` state (boolean, default false)
- Added `exclusive` to POST body for BY_PIECE stock-in
- Added checkbox UI with `t("exclusivePiece")` label and `t("exclusiveHint")` description
- Reset `exclusive` to false in "stock another" handler

### 9. `src/lib/validations/delivery.ts`
- Added `exclusive: z.boolean().default(false)` to `newStockInSchema`

### 10. `src/lib/stock-in.ts`
- Added `exclusive?: boolean` to `StockInInput` interface
- Passes `exclusive: data.exclusive ?? false` to `delivery.create`

### 11. `src/app/api/deliveries/route.ts`
- Passes `exclusive: isByPiece ? (data.exclusive ?? false) : false` to stockIn

### 12. `src/lib/fifo.ts`
- Added `isGramOnlySale` detection (pieces=0, grams>0)
- Filters out exclusive deliveries for gram-only sales via `eligibleDeliveries`
- Availability checks and FIFO loop use filtered list

### 13. `src/app/api/sales/price-preview/route.ts`
- For BY_PIECE: queries non-exclusive remaining grams from deliveries
- Returns `hasNonExclusiveGrams` boolean in response

### 14. `src/app/(app)/sales/new/NewSaleWizard.tsx`
- Added `hasNonExclusiveGrams?: boolean` to SaleItem
- Captures from price-preview response
- Toggle only shown when `item.sellingMode === "BY_PIECE" && item.hasNonExclusiveGrams`

### 15. `src/lib/stock.ts`
- Added `exclusiveGrams`/`exclusivePieces` to `StockNumbers`
- `getStockNumbers`: parallel query for exclusive delivery aggregate
- `getAllStockNumbers`: raw SQL with `CASE WHEN exclusive = 1` for exclusive counts
- Both interfaces and map init updated

### 16. `src/lib/api/delivery-serializer.ts`
- Added `exclusive: delivery.exclusive` to base serialized output

### 17. `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx`
- Added ks/g toggle (inquiryUnit state) for BY_PIECE products
- Updated qtyStep/minQty/unitLabel for gram mode
- Reset inquiryUnit on variant change
- handleAdd uses inquiryUnit

### 18. `src/components/public/ProductGridCard.tsx`
- Added `retailPricePerGramForPiece` for BY_PIECE variants
- Shows "(X Kc/g)" under piece price in both B2B and retail views

### 19. `src/app/[locale]/(public)/offer/[...slug]/page.tsx`
- Added `retailPricePerGramForPiece` to pickerVariants mapping
- Added derived `retailPricePerGramForPiece` variable for focused/min variant
- Shows "(X Kc/g)" under piece price on product detail page

### 20. `src/components/sales/SaleItemRow.tsx`
- Fixed hardcoded "ks" badge → uses `tStock("perPiece")` translation key

### 21. i18n (cs.json, uk.json, ru.json)
- Added `stock.exclusivePiece` and `stock.exclusiveHint` keys

## TypeScript check
- `tsc --noEmit` passes with no errors
