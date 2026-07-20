# Order Completion Bug Analysis

## Error Report
User says: "nejde dokoncit objednavka, na konci to pise chyba" (can't complete order, shows error at the end)

## Complete Flow Analysis

The "Complete" action in `src/app/api/orders/[id]/route.ts:207-290` does this in sequence:

1. **Transaction 1** (line 211): Verify order status, release reservations, set COMPLETED
2. **completeSale()** (line 242): Create Sale record with FIFO stock deduction
3. **order.update** (line 257): Link sale to order (set saleId)
4. **createInvoiceFromSale()** (line 263): Create invoice

Any failure in steps 2-4 leaves the order in an inconsistent state (marked COMPLETED but no sale/invoice).

## Identified Issues (Ranked by Likelihood)

### BUG 1: `FOR UPDATE` on SQLite/Turso (CRITICAL - MOST LIKELY CAUSE)

**Files:** `src/lib/fifo.ts:40-46`, `src/lib/invoice-number.ts:24-28`

Both use `SELECT ... FOR UPDATE` via `$queryRaw`:

```sql
-- fifo.ts:40-46
SELECT * FROM "deliveries"
WHERE "variantId" = ${variantId}
  AND ("remainingGrams" > 0 OR "remainingPieces" > 0)
ORDER BY "stockedAt" ASC
FOR UPDATE

-- invoice-number.ts:24-28
SELECT * FROM "invoice_counters"
WHERE "year" = ${currentYear}
FOR UPDATE
```

**Problem:** Turso/libsql is SQLite. SQLite does NOT support `FOR UPDATE`. Turso's libsql may:
- Silently ignore it (works but no locking)
- Throw a syntax error (breaks the query)

If Turso started enforcing SQL syntax more strictly in a recent update, this would break both FIFO deduction AND invoice number generation — both of which are called during order completion.

**Fix:** Remove `FOR UPDATE` from both raw queries. SQLite transactions already serialize writes (implicit locking), so the `FOR UPDATE` is unnecessary. The Prisma `$transaction` already provides serialization.

```ts
// fifo.ts — remove FOR UPDATE
const deliveries = await tx.$queryRaw<Delivery[]>`
  SELECT * FROM "deliveries"
  WHERE "variantId" = ${variantId}
    AND ("remainingGrams" > 0 OR "remainingPieces" > 0)
  ORDER BY "stockedAt" ASC
`;

// invoice-number.ts — remove FOR UPDATE
const counters = await tx.$queryRaw<InvoiceCounterRow[]>`
  SELECT * FROM "invoice_counters"
  WHERE "year" = ${currentYear}
`;
```

### BUG 2: Missing `companyId` in Client Request (HIGH)

**File:** `src/app/api/orders/[id]/route.ts:265`

```ts
const invoice = await createInvoiceFromSale(
  sale.id,
  body.companyId   // <-- from request body
);
```

**File:** `src/app/(app)/orders/[id]/OrderDetailClient.tsx:251`

```tsx
<Button size="sm" onClick={() => doAction("complete")}>
  {t("completeOrder")}
</Button>
```

The client sends `{ action: "complete" }` — **no `companyId` is included**. In `createInvoiceFromSale`, when `companyId` is undefined, it falls back to:

```ts
await tx.company.findFirstOrThrow({ where: { isDefault: true } });
```

This works IF there's a Company record with `isDefault: true`. If no default company exists (or it was accidentally un-defaulted), `findFirstOrThrow` throws "No Company found" — and the entire completion fails.

**Fix:** Two options:
1. Ensure a default company always exists (data integrity check)
2. Add error handling in the route that catches invoice failures separately (the sale is already created at that point)

### BUG 3: No Error Display in Client (HIGH)

**File:** `src/app/(app)/orders/[id]/OrderDetailClient.tsx:87-97`

```tsx
const doAction = async (action: string, body?: Record<string, unknown>) => {
  const res = await fetch(`/api/orders/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (res.ok) {
    setShowCancelConfirm(false);
    load();
  }
  // NO ELSE — error is silently swallowed!
};
```

When the API returns an error, the client does nothing — no error message displayed to user. User sees "chyba" but it's likely the generic error from the page re-loading to a bad state, not the actual API error message.

**Fix:** Add error state and display:

```tsx
const [actionError, setActionError] = useState("");

const doAction = async (action: string, body?: Record<string, unknown>) => {
  setActionError("");
  const res = await fetch(`/api/orders/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (res.ok) {
    setShowCancelConfirm(false);
    load();
  } else {
    const data = await res.json().catch(() => ({}));
    setActionError(data.error || tCommon("error"));
  }
};
```

### BUG 4: Partial Completion — No Rollback (MEDIUM)

**File:** `src/app/api/orders/[id]/route.ts:207-290`

The completion uses 3 separate transactions:
1. Transaction 1: Mark order COMPLETED + release reservations
2. `completeSale()`: Own transaction — FIFO deduct + create sale
3. `createInvoiceFromSale()`: Own transaction — create invoice

If step 2 fails (e.g., insufficient stock), the order is already marked COMPLETED but has no sale. If step 3 fails (e.g., no default company), the order has a sale but no invoice.

**This is the "on the end shows error" scenario** — the order gets stuck in a half-completed state.

**Fix:** Wrap the entire operation differently. Either:
- Check stock availability BEFORE marking order as complete (pre-validate)
- Or catch errors from completeSale/createInvoiceFromSale and revert the order status back

```ts
case "complete": {
  // ... auth check ...
  
  try {
    // Step 1: Transaction — mark completed + release reservations
    const result = await prisma.$transaction(async (tx) => { ... });
    
    // Step 2: Create sale
    const sale = await completeSale({ ... }, session.user.id);
    
    // Step 3: Link + invoice
    await prisma.order.update({ where: { id }, data: { saleId: sale.id } });
    const invoice = await createInvoiceFromSale(sale.id, body.companyId);
    
    return NextResponse.json({ ... });
  } catch (e) {
    // ROLLBACK: revert order status if sale/invoice creation failed
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (order?.status === "COMPLETED" && !order.saleId) {
        // Sale was never created — revert to previous status
        await tx.order.update({
          where: { id },
          data: { status: "CONFIRMED", completedAt: null },
        });
        // Re-activate reservations
        await tx.reservation.updateMany({
          where: { orderId: id },
          data: { active: true },
        });
      }
    }).catch(() => {});
    
    throw e; // re-throw to return error to client
  }
}
```

### BUG 5: Insufficient Stock After Reservation (MEDIUM)

Reservations hold stock numbers but don't lock actual deliveries. Between order creation and completion, stock could have been sold through direct sales (NewSaleWizard), making the FIFO deduction fail.

The `fifoDeduct` in `src/lib/fifo.ts` throws `InsufficientStockError` if not enough stock. This is caught by the outer catch in the route and returns status 400.

**Fix:** Pre-check stock before completion, or show a better error message to the user.

### BUG 6: Double-quoted Table Names in SQLite (LOW)

**File:** `src/lib/fifo.ts:41`

```sql
SELECT * FROM "deliveries"
```

SQLite uses `"` for identifiers, which works. But the Prisma schema uses `@@map("deliveries")` which means the actual table name is `deliveries`. This should be fine, but worth noting.

## Recommended Fix Priority

1. **BUG 1 (FOR UPDATE)** — Most likely root cause. Remove `FOR UPDATE` from both fifo.ts and invoice-number.ts. SQLite transactions already handle serialization.

2. **BUG 3 (Silent error swallowing)** — Add error display in OrderDetailClient so the actual error message is visible. This helps debug the issue immediately.

3. **BUG 2 (Missing companyId)** — Verify that a default company exists in production DB. Add a fallback or better error message.

4. **BUG 4 (Partial completion)** — Add rollback logic so failed completions don't leave orders in bad state.

5. **BUG 5 (Stock check)** — Lower priority but add pre-validation.

## Files to Modify

- `src/lib/fifo.ts:40-46` — remove `FOR UPDATE`
- `src/lib/invoice-number.ts:24-28` — remove `FOR UPDATE`
- `src/app/(app)/orders/[id]/OrderDetailClient.tsx:87-97` — add error display
- `src/app/api/orders/[id]/route.ts:207-290` — add rollback on failure

## Quick Verification

To confirm which error is occurring, check production logs or add temporary logging in the catch block:

```ts
} catch (e) {
  console.error("[Order Complete] Failed:", { orderId: id, error: e });
  if (e instanceof Error) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  throw e;
}
```
