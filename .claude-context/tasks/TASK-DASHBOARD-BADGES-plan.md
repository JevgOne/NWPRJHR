# Task #2: Audit and Fix All Dashboard Badges

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

User complaint: badges/stat cards on the dashboard show placeholder or zero data. Every badge MUST show real data and link to the correct section.

---

## Current State Analysis

File: `src/app/(app)/dashboard/page.tsx`

The dashboard already fetches real data from Prisma (lines 53-125). All 11 queries fetch real data:

1. `salesThisMonth` -- aggregate from `prisma.sale`
2. `deliveriesWithProduct` -- real stock data from `prisma.delivery`
3. `openInvoices` -- real invoice data from `prisma.invoice`
4. `activeSalonsCount` -- `prisma.salon.count({ where: { archived: false } })`
5. `totalSalesEver` -- aggregate from `prisma.sale`
6. `lowStockVariants` -- raw SQL query for variants with <200g stock
7. `recentMovements` -- `prisma.stockMovement.findMany`
8. `pendingReturns` -- `prisma.return.count({ where: { status: "PENDING" } })`
9. `newOrders` -- `prisma.order.count({ where: { status: "NEW" } })`
10. `unreadNotifications` -- `prisma.notification.count({ where: { recipientId, read: false } })`
11. `pendingRegistrations` -- `prisma.salon.count({ where: { approved: false, archived: false } })`

### Issues Found

1. **"Prodano celkem" card (line 168-173)** -- shows `fmtGrams(0)` hardcoded! Should show total grams sold. The total grams is NOT being aggregated. Need to add a query or compute from sale items.

2. **Quick badges (lines 282-287)** -- These all show real data and are linked:
   - `activeSalonsCount` -> links to `/salons`
   - `pendingRegistrations` -> links to `/salons`
   - `newOrders` -> links to `/orders`
   - `unreadNotifications` -> links to `/notifications`

3. **`pendingReturns` (line 121)** -- fetched but NEVER displayed. This data is lost.

4. **No "Pending returns" badge** -- should be displayed somewhere.

---

## Implementation Steps

### Step 1: Fix "Prodano celkem" card -- show real total grams sold

**File:** `src/app/(app)/dashboard/page.tsx`

The sale items store `grams` per line item. Add a query to get total grams sold:

```typescript
// Add to the Promise.all array:
prisma.saleItem.aggregate({
  where: { sale: { status: "COMPLETED" } },
  _sum: { grams: true },
}),
```

Update destructuring to include this result and use it in the StatCard:
```tsx
// Replace fmtGrams(0) with:
fmtGrams(totalGramsSold._sum.grams ?? 0)
```

### Step 2: Display pending returns count

Add a 5th quick badge for pending returns:

```tsx
<a href="/returns"><QuickBadge label="Vratky k vyrizeni" value={pendingReturns} color={pendingReturns > 0 ? "amber" : "gray"} /></a>
```

This changes the grid from `grid-cols-2 lg:grid-cols-4` to `grid-cols-2 lg:grid-cols-5` (or keep 4 and wrap).

**Decision needed:** Check if `/returns` page exists. If not, link to somewhere sensible or skip this badge.

### Step 3: Verify all links work

- `/salons` -- exists (SalonsClient.tsx)
- `/orders` -- verify exists
- `/notifications` -- verify exists
- `/returns` -- verify exists

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(app)/dashboard/page.tsx` | Add totalGramsSold query, fix hardcoded `fmtGrams(0)`, optionally add pending returns badge |

## Dependencies

- Depends on Task #1 (inquiry tables) only if we want to add an inquiry count badge, which is NOT currently required.

## Risk

- LOW: purely UI/data display changes
- The `saleItem.aggregate` query should be fast with existing indexes on `sale_items`
