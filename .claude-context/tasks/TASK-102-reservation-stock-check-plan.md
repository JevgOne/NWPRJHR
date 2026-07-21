# TASK-102: Reservation Stock Availability Check (CRITICAL BUG)

## Problem

`createProductReservation()` in `src/lib/reservations.ts` creates reservations **without any stock availability check**. A user can create unlimited reservations for a variant even if there is 0g in stock. This leads to overselling — e.g. a product with 84g has 3 reservations totalling more than available stock.

### Root Cause Analysis

There are **two separate bugs**:

**BUG 1: No stock check at reservation creation time**
- `createProductReservation()` (line 51-143) only checks `variant.active` and `product.archived`
- It never calls `getStockNumbers()` or checks delivery `remainingGrams`
- Compare with `createOrder()` in `order-workflow.ts` (line 80-99) which **does** check stock
- Compare with `fifoDeduct()` in `fifo.ts` (line 62-75) which throws `InsufficientStockError`

**BUG 2: `getStockNumbers()` doesn't account for ProductReservation amounts**
- `getStockNumbers()` in `stock.ts` (line 30-43) subtracts `reservation` table (e-shop Order reservations, model `Reservation` mapped to `reservations` table)
- It does **NOT** subtract `product_reservations` table (admin ProductReservation model)
- This means even if we add a stock check, the "available" number is wrong — it doesn't account for existing active ProductReservations (PENDING + PAID status)
- Same issue in `getAllStockNumbers()` raw SQL (line 95-102) — queries `reservations` table only

### Two Different Reservation Models (Prisma schema)

| Model | Table | Purpose | Used by |
|-------|-------|---------|---------|
| `Reservation` | `reservations` | E-shop order stock lock (auto-created with Order) | `getStockNumbers()`, `getAllStockNumbers()` |
| `ProductReservation` | `product_reservations` | Admin manual reservation (PENDING→PAID→COMPLETED) | `createProductReservation()`, calendar, reservation list |

### Current Stock Formula (WRONG)
```
available = delivery.remainingGrams - reservation(active=true).grams
```

### Correct Stock Formula
```
available = delivery.remainingGrams 
          - reservation(active=true).grams           // e-shop order locks
          - productReservation(status IN ['PENDING','PAID']).grams  // admin reservations
```

## Impact

- Users can create reservations for more stock than exists
- When completing reservation → sale, `fifoDeduct()` will throw `InsufficientStockError` because there's not enough physical stock
- Admin has no visibility into whether stock is actually available when creating reservation
- Stock numbers shown everywhere (inventory, products, sales) are wrong — they don't account for admin reservations

---

## Implementation Plan

### Fix 1: Add ProductReservation to stock calculation (`src/lib/stock.ts`)

**File:** `src/lib/stock.ts`

**1a. Update `getStockNumbers()` (line 26-62)**

Add a third aggregation query for `productReservation` with active statuses:

```typescript
export async function getStockNumbers(
  variantId: string,
  db: TransactionClient | typeof prisma = prisma
): Promise<StockNumbers> {
  const [physical, reserved, productReserved, exclusiveStock] = await Promise.all([
    db.delivery.aggregate({
      where: { variantId },
      _sum: { remainingGrams: true, remainingPieces: true },
    }),
    db.reservation.aggregate({
      where: { variantId, active: true },
      _sum: { grams: true, pieces: true },
    }),
    db.productReservation.aggregate({
      where: { variantId, status: { in: ["PENDING", "PAID"] } },
      _sum: { grams: true, pieces: true },
    }),
    db.delivery.aggregate({
      where: { variantId, exclusive: true },
      _sum: { remainingGrams: true, remainingPieces: true },
    }),
  ]);

  const physicalGrams = physical._sum.remainingGrams ?? 0;
  const physicalPieces = physical._sum.remainingPieces ?? 0;
  const reservedGrams = (reserved._sum.grams ?? 0) + (productReserved._sum.grams ?? 0);
  const reservedPieces = (reserved._sum.pieces ?? 0) + (productReserved._sum.pieces ?? 0);
  // ... rest same
}
```

**1b. Update `getAllStockNumbers()` raw SQL (line 83-146)**

Add a second reservation query for `product_reservations` table:

```sql
SELECT variantId,
       COALESCE(SUM(grams), 0) as reservedGrams,
       COALESCE(SUM(pieces), 0) as reservedPieces
FROM product_reservations
WHERE status IN ('PENDING', 'PAID')
GROUP BY variantId
```

Then merge both reservation results into the map (add grams/pieces from both sources).

**Important:** The `reservedGrams` and `reservedPieces` fields in `StockNumbers` should represent the TOTAL of both reservation types combined.

### Fix 2: Add stock check to `createProductReservation()` (`src/lib/reservations.ts`)

**File:** `src/lib/reservations.ts`

After the variant active check (line 60-61), add stock availability check:

```typescript
import { getStockNumbers } from "./stock";

// After variant active/archived check:
const stock = await getStockNumbers(input.variantId);
const isByPiece = sellingMode === "BY_PIECE";

if (isByPiece) {
  if (input.pieces > 0 && stock.availablePieces < input.pieces) {
    throw new Error(
      `Nedostatecny sklad: pozadovano ${input.pieces} ks, dostupno ${stock.availablePieces} ks`
    );
  }
} else {
  if (stock.availableGrams < input.grams) {
    throw new Error(
      `Nedostatecny sklad: pozadovano ${input.grams} g, dostupno ${stock.availableGrams} g`
    );
  }
}
```

**Note:** This check uses `getStockNumbers()` which (after Fix 1) already subtracts existing ProductReservations. So if variant has 84g physical and 50g already reserved, `availableGrams` = 34g, and creating a 40g reservation will correctly fail.

**Edge case — race condition:** Two concurrent reservation creates could both pass the check. This is acceptable for admin use (low concurrency). For full safety, the stock check could be moved inside a transaction, but that's overkill for the admin reservation flow.

### Fix 3: Show available stock in NewReservationForm (`src/app/(app)/reservations/new/NewReservationForm.tsx`)

**File:** `src/app/(app)/reservations/new/NewReservationForm.tsx`

Currently the form shows NO stock information at all (confirmed: zero references to "stock" or "available" in the file). The sales wizard (`NewSaleWizard.tsx`) fetches stock from `/api/sales/price-preview` and displays it.

**3a. Fetch stock when variant is selected**

After variant selection, call `/api/sales/price-preview` or create a simpler stock endpoint. The price-preview endpoint already returns `availableStock: { grams, pieces }` alongside pricing info, so reuse it:

```typescript
// When selectedVariantId changes, fetch stock:
const [availableStock, setAvailableStock] = useState<{grams: number; pieces: number} | null>(null);

useEffect(() => {
  if (!selectedVariantId || !customerType) return;
  fetch(`/api/sales/price-preview?variantId=${selectedVariantId}&customerType=${customerType}&grams=${grams}&pieces=${pieces}`)
    .then(r => r.json())
    .then(data => setAvailableStock(data.availableStock))
    .catch(() => {});
}, [selectedVariantId, customerType]);
```

**3b. Display stock info + warning**

Show available stock next to the quantity input:
- Green text when stock >= requested amount
- Red text + warning when stock < requested amount
- Disable submit button when stock is insufficient

```tsx
{availableStock && (
  <div className={`text-xs mt-1 ${
    (isByPiece ? availableStock.pieces < pieces : availableStock.grams < grams)
      ? "text-red-500 font-medium"
      : "text-muted"
  }`}>
    Skladem: {isByPiece ? `${availableStock.pieces} ks` : `${availableStock.grams} g`}
    {(isByPiece ? availableStock.pieces < pieces : availableStock.grams < grams) && (
      <span className="ml-1">- nedostatecny sklad!</span>
    )}
  </div>
)}
```

### Fix 4: Invalidate stock cache after reservation changes (`src/lib/reservations.ts`)

**File:** `src/lib/reservations.ts`

Since ProductReservation now affects stock numbers (after Fix 1), we need to invalidate the stock cache when reservations are created/cancelled/completed:

```typescript
import { invalidateStockCache } from "./stock";
```

Add `invalidateStockCache()` call at the end of:
- `createProductReservation()` — after line 141
- `cancelReservation()` — after the update
- `completeReservation()` — after the update (though `completeSale` already does this)
- `expireOverdueReservations()` — after updating expired reservations
- `markReservationPaid()` — NOT needed (PENDING→PAID doesn't change available stock)

**Also in API route** `src/app/api/reservations/[id]/route.ts`:
- After `mark_paid` action: NOT needed
- After `complete` action: `completeSale()` already calls `invalidateStockCache()`
- After `cancel` action: add `invalidateStockCache()` import + call

### Fix 5 (Optional): Reservation completion should skip FIFO stock re-check

**File:** `src/app/api/reservations/[id]/route.ts` (line 100-175)

When completing a reservation (PAID→COMPLETED), `completeSale()` is called which internally runs `fifoDeduct()`. The `fifoDeduct()` checks physical stock (`delivery.remainingGrams`) but does NOT account for the fact that this stock was "reserved" by the ProductReservation.

After Fix 1, the available stock already subtracts ProductReservation amounts. So when completing:
1. ProductReservation has 30g reserved
2. `availableGrams` = physical - order_reservations - product_reservations
3. The 30g is "counted" in product_reservations
4. `completeSale()` → `fifoDeduct()` checks `delivery.remainingGrams` (physical), NOT `availableGrams`
5. So it will succeed as long as physical stock >= requested grams

This is actually **fine** — `fifoDeduct()` checks raw physical stock in deliveries, and the physical stock hasn't been decremented by the reservation (reservation is just a logical lock). The completion flow is: deduct from delivery physical stock → mark reservation COMPLETED. No change needed here.

---

## Execution Order

1. **Fix 1** first (stock calculation) — this is the foundation
2. **Fix 4** next (cache invalidation) — ensures stock numbers stay fresh
3. **Fix 2** next (backend validation) — server-side guard
4. **Fix 3** last (frontend display) — UX improvement

## Testing

- Create reservation for more grams than available → should get error
- Create reservation for exactly available grams → should succeed
- Create second reservation for same variant → should see reduced available stock
- Cancel reservation → available stock should increase
- Complete reservation → sale created, physical stock deducted
- Check stock numbers on /inventory page → should reflect ProductReservation amounts
- Check stock-check API → should reflect ProductReservation amounts

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/stock.ts` | Add `productReservation` aggregation to both stock functions |
| `src/lib/reservations.ts` | Add stock check + import `getStockNumbers` + `invalidateStockCache` calls |
| `src/app/(app)/reservations/new/NewReservationForm.tsx` | Show available stock, warn on insufficient |
| `src/app/api/reservations/[id]/route.ts` | Add `invalidateStockCache()` after cancel action |
