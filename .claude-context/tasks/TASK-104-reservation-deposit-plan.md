# TASK-104: Reservation Deposit System — Implementation Plan

## Status: PLAN READY

---

## 1. Overview

When an admin creates a ProductReservation, the system automatically generates a 50% deposit invoice (záloha) and sends a payment link via Comgate. The customer has **3 hours** to pay. If unpaid, the reservation auto-cancels and stock is released. When the customer picks up the product (event date), a final invoice for the remaining 50% is generated automatically.

### Key Accounting Rules
- **Deposit (záloha)** is NOT revenue — it's an advance payment (účetně záloha = účet 324)
- **Revenue** is recognized only when the full transaction completes (pickup / completion)
- **COGS (náklady)** are counted immediately when stock is reserved (on sale creation at completion)

---

## 2. Current State Analysis

### Comgate Integration (`src/lib/comgate.ts`)
- `createPayment()` — creates a payment, returns `transId` + `redirect` URL
- `getPaymentStatus()` — verifies payment status (PENDING/PAID/CANCELLED/AUTHORIZED)
- `refundPayment()` / `cancelPayment()` — exist and work
- Price is in **haléře** (CZK * 100)
- Uses `prepareOnly: "true"` → returns redirect URL (customer redirected to Comgate gateway)
- Apple Pay + QR code are handled by Comgate gateway UI automatically (method: "ALL")

### Comgate Callback (`src/app/api/comgate/callback/route.ts`)
- Receives POST from Comgate with `transId`, `status`, `merchant`
- Always verifies via `getPaymentStatus()` (never trusts push alone)
- Currently handles two paths:
  1. **Payment** model (linked to Invoice) — marks invoice as PAID
  2. **Order** model (e-shop) — marks order as PAID, creates Sale
- **Does NOT handle ProductReservation** — needs new path

### Reservation System (`src/lib/reservations.ts`)
- `createProductReservation()` — creates with status PENDING, default 3-day due date
- `markReservationPaid()` — changes PENDING → PAID
- `completeReservation()` — changes PAID → COMPLETED
- `cancelReservation()` — cancels (from PENDING or PAID)
- `expireOverdueReservations()` — expires all PENDING where `paymentDueDate < now`

### Reservation API (`src/app/api/reservations/[id]/route.ts`)
- `complete` action creates Sale → links to reservation → creates Invoice
- Currently creates ONE full invoice at completion time

### Invoice System (`src/lib/invoicing.ts`)
- `createInvoiceFromSale()` — creates full invoice from sale
- Invoice types: `INVOICE` | `CREDIT_NOTE`
- Invoice statuses: `ISSUED` | `AWAITING` | `PAID` | `OVERDUE` | `CANCELLED`
- Uses atomic numbering via InvoiceCounter

### Cron (`src/app/api/cron/expire-reservations/route.ts`)
- Handles two things: ProductReservation expiry + Order reservation expiry
- **NOT in vercel.json** — must be added or called differently
- Uses `paymentDueDate` field for expiry logic

### ProductReservation Schema
- Has `comgateTransId` — NOT present (needs adding)
- Has `invoiceId` field — currently @unique, links one invoice
- Has `paymentDueDate` — currently defaults to +3 days

---

## 3. Database Changes

### 3.1 Prisma Schema: `InvoiceType` enum

```prisma
enum InvoiceType {
  INVOICE
  CREDIT_NOTE
  DEPOSIT          // NEW — záloha (advance payment)
  DEPOSIT_SETTLE   // NEW — vyúčtování zálohy (settlement invoice)
}
```

### 3.2 Prisma Schema: `ProductReservation` model — new fields

```prisma
model ProductReservation {
  // ... existing fields ...

  // Deposit payment
  comgateTransId     String?             // Comgate transaction ID for deposit
  depositInvoiceId   String?   @unique   // Invoice for the 50% deposit (záloha)
  depositAmount      Int?                // The 50% deposit amount in haléře
  depositPaidAt      DateTime?           // When deposit was actually paid
  
  // Event/pickup date (when remaining 50% is due)
  eventDate          DateTime?           // Planned pickup date
  
  // Settlement
  settlementInvoiceId String?  @unique   // Invoice for the remaining 50%

  // Rename existing invoiceId to finalInvoiceId for clarity (or keep as is)
  // Keep existing: invoiceId, saleId, paidAt, paymentNote
}
```

**Note:** The existing `invoiceId` field on ProductReservation is currently unused (no relation defined). We'll use the new `depositInvoiceId` for the deposit invoice and `settlementInvoiceId` for the final settlement invoice.

### 3.3 Prisma Schema: `Invoice` model — new optional relation

```prisma
model Invoice {
  // ... existing fields ...
  
  // Optional: link to reservation (for deposit + settlement invoices)
  reservationId     String?
  reservation       ProductReservation?  @relation(fields: [reservationId], references: [id])
}
```

**Alternative approach** (simpler): Instead of a relation on Invoice, we use `depositInvoiceId` and `settlementInvoiceId` on ProductReservation to link to Invoice records. This avoids modifying the Invoice model and uses the existing pattern (like `saleId` on Invoice).

**Recommended: Use approach on ProductReservation side** — add two @unique fields pointing to Invoice, similar to how `saleId` works on Invoice.

### 3.4 Final Schema Changes (recommended)

```prisma
// ProductReservation — ADD these fields:
  comgateTransId       String?
  depositAmount        Int?                // 50% amount in haléře
  depositPaidAt        DateTime?
  eventDate            DateTime?           // Planned pickup/event date

// Remove existing single invoiceId, replace with two:
// (migration: rename invoiceId → depositInvoiceId, add settlementInvoiceId)
  depositInvoiceId     String?   @unique
  settlementInvoiceId  String?   @unique

// Add index:
  @@index([comgateTransId])
  @@index([eventDate])
```

```prisma
// InvoiceType — ADD:
  DEPOSIT           // záloha
  DEPOSIT_SETTLE    // vyúčtování zálohy
```

---

## 4. Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMIN creates reservation (POST /api/reservations)              │
│ → createProductReservation() with eventDate                     │
│ → status = PENDING, paymentDueDate = now + 3h                  │
│ → depositAmount = lineTotal / 2 (50%)                          │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTO: Create DEPOSIT invoice (type=DEPOSIT, status=AWAITING)    │
│ → amount = depositAmount (50% of lineTotal)                     │
│ → variableSymbol = reservationNumber                            │
│ → Link: reservation.depositInvoiceId = invoice.id               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTO: Create Comgate payment for deposit amount                 │
│ → createPayment({ price: depositAmount, refId: resNumber })     │
│ → Store comgateTransId on reservation                           │
│ → Create Payment record linked to deposit invoice               │
│ → Return redirect URL (for admin to send to customer)           │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTO: Send email to customer with payment link                  │
│ → Subject: "Záloha za rezervaci {number}"                       │
│ → Body: Product info, deposit amount, payment link, 3h deadline │
│ → Payment link = Comgate redirect URL                           │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├──── CUSTOMER PAYS within 3h ────┐
           │                                  │
           ▼                                  ▼
┌────────────────────────┐    ┌──────────────────────────────────┐
│ 3h EXPIRES (cron)      │    │ Comgate callback → PAID           │
│ → status = EXPIRED     │    │ → Mark deposit invoice PAID       │
│ → Cancel Comgate pmt   │    │ → reservation.depositPaidAt=now   │
│ → Stock released       │    │ → reservation.status = PAID       │
│ → Notify admin         │    │ → Notify admin + customer         │
│ → Invoice → CANCELLED  │    │ → Confirm email to customer       │
└────────────────────────┘    └──────────┬───────────────────────┘
                                         │
                                         │ (wait until eventDate)
                                         ▼
                              ┌──────────────────────────────────┐
                              │ EVENT DATE (manual or cron)       │
                              │ Admin clicks "Complete" or auto   │
                              │                                   │
                              │ 1. Create Sale from reservation   │
                              │ 2. Create DEPOSIT_SETTLE invoice  │
                              │    → total = lineTotal            │
                              │    → deposit deducted (záloha)    │
                              │    → remaining = lineTotal - dep. │
                              │ 3. Send settlement invoice email  │
                              │ 4. reservation.status = COMPLETED │
                              └──────────────────────────────────┘
```

---

## 5. API Changes

### 5.1 POST `/api/reservations` — Modify creation flow

**Current:** Creates reservation only.
**New:** After creating reservation:
1. Calculate `depositAmount = Math.round(lineTotal / 2)` (round up to nearest haléř)
2. Create deposit Invoice (type=DEPOSIT, status=AWAITING)
3. Create Comgate payment for deposit
4. Store `comgateTransId` on reservation
5. Create Payment record linking Comgate transId to deposit invoice
6. Send deposit email to `contactEmail` with payment link
7. Return reservation + payment redirect URL

**New input fields:**
- `eventDate` (required) — the planned pickup/event date
- `paymentDueDate` override removed — always 3 hours from now

### 5.2 POST `/api/reservations/[id]` — Modify actions

**Modify `complete` action:**
1. Current: Creates Sale → Invoice (full amount)
2. New: Creates Sale → Settlement Invoice (DEPOSIT_SETTLE type)
   - Settlement invoice shows: total amount, minus deposit already paid, remaining due
   - If remaining is 0 (edge case), invoice status = PAID
   - If remaining > 0, invoice status = AWAITING (or send Comgate link for card payment)

**New action: `send_payment_link`** (re-send payment link if customer lost it):
- Only for PENDING reservations with existing comgateTransId
- Returns the Comgate redirect URL

### 5.3 POST `/api/comgate/callback` — Add reservation deposit handling

**New path** (third case after Payment and Order checks):

```typescript
// Check if transId belongs to a ProductReservation deposit
const reservation = await prisma.productReservation.findFirst({
  where: { comgateTransId: transId },
});

if (reservation) {
  if (verified.status === "PAID" && reservation.status === "PENDING") {
    // Mark deposit as paid
    await prisma.productReservation.update({
      where: { id: reservation.id },
      data: {
        status: "PAID",
        depositPaidAt: new Date(),
        paidAt: new Date(),
        paymentNote: `Záloha zaplacena online (Comgate ${transId})`,
      },
    });

    // Mark deposit invoice as PAID
    if (reservation.depositInvoiceId) {
      await prisma.invoice.update({
        where: { id: reservation.depositInvoiceId },
        data: { status: "PAID" },
      });
    }

    // Notify + send confirmation email
  } else if (verified.status === "CANCELLED") {
    // Cancel only if still PENDING
  }
}
```

### 5.4 Cron: Expire reservations — 3-hour cycle

**Current schedule:** Not in vercel.json at all.
**Required:** Must run frequently enough to catch 3-hour deadlines.

**Option A (recommended):** Add to vercel.json with `"schedule": "*/15 * * * *"` (every 15 minutes)
- Acceptable granularity for 3-hour expiry (max 15min late)
- Vercel hobby plan supports up to 2 cron jobs, Pro plan supports more

**Option B:** Use Vercel Edge Middleware with custom scheduling
- Overkill for this use case

**Cron route modifications:**
1. When expiring a reservation that has `comgateTransId`:
   - Call `cancelPayment(comgateTransId)` to cancel the Comgate payment
   - Mark deposit invoice as CANCELLED
2. Send expiry notification email to customer

### 5.5 NEW: Cron for settlement reminders (optional, Phase 2)

`/api/cron/reservation-settlement` — runs daily at 8:00
- Find reservations where `status = PAID` and `eventDate <= today`
- Notify admin that these reservations are due for completion/pickup

---

## 6. Comgate Integration for Reservation Deposits

### Payment Creation
```typescript
const comgateResult = await createPayment({
  price: depositAmount,              // 50% of lineTotal, in haléře
  label: `Zal ${reservationNumber}`, // max 16 chars: "Zal RES-20260721"
  refId: reservationNumber,          // variable symbol
  email: contactEmail,
  fullName: contactName,
  method: "ALL",                     // includes card, Apple Pay, QR
  lang: "cs",
});
```

### Callback Handling
- Same endpoint `/api/comgate/callback` — add third lookup path for ProductReservation
- Lookup order: Payment → Order → ProductReservation (by comgateTransId)

### Payment Cancellation (on expiry)
```typescript
if (reservation.comgateTransId) {
  await cancelPayment(reservation.comgateTransId);
}
```

---

## 7. Invoice Handling

### 7.1 Deposit Invoice (záloha)

Created at reservation time. **NOT** linked to a Sale (sale doesn't exist yet).

```typescript
// New function in src/lib/invoicing.ts
export async function createDepositInvoice(
  reservation: ProductReservation,
  companyId?: string
): Promise<Invoice> {
  // Create invoice with:
  // type: "DEPOSIT"
  // total: reservation.depositAmount (50%)
  // status: "AWAITING"
  // dueDate: reservation.paymentDueDate (3h from now)
  // variableSymbol: reservation.reservationNumber
  // note: "Záloha 50% — rezervace {number}"
  // saleId: null (no sale yet)
  // Items: single line item describing the reserved product
}
```

### 7.2 Settlement Invoice (vyúčtování zálohy)

Created at completion/pickup time. Linked to the Sale.

```typescript
// New function in src/lib/invoicing.ts
export async function createSettlementInvoice(
  saleId: string,
  depositInvoice: Invoice,
  companyId?: string
): Promise<Invoice> {
  // Create invoice with:
  // type: "DEPOSIT_SETTLE"
  // Items: full product lines (same as normal invoice)
  // Plus: negative line "Záloha č. {depositInvoice.number}" = -depositAmount
  // total: lineTotal - depositAmount (the remaining 50%)
  // status: "AWAITING" (customer needs to pay remaining)
  // note: "Vyúčtování zálohy — rezervace {number}"
}
```

### 7.3 Accounting Treatment

| Event | Invoice Type | Amount | Accounting |
|-------|-------------|--------|------------|
| Reservation created | DEPOSIT | 50% of total | Záloha přijatá (324) — not revenue |
| Deposit paid | — | — | Cash/Bank → 324 |
| Pickup/completion | DEPOSIT_SETTLE | 100% total minus deposit | Revenue (604) recognized |
| | | Deposit line: -50% | 324 → cleared |
| | | Net payable: 50% | Customer pays remaining |

---

## 8. Email Templates Needed

### 8.1 Deposit Payment Request
- **Trigger:** Reservation created
- **To:** Customer contactEmail
- **Subject:** "Záloha za rezervaci #{number} — Hairland"
- **Body:** Product details, deposit amount, payment link (Comgate redirect), 3h deadline
- **Payment link button:** Direct link to Comgate gateway

### 8.2 Deposit Paid Confirmation
- **Trigger:** Comgate callback → PAID
- **To:** Customer contactEmail
- **Subject:** "Záloha přijata — rezervace #{number} — Hairland"
- **Body:** Confirmation, event date reminder, what happens next

### 8.3 Reservation Expired
- **Trigger:** Cron expiry
- **To:** Customer contactEmail
- **Subject:** "Rezervace #{number} expirovala — Hairland"
- **Body:** Deposit not paid in time, reservation cancelled, can create new one

### 8.4 Settlement Invoice
- **Trigger:** Reservation completed / pickup
- **To:** Customer contactEmail
- **Subject:** "Doplatek za rezervaci #{number} — Hairland"
- **Body:** Settlement invoice, remaining amount, payment info

---

## 9. Files to Modify

### Database
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DEPOSIT`, `DEPOSIT_SETTLE` to InvoiceType; add `comgateTransId`, `depositAmount`, `depositPaidAt`, `eventDate`, `depositInvoiceId`, `settlementInvoiceId` to ProductReservation; add indexes |

### Backend Logic
| File | Change |
|------|--------|
| `src/lib/reservations.ts` | Update `createProductReservation()` to accept `eventDate`, set 3h default deadline, calculate `depositAmount`; add `createDepositForReservation()` helper |
| `src/lib/invoicing.ts` | Add `createDepositInvoice()` and `createSettlementInvoice()` functions |
| `src/lib/comgate.ts` | No changes needed (existing functions sufficient) |

### API Routes
| File | Change |
|------|--------|
| `src/app/api/reservations/route.ts` | POST: after creating reservation, create deposit invoice + Comgate payment + send email; return payment link |
| `src/app/api/reservations/[id]/route.ts` | Modify `complete` action to create settlement invoice instead of full invoice; add `send_payment_link` action |
| `src/app/api/comgate/callback/route.ts` | Add third lookup path for ProductReservation by comgateTransId |
| `src/app/api/cron/expire-reservations/route.ts` | Add Comgate payment cancellation on expiry; cancel deposit invoice; send expiry email |

### Configuration
| File | Change |
|------|--------|
| `vercel.json` | Add expire-reservations cron: `"*/15 * * * *"` |

### Email
| File | Change |
|------|--------|
| `src/lib/email-templates.ts` | Add 4 new templates: deposit request, deposit paid, reservation expired, settlement invoice |

### Validation
| File | Change |
|------|--------|
| `src/lib/validations/reservation.ts` | Add `eventDate` field (required DateTime); remove or make `paymentDueDate` auto-calculated |

### Frontend (admin panel)
| File | Change |
|------|--------|
| Reservation create form | Add `eventDate` date picker; remove `paymentDueDate` manual input (auto 3h); show payment link after creation |
| Reservation detail page | Show deposit status, payment link, Comgate transId; show settlement invoice after completion |
| Reservation list/calendar | Show deposit payment status indicator |

---

## 10. Migration Strategy

### Phase 1: Core (this task)
1. Database migration (new fields + enum values)
2. Deposit invoice creation on reservation
3. Comgate payment integration for deposits
4. Comgate callback handler for reservations
5. 3-hour expiry with Comgate cancellation
6. Settlement invoice on completion
7. Email templates (deposit request + confirmation)
8. Cron schedule in vercel.json

### Phase 2: Polish (follow-up)
1. Admin UI: payment link display + copy button
2. Admin UI: event date picker in reservation form
3. Settlement reminder cron (daily check for due pickups)
4. Reservation expiry email to customer
5. Re-send payment link action
6. QR code display for bank transfer (for the settlement invoice remaining amount)

---

## 11. Edge Cases & Considerations

1. **Rounding:** `depositAmount = roundHalereUp(lineTotal / 2)`. Settlement = `lineTotal - depositAmount`. This ensures no haléř is lost.

2. **Customer pays deposit but never picks up:** Reservation stays PAID indefinitely. Admin can manually cancel + potentially refund via `refundPayment()`. Consider adding auto-refund logic in Phase 2.

3. **Partial payment / overpayment:** Comgate handles exact amounts. No partial payment scenario exists.

4. **Discount on reservation:** Deposit is 50% of the already-discounted `lineTotal`. Discount is applied before splitting.

5. **BY_PIECE vs BY_GRAM:** No impact on deposit logic. Price is already calculated in `lineTotal`.

6. **Existing reservations:** Migration is backward-compatible. Existing reservations without `comgateTransId` continue to work as before (manual payment flow). New flow only applies when deposit is created.

7. **Bank account on settlement:** Settlement invoice should show bank account 7141812004/5500 (Raiffeisenbank) for transfer payment, or offer Comgate card payment link.

8. **VAT:** Both deposit and settlement invoices include 21% VAT. The deposit invoice is a daňový doklad zálohy. Settlement invoice references the deposit and deducts it.

9. **Invoice numbering:** Both deposit and settlement invoices use the same sequential numbering (InvoiceCounter). They get separate numbers in the same sequence.

10. **Concurrent cron runs:** `expireOverdueReservations()` uses `status: "PENDING"` in WHERE — safe for concurrent runs.

---

## 12. Testing Checklist

- [ ] Create reservation → deposit invoice generated with correct 50% amount
- [ ] Comgate payment created → redirect URL returned
- [ ] Customer pays via Comgate → callback marks deposit PAID
- [ ] 3-hour expiry → reservation EXPIRED, Comgate cancelled, invoice CANCELLED
- [ ] Complete reservation → settlement invoice with deposit deduction
- [ ] Settlement invoice total = lineTotal - depositAmount
- [ ] Email sent on deposit creation, payment, expiry
- [ ] Existing reservations (without deposit) still work
- [ ] BY_PIECE reservation deposit works correctly
- [ ] Discounted reservation deposit calculates correctly
- [ ] Cron runs every 15 minutes, catches expired deposits
