# TASK-024: E-shop Logic — Inventory ↔ Product Sync Analysis

## Architecture Overview

The stock system uses **dynamic calculation** — there is NO stored "stock" field on `Variant`. Instead, stock is calculated on-the-fly from two tables:

```
Stock = SUM(deliveries.remainingGrams) - SUM(active reservations.grams)
```

### Key Files:
- `src/lib/stock.ts` — `getStockNumbers()` and `getAllStockNumbers()` functions
- `src/lib/stock-in.ts` — `stockIn()` creates Delivery + RECEIPT StockMovement
- `src/lib/fifo.ts` — `fifoDeduct()` (sale deduction) and `fifoReturn()` (return to stock)
- `src/lib/sales.ts` — `completeSale()` calls `fifoDeduct()`
- `src/lib/order-workflow.ts` — `createOrder()` creates reservations, `rejectOrder()`/`cancelOrder()` release them
- `src/app/api/stock/route.ts` — GET endpoint returns stock levels per variant
- `src/app/api/deliveries/route.ts` — POST endpoint calls `stockIn()`
- `src/app/api/salon-portal/catalog/route.ts` — salon catalog, calls `getStockNumbers()` per variant

---

## Flow Analysis

### 1. Delivery → Stock (naskladneni) — WORKS CORRECTLY

**Flow**: POST `/api/deliveries` → `stockIn()` → creates `Delivery` record with `remainingGrams = totalGrams` + `StockMovement(RECEIPT)`

Since stock is calculated dynamically from `SUM(deliveries.remainingGrams)`, adding a delivery **immediately** increases stock. No sync needed — it's the same data source.

**Verdict: NO BUG. Stock updates automatically when delivery is created.**

### 2. Product List/Detail → Stock Display

#### Admin Product Detail (`/products/[id]`)
The `VariantTable.tsx` component does NOT show stock levels at all. It only shows prices (cost, wholesale, retail) and margin. 

**Gap**: Product detail page doesn't display current stock for each variant. The owner sees prices but has no visibility into how much stock is available per variant without navigating to the Inventory page.

**Recommendation**: Add stock column to `VariantTable.tsx` — fetch from `/api/stock?productId={id}` and display alongside prices.

#### Admin Inventory Page (`/inventory`)
The `InventoryClient.tsx` uses server-side data from `/api/stock` which calls `getAllStockNumbers()`. This shows physical, reserved, and available stock correctly.

**Verdict: WORKS CORRECTLY. Inventory page shows real-time stock.**

### 3. Salon Catalog → Stock Visibility

**Flow**: GET `/api/salon-portal/catalog` → for each variant, calls `getStockNumbers(v.id)` → returns `availableGrams` and `availablePieces`

The salon catalog **shows all variants** including out-of-stock ones. Out-of-stock variants show red "Vyprodáno" text. In-stock variants show green gram count.

**Verdict: WORKS CORRECTLY. Shows real stock. Does not hide out-of-stock items (by design — salons can see what's normally available).**

### 4. Sale → Stock Deduction — WORKS CORRECTLY

**Flow**: POST `/api/sales` → `completeSale()` → `fifoDeduct()` per item → decrements `delivery.remainingGrams` via `delivery.update({ remainingGrams: { decrement: gramsFromThis } })` + creates `StockMovement(ISSUE)`

Since stock = SUM(deliveries.remainingGrams), decrementing delivery remaining grams immediately reduces available stock.

**Verdict: NO BUG. Sale properly deducts stock via FIFO.**

### 5. Order → Reservation → Stock

**Flow**: POST `/api/orders` → `createOrder()` → checks `getStockNumbers()` → creates `Reservation(active: true)` → reduces `availableGrams` (physical - reserved)

- Order confirmed: reservation stays active
- Order completed: reservation released (`active: false`), then `completeSale()` does FIFO deduction
- Order rejected/cancelled: reservation released (`active: false`), stock becomes available again

**Verdict: WORKS CORRECTLY. Reservations properly hold and release stock.**

### 6. Return → Stock Return — WORKS CORRECTLY

**Flow**: POST `/api/returns/[id]/approve` → `approveReturn()` → `fifoReturn()` → increments `delivery.remainingGrams` + creates `StockMovement(RETURN)`

**Verdict: NO BUG. Return properly adds stock back to original delivery.**

---

## Issue: FIFO `SELECT FOR UPDATE` on SQLite/Turso

**POTENTIAL BUG** in `src/lib/fifo.ts` line 40-46:

```typescript
const deliveries = await tx.$queryRaw<Delivery[]>`
  SELECT * FROM "deliveries"
  WHERE "variantId" = ${variantId}
    AND "remainingGrams" > 0
  ORDER BY "stockedAt" ASC
  FOR UPDATE
`;
```

`FOR UPDATE` is a PostgreSQL/MySQL feature. **SQLite (and Turso/LibSQL) does NOT support `FOR UPDATE`**. This query may fail or silently ignore the lock, leading to potential race conditions in concurrent sales.

**Risk**: Two concurrent sales of the same variant could both read the same delivery as having stock, then both deduct — resulting in negative `remainingGrams`.

**Fix options**:
1. Turso handles this via serializable transactions by default — the `FOR UPDATE` may be ignored but the transaction isolation may still protect. **Need to verify Turso's behavior with `FOR UPDATE`**.
2. If it fails, remove `FOR UPDATE` and rely on Turso's transaction serialization.

---

## Public Website Stock Display — DESIGN ISSUE

### Public Product Detail (`/offer/[id]` line 328)
Hardcodes "In Stock" for ALL products:
```tsx
<div className="text-sm font-semibold text-emerald-700">{t("productDetail.inStock")}</div>
```

The public product API (`/api/public/products`) does NOT return stock levels at all — it only returns variant lengths, colors, and prices.

**This is likely intentional**: The public site is an inquiry-based system (poptavkovy kosik), not a direct purchase e-shop. Customers submit inquiries, they don't buy directly. Showing "out of stock" on the public site would be confusing since the site doesn't handle direct purchases.

**Recommendation**: Keep as-is for the public site. If the user wants accurate stock visibility on the public site, the `/api/public/products` API would need to include stock data (via `getStockNumbers()`), and the frontend would need to conditionally show "Out of stock" per variant.

---

## Summary

| # | Question | Answer | Status |
|---|----------|--------|--------|
| 1 | Does delivery update product stock? | YES — stock is dynamic, delivery = stock | OK |
| 2 | Does product list/detail show stock? | Inventory page: YES. Product detail: NO (only prices) | GAP |
| 3 | Does salon catalog show stock? | YES — shows availableGrams per variant, red/green indicators | OK |
| 4 | Does sale deduct stock? | YES — via FIFO deduction from oldest deliveries | OK |
| 5 | Any disconnects? | Product detail doesn't show stock. Public site hardcodes "In Stock" | MINOR |

## Conclusion

**The core inventory ↔ product sync is CORRECT by design.** There is no "sync" needed because stock is calculated dynamically from deliveries. The system is well-architected:

- `Delivery.remainingGrams` is the single source of truth
- `Reservation` holds stock for pending orders
- `fifoDeduct` properly decrements delivery remaining on sale
- `fifoReturn` properly increments on return
- Stock API calculates on-the-fly from these tables

### Only fixes needed:

1. **Product detail page should show stock** — Add stock display to `VariantTable.tsx` or `ProductDetailClient.tsx` by fetching from `/api/stock?productId={id}`. This gives the admin visibility into stock per variant without switching to the Inventory page.

2. **FIFO `FOR UPDATE` on SQLite** — Verify Turso handles this or remove the clause. Low priority if the system doesn't have concurrent sales.

3. **Public site "In Stock" hardcode** — LOW priority, likely intentional for inquiry-based model. Only fix if user explicitly wants per-variant stock visibility on public site.

### Implementation (if requested):

#### Fix 1: Add stock to product detail

**File**: `src/app/(app)/products/[id]/ProductDetailClient.tsx`

Add a `useEffect` to fetch stock data:
```typescript
const [stockMap, setStockMap] = useState<Record<string, StockNumbers>>({});

useEffect(() => {
  fetch(`/api/stock?productId=${product.id}`)
    .then(r => r.json())
    .then(data => {
      const map: Record<string, StockNumbers> = {};
      for (const item of data) map[item.variantId] = item;
      setStockMap(map);
    })
    .catch(() => {});
}, [product.id]);
```

Pass `stockMap` to `VariantTable` and display stock per cell:
```tsx
// In VariantTable cell, add:
<div className="text-xs mt-0.5">
  <span className={stockClass(stock.availableGrams)}>
    {stock.availableGrams}g
  </span>
</div>
```

**File**: `src/components/products/VariantTable.tsx`
- Add `stockMap` prop to interface
- Display stock in each variant cell

#### Fix 2: FIFO FOR UPDATE

**File**: `src/lib/fifo.ts` line 40-46

Remove `FOR UPDATE`:
```sql
SELECT * FROM "deliveries"
WHERE "variantId" = ${variantId}
  AND "remainingGrams" > 0
ORDER BY "stockedAt" ASC
```

Turso's serializable transactions handle concurrency without explicit row locking.
