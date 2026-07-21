# TASK-101: 6 Calendar/Reservation Improvements — Status & Plan

**Task:** #40
**Datum:** 2026-07-20

---

## Status Check — Already Implemented (from TASK-097)

Items 2-6 were planned in TASK-097 and are **already implemented** in the current codebase:

| # | Improvement | Status | Evidence |
|---|-------------|--------|----------|
| 2 | Click-to-detail | DONE | All entries use `<Link>` — reservations, sales, orders, deliveries all link to detail pages (ReservationsCalendar.tsx:298-303, 834-972) |
| 3 | Calendar filters | DONE | Filter chips with localStorage persistence (lines 356-371, 546-576), entries filtered in `byDay` useMemo (lines 429-470) |
| 4 | Grey color fixes | DONE | `WRITEOFF = "bg-amber-300"`, `CANCELLED = "bg-red-300"`, cancelled entries shown with `opacity-50` (lines 83-99, 198-204) |
| 5 | Weekly view | DONE | Month/week toggle (lines 345-353, 649-666), week grid with WeekDayEntry (lines 682-719), week navigation (lines 481-490) |
| 6 | Discount column in reservations list | DONE | `ReservationsClient.tsx` has discount column (lines 21-22, 140, 176-184), shows `-{amount} ({percent}%)` or "—" |

---

## Item 1: Payment Gateway Prep — NOT YET IMPLEMENTED

### Current State

**Existing payment flow (Orders only):**
- `src/lib/comgate.ts` — Comgate API client (createPayment, getPaymentStatus, refundPayment, cancelPayment)
- `src/app/api/public/orders/route.ts` — creates Comgate payment for CARD orders → redirects to Comgate
- `src/app/api/comgate/callback/route.ts` — webhook handles Order payment (PAID → createSaleFromOrder)
- `src/app/api/admin/comgate/create/route.ts` — manual Comgate payment creation
- `src/app/api/admin/comgate/refund/route.ts` — refund endpoint
- `src/app/api/admin/comgate/status/route.ts` — status check

**Reservation payment flow (manual only):**
- `src/app/api/reservations/[id]/route.ts` — action `mark_paid` sets status to PAID manually
- `src/app/api/reservations/[id]/route.ts` — action `complete` creates Sale + Invoice from reservation
- No online payment gateway for reservations
- `ProductReservation` model has NO `comgateTransId` field

### Plan

#### Step 1.1: Payment Provider Interface

**File:** `src/lib/payment-gateway.ts` (NEW)

```ts
export interface PaymentProvider {
  createPayment(params: {
    amount: number;       // halere
    label: string;        // max 16 chars for Comgate
    refId: string;        // variable symbol / ref ID
    email: string;
    name?: string;
    lang?: string;
  }): Promise<{
    success: boolean;
    transId?: string;
    redirect?: string;
    error?: string;
  }>;

  getStatus(transId: string): Promise<{
    success: boolean;
    status?: "PENDING" | "PAID" | "CANCELLED";
  }>;

  parseCallback(request: Request): Promise<{
    transId: string;
    status: string;
    merchant?: string;
  } | null>;
}
```

#### Step 1.2: Comgate Adapter

**File:** `src/lib/payment-gateway.ts` (same file)

Wrap existing `src/lib/comgate.ts` functions into `PaymentProvider` interface:

```ts
import { createPayment, getPaymentStatus } from "./comgate";

const comgateProvider: PaymentProvider = {
  async createPayment(params) {
    return createPayment({
      price: params.amount,
      label: params.label,
      refId: params.refId,
      email: params.email,
      fullName: params.name,
      lang: params.lang,
    });
  },
  async getStatus(transId) {
    const result = await getPaymentStatus(transId);
    return {
      success: result.success,
      status: result.status as "PENDING" | "PAID" | "CANCELLED" | undefined,
    };
  },
  async parseCallback(request) {
    const formData = await request.formData();
    const transId = formData.get("transId") as string;
    const status = formData.get("status") as string;
    const merchant = formData.get("merchant") as string;
    if (!transId || !status) return null;
    return { transId, status, merchant };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return comgateProvider;
}
```

**IMPORTANT:** Do NOT modify existing `comgate.ts` or `comgate/callback/route.ts`. This is an abstraction layer on top.

#### Step 1.3: Schema — Add `comgateTransId` to ProductReservation

**File:** `prisma/schema.prisma` (model ProductReservation, after line 1182)

```prisma
  comgateTransId    String?           @unique
```

**Migration script:** `scripts/migrate-reservation-comgate.ts`

```sql
ALTER TABLE product_reservations ADD COLUMN comgateTransId TEXT UNIQUE;
```

#### Step 1.4: Reservation Payment API Endpoint

**File:** `src/app/api/reservations/[id]/pay/route.ts` (NEW)

Creates a payment gateway session for a reservation:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payment-gateway";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reservation = await prisma.productReservation.findUniqueOrThrow({
    where: { id },
    include: {
      salon: { select: { email: true, name: true } },
      customer: { select: { email: true, name: true } },
    },
  });

  if (reservation.status !== "PENDING")
    return NextResponse.json({ error: "Only PENDING reservations can be paid" }, { status: 400 });

  // Determine email
  const email = reservation.contactEmail
    ?? reservation.salon?.email
    ?? reservation.customer?.email;
  if (!email)
    return NextResponse.json({ error: "No email for payment" }, { status: 400 });

  const name = reservation.contactName
    ?? reservation.salon?.name
    ?? reservation.customer?.name
    ?? "";

  const provider = getPaymentProvider();
  const result = await provider.createPayment({
    amount: reservation.lineTotal - (reservation.discountAmount ?? 0),
    label: `RES-${reservation.reservationNumber ?? id.slice(0, 8)}`,
    refId: reservation.reservationNumber ?? id,
    email,
    name,
    lang: "cs",
  });

  if (!result.success || !result.transId)
    return NextResponse.json({ error: result.error ?? "Payment creation failed" }, { status: 500 });

  // Store transId
  await prisma.productReservation.update({
    where: { id },
    data: { comgateTransId: result.transId },
  });

  return NextResponse.json({
    redirect: result.redirect,
    transId: result.transId,
  });
}
```

#### Step 1.5: Extend Comgate Callback for Reservations

**File:** `src/app/api/comgate/callback/route.ts`

After the existing order lookup (line 36-109), add a reservation lookup:

```ts
// After order handling block, add:

// Check if this transId belongs to a ProductReservation
const reservation = await prisma.productReservation.findFirst({
  where: { comgateTransId: transId },
});

if (reservation) {
  if (verified.status === "PAID" && reservation.status === "PENDING") {
    await prisma.productReservation.update({
      where: { id: reservation.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentNote: `Online platba (Comgate ${transId})`,
      },
    });

    // Notify owners
    await createNotificationForRole({
      role: "OWNER",
      type: "RESERVATION_PAID",
      title: `Rezervace zaplacena online: ${reservation.reservationNumber}`,
      message: `Rezervace ${reservation.reservationNumber} byla zaplacena online kartou.`,
      data: { reservationId: reservation.id },
    });

    revalidateTag("dashboard", "max");
  } else if (verified.status === "CANCELLED") {
    // Clear transId so user can retry
    await prisma.productReservation.update({
      where: { id: reservation.id },
      data: { comgateTransId: null },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
```

#### Step 1.6: Frontend — "Pay Online" Button on Reservation Detail

**File:** `src/app/(app)/reservations/[id]/ReservationDetailClient.tsx`

Add a "Pay Online" button for PENDING reservations alongside the existing "Mark as Paid" button:

```tsx
{reservation.status === "PENDING" && isStaff && (
  <Button
    onClick={async () => {
      const res = await fetch(`/api/reservations/${reservation.id}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        setError(data.error || "Chyba platby");
      }
    }}
    variant="secondary"
  >
    Zaplatit online
  </Button>
)}
```

---

## Files to Modify / Create

| # | File | Action | Item |
|---|------|--------|------|
| 1 | `src/lib/payment-gateway.ts` | NEW | Payment provider interface + Comgate adapter |
| 2 | `prisma/schema.prisma` | MODIFY | Add `comgateTransId` to ProductReservation |
| 3 | `scripts/migrate-reservation-comgate.ts` | NEW | Turso migration script |
| 4 | `src/app/api/reservations/[id]/pay/route.ts` | NEW | Payment initiation endpoint |
| 5 | `src/app/api/comgate/callback/route.ts` | MODIFY | Add reservation payment handling |
| 6 | `src/app/(app)/reservations/[id]/ReservationDetailClient.tsx` | MODIFY | Add "Pay Online" button |

## Implementation Order

1. Schema migration (Step 1.3) — must be first, deploys column
2. Payment provider interface (Steps 1.1 + 1.2) — no dependencies
3. Pay endpoint (Step 1.4) — depends on 1 + 2
4. Callback extension (Step 1.5) — depends on 1
5. Frontend button (Step 1.6) — depends on 3

## Notes

- Items 2-6 from the original task description are ALREADY IMPLEMENTED in the codebase (from TASK-097 implementation)
- This plan focuses solely on the remaining item: payment gateway prep
- The existing Comgate integration for Orders MUST NOT be modified — the new abstraction wraps it
- Future providers (Stripe, GoPay) would implement the same `PaymentProvider` interface
- The payment amount should be `lineTotal - discountAmount` (net amount after discount)
