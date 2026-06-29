# TASK-001: Fix salon catalog order error — Implementation

## Status: DONE

## Root Cause

In `src/app/api/orders/route.ts:77`, when a SALON or HAIRDRESSER user submits an order,
the code used `session.user.salonId!` (non-null assertion) without checking if `salonId`
is actually present. When `salonId` is `null`, this null value is passed to
`createOrder()` which calls `prisma.salon.findUniqueOrThrow({ where: { id: null } })`.

Prisma validates the `id` field as CUID and throws:
**"The string did not match the expected pattern"**

## Fix Applied

**File:** `src/app/api/orders/route.ts` (line 77-80)

Added explicit null guard before using `salonId`, removed non-null assertion (`!`):

```typescript
if (!session.user.salonId) {
  return NextResponse.json({ error: "Salon account not linked. Contact support." }, { status: 403 });
}
salonId = session.user.salonId;
```

This is consistent with how other API routes (invoices, credit-notes, sales, salon-portal)
already guard against null salonId.

## Verification

- `npx tsc --noEmit` — passes with zero errors
