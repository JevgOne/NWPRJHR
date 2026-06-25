# TASK-038: Fix Krok 8 QA Issues

## Issue 1 [Medium]: POST /api/payments lacks $transaction

**File:** `src/app/api/payments/route.ts` (lines 41-95)

**Problem:** The POST handler performs 4 separate database operations without atomicity:
1. `prisma.payment.create()` — line 53
2. `checkInvoicePaid()` — line 64 (reads invoice + payments, updates invoice status)
3. `addSalonRevenue()` — line 73 (updates salon revenue + points + tier)
4. `createNotificationForRole()` + `createSalonNotification()` — lines 76-91

If step 1 succeeds but step 3 fails, the invoice will be marked PAID but loyalty points/revenue won't be added. This is a data consistency risk.

**Fix:** Wrap the entire payment creation flow in `prisma.$transaction()`.

### Implementation

Replace the POST handler body (lines 53-93) with a `prisma.$transaction()` block:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create payment
  const payment = await tx.payment.create({
    data: {
      invoiceId: parsed.data.invoiceId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      matchedVS: parsed.data.matchedVS,
      source: parsed.data.source,
      note: parsed.data.note,
    },
  });

  // 2. Check if invoice is now fully paid
  const wasPaid = await checkInvoicePaidInTx(parsed.data.invoiceId, tx);

  // 3. If just became PAID, update loyalty + send notifications
  if (wasPaid) {
    const invoice = await tx.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      select: { salonId: true, subtotal: true, type: true, number: true },
    });
    if (invoice?.salonId && invoice.type === "INVOICE") {
      await addSalonRevenueInTx(invoice.salonId, invoice.subtotal, tx);
    }
  }

  return { payment, wasPaid };
}, { timeout: 10000 });

// Notifications OUTSIDE transaction (non-critical, can fail independently)
if (result.wasPaid) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
    select: { salonId: true, number: true },
  });
  if (invoice?.salonId) {
    await createNotificationForRole({
      role: "OWNER",
      type: "INCOMING_PAYMENT",
      title: "Platba prijata",
      message: `Prijata platba k fakture ${invoice.number}`,
      data: { invoiceId: parsed.data.invoiceId, amount: parsed.data.amount, invoiceNumber: invoice.number },
      sendEmail: false,
    });
    await createSalonNotification({
      salonId: invoice.salonId,
      type: "INVOICE_PAID",
      data: { invoiceId: parsed.data.invoiceId, invoiceNumber: invoice.number },
    });
  }
}

return NextResponse.json(result.payment, { status: 201 });
```

### Required helper functions

Two new `*InTx` variants are needed in `src/lib/invoice-status.ts` and `src/lib/loyalty.ts` (or inline in the route file).

**Option A (recommended):** Add `tx` parameter overloads to existing functions:

1. **`checkInvoicePaidInTx`** in `src/lib/invoice-status.ts`:
   - Same logic as `checkInvoicePaid` but accepts a `tx` parameter instead of using global `prisma`.
   - Signature: `(invoiceId: string, tx: TransactionClient) => Promise<boolean>`

2. **`addSalonRevenueInTx`** in `src/lib/loyalty.ts`:
   - Same logic as `addSalonRevenue` but accepts a `tx` parameter.
   - Signature: `(salonId: string, amountBeforeVatHalere: number, tx: TransactionClient) => Promise<void>`
   - Note: `calculateTier` does a read-only query so it can stay outside tx or be inlined.

**TransactionClient type** — reuse from `src/lib/returns.ts` (lines 7-9):
```typescript
type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
```

Consider extracting this type to a shared location like `src/lib/db.ts` to avoid duplication.

### Design decision: Notifications inside or outside $transaction?

**Recommendation: OUTSIDE.** Notifications are non-critical side effects. Keeping them outside the transaction:
- Avoids holding the transaction open longer
- Prevents a notification failure from rolling back the payment
- Matches the pattern used in `returns.ts` (notifications are not in the tx)

---

## Issue 2 [Low]: addSalonRevenue uses wrong field for revenue

**File:** `src/app/api/payments/route.ts`, line 73

**Problem:** The code passes `invoice.subtotal` to `addSalonRevenue()`:
```typescript
await addSalonRevenue(invoice.salonId, invoice.subtotal);
```

**Context:** The Invoice model has a `subtotal` field (sum of line items before VAT). The Sale model has both `subtotal` (before discount) and `totalBeforeVat` (after discount, before VAT). When invoicing creates an invoice from a sale, it sets `invoice.subtotal = sale.totalBeforeVat` (see `src/lib/invoicing.ts:102`).

**Analysis:** In this specific case, `invoice.subtotal` IS actually the revenue before VAT because of how invoicing maps the fields. The Invoice schema does NOT have a `totalBeforeVat` field — it only has `subtotal`, `vatAmount`, and `total`.

**Verdict:** The current code is **technically correct** for invoices generated from sales (since `invoice.subtotal` = `sale.totalBeforeVat`). However, for clarity and consistency with the spec language ("revenue before VAT"), the field name is confusing. No code change needed here since the Invoice model doesn't have a `totalBeforeVat` field.

**BUT** — the `select` clause on line 70 should be updated when converting to `addSalonRevenueInTx` to keep it clear:
```typescript
select: { salonId: true, subtotal: true, type: true, number: true },
```
This is already correct. Add a comment explaining that `invoice.subtotal` represents revenue before VAT.

---

## Bonus Cleanup 1: Dead import in returns.ts

**File:** `src/lib/returns.ts`, line 5

```typescript
import { reduceSalonRevenue } from "./loyalty";
```

**Problem:** `reduceSalonRevenue` is imported but never used. The function uses the local `reduceSalonRevenueInTx` helper (line 142, defined at line 246) instead.

**Fix:** Remove line 5:
```diff
- import { reduceSalonRevenue } from "./loyalty";
```

---

## Bonus Cleanup 2: Duplicated createCreditNoteInTx

**Files:**
- `src/lib/returns.ts` — lines 187-244
- `src/lib/complaints.ts` — lines 190-253

**Problem:** Both files contain nearly identical `createCreditNoteInTx` functions (private, not shared). Both do the same thing: create a CREDIT_NOTE invoice within a transaction.

**Fix:** Extract to a shared module.

1. Create `src/lib/credit-note.ts` (or add to existing `src/lib/invoicing.ts`):
   ```typescript
   export async function createCreditNoteInTx(
     originalInvoiceId: string,
     returnItems: CreditNoteItem[],
     reason: string,
     tx: TransactionClient
   ): Promise<Invoice> { ... }
   ```

2. Update both `returns.ts` and `complaints.ts` to import from the shared location.

3. The `CreditNoteItem` type interface is already exported from `src/lib/invoicing.ts`. Reuse it.

**Note:** `complaints.ts` uses a slightly different item type (inline `Array<{...}>` instead of `CreditNoteItem[]`), but the fields are identical. Unify to use `CreditNoteItem`.

---

## Summary of Changes

| # | Priority | File | Change |
|---|----------|------|--------|
| 1 | Medium | `src/app/api/payments/route.ts` | Wrap POST in `$transaction()` |
| 2 | Medium | `src/lib/invoice-status.ts` | Add `checkInvoicePaidInTx()` |
| 3 | Medium | `src/lib/loyalty.ts` | Add `addSalonRevenueInTx()` |
| 4 | Low | `src/app/api/payments/route.ts` | Add comment clarifying subtotal = revenue before VAT |
| 5 | Low | `src/lib/returns.ts` | Remove dead `reduceSalonRevenue` import |
| 6 | Low | `src/lib/credit-note.ts` (new) | Extract shared `createCreditNoteInTx` |
| 7 | Low | `src/lib/returns.ts` | Import from shared credit-note module |
| 8 | Low | `src/lib/complaints.ts` | Import from shared credit-note module |

## Execution Order

1. Extract `TransactionClient` type to `src/lib/db.ts` (shared)
2. Add `checkInvoicePaidInTx` to `src/lib/invoice-status.ts`
3. Add `addSalonRevenueInTx` to `src/lib/loyalty.ts`
4. Refactor `src/app/api/payments/route.ts` POST to use `$transaction`
5. Remove dead import from `src/lib/returns.ts`
6. Extract `createCreditNoteInTx` to shared module
7. Update `returns.ts` and `complaints.ts` imports
8. Verify TypeScript compilation: `npx tsc --noEmit`
