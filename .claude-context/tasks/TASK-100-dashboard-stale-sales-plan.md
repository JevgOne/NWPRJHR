# TASK-100: Dashboard Stale/Cached Sales Data After Cancellation

## Problem

After cancelling a sale, the dashboard continues to show stale data (sales counts, revenue, stock numbers). The user sees "deleted" (cancelled) sales still reflected in dashboard statistics.

---

## Root Cause Analysis

### The dashboard uses a **3-layer caching stack** that creates staleness:

### Layer 1: `unstable_cache` with 60s TTL + `"dashboard"` tag
**File:** `src/app/(app)/dashboard/page.tsx:39-141`

```ts
const getCachedDashboardData = unstable_cache(
  async (userId: string) => { /* 12 parallel DB queries */ },
  ["dashboard-data"],
  { revalidate: 60, tags: ["dashboard"] }
);
```

- Cache key includes `userId`, so each user gets their own cached copy
- `revalidate: 60` means even WITHOUT tag invalidation, data refreshes every 60s
- `tags: ["dashboard"]` allows on-demand invalidation via `revalidateTag("dashboard", ...)`

### Layer 2: Next.js Full Route Cache (the real problem)
- `DashboardPage` is a **Server Component** with no `export const dynamic = "force-dynamic"`
- Next.js caches the **entire rendered RSC output** of the page at build time and on first request
- Even when `unstable_cache` data is invalidated via tag, the **Full Route Cache** may still serve the old HTML
- In Next.js 15+, the Full Route Cache is opt-in for most pages, BUT pages using `unstable_cache` can still be statically cached

### Layer 3: Client-side Router Cache
- Next.js maintains a client-side cache of visited routes
- In Next.js 15+, the default `staleTimes.dynamic` is 0 (no client cache for dynamic pages)
- BUT if the page is treated as static (due to `unstable_cache`), it gets cached client-side for 5 minutes (default `staleTimes.static`)
- Navigation back to `/dashboard` may serve the stale client-cached version

---

## Bugs Found

### Bug 1: `revalidateTag("dashboard", "max")` — possibly ineffective with `unstable_cache`

**Severity:** HIGH

**Files affected:**
- `src/app/api/sales/[id]/route.ts:157` — sale cancel
- `src/app/api/sales/route.ts:139` — sale create  
- `src/app/api/deliveries/route.ts:264,314` — delivery create
- `src/app/api/deliveries/[id]/route.ts:203` — delivery update
- `src/app/api/orders/[id]/route.ts:247,447,509` — order actions
- `src/app/api/comgate/callback/route.ts:67` — payment callback

**Problem:** In Next.js 16, `revalidateTag(tag, profile)` signature takes a cache profile as second argument. The `"max"` profile may not match the `unstable_cache` configuration which uses `{ revalidate: 60, tags: ["dashboard"] }`. The `unstable_cache` doesn't specify a `cacheLife` profile — it uses the old `revalidate` option. There's a potential API mismatch between the new `revalidateTag(tag, profile)` and the old `unstable_cache` tag system.

**Investigation needed:** Verify if `revalidateTag("dashboard", "max")` actually invalidates caches tagged with `["dashboard"]` in `unstable_cache`. The second arg `"max"` is a `cacheLife` profile, not a second tag — but does it filter which caches get invalidated?

**Fix (safe approach):**
```ts
// Change all revalidateTag calls from:
revalidateTag("dashboard", "max");
// To:
revalidateTag("dashboard");
```

If the `profile` parameter acts as a filter (only invalidate caches with that profile), then specifying `"max"` would NOT invalidate the dashboard cache which has `revalidate: 60` (not `"max"` profile).

### Bug 2: No Full Route Cache invalidation for dashboard page

**Severity:** HIGH

**File:** `src/app/(app)/dashboard/page.tsx`

**Problem:** The dashboard is a Server Component page. Even when `unstable_cache` data is invalidated, the Full Route Cache may not be cleared. `revalidateTag` invalidates Data Cache entries, but may not trigger a Full Route Cache purge for the page.

**Fix option A — force dynamic rendering:**
```ts
// Add to dashboard/page.tsx
export const dynamic = "force-dynamic";
```
This bypasses Full Route Cache entirely. The `unstable_cache` still provides data-level caching (60s TTL), so performance is preserved.

**Fix option B — add `revalidatePath` alongside `revalidateTag`:**
```ts
// In each mutation endpoint, after revalidateTag:
revalidatePath("/dashboard");
```
This explicitly purges the Full Route Cache for the dashboard page.

### Bug 3: `confirm-payment` endpoint missing `revalidateTag("dashboard")`

**Severity:** MEDIUM

**File:** `src/app/api/sales/[id]/confirm-payment/route.ts`

**Problem:** When admin confirms payment (creates invoice + marks as PAID), dashboard stats should update:
- "Awaiting payment" count should decrease (line 78-82 of dashboard query checks `invoice: { is: null }`)
- But NO `revalidateTag("dashboard")` is called

**Fix:**
```ts
// Add after line 66 (after the $transaction):
import { revalidateTag } from "next/cache";
// ...
revalidateTag("dashboard");
```

### Bug 4: Client-side Router Cache not cleared after mutations

**Severity:** MEDIUM

**Files:** `src/app/(app)/sales/[id]/SaleDetailClient.tsx:86-110`

**Problem:** After cancelling a sale, the client component reloads sale data via `fetch`, but doesn't call `router.refresh()`. When user navigates back to dashboard, the client-side Router Cache may serve the old page.

**Fix:**
```tsx
// In SaleDetailClient.tsx, after successful cancel:
import { useRouter } from "next/navigation";
// ...
const router = useRouter();
// After line 99 (setSale(data)):
router.refresh(); // Clear client Router Cache
```

---

## Implementation Plan

### Step 1: Fix `revalidateTag` calls (Bug 1)

Test whether `revalidateTag("dashboard", "max")` correctly invalidates `unstable_cache` entries tagged `["dashboard"]`. If not, remove the `"max"` profile argument from all calls. This is the most likely root cause.

**Files to modify (9 locations):**
- `src/app/api/sales/[id]/route.ts:157`
- `src/app/api/sales/route.ts:139`
- `src/app/api/deliveries/route.ts:264,314`
- `src/app/api/deliveries/[id]/route.ts:203`
- `src/app/api/orders/[id]/route.ts:247,447,509`
- `src/app/api/comgate/callback/route.ts:67`

### Step 2: Add `revalidatePath("/dashboard")` (Bug 2)

Add `revalidatePath("/dashboard", "page")` alongside `revalidateTag("dashboard")` in all mutation endpoints to ensure Full Route Cache is purged.

**Same files as Step 1, plus:**
- Need to import `revalidatePath` where not already imported

### Step 3: Add `revalidateTag` to `confirm-payment` (Bug 3)

**File:** `src/app/api/sales/[id]/confirm-payment/route.ts`

Add:
```ts
import { revalidateTag } from "next/cache";
// After line 66:
revalidateTag("dashboard");
revalidatePath("/dashboard", "page");
```

### Step 4: Add `router.refresh()` to sale detail client (Bug 4)

**File:** `src/app/(app)/sales/[id]/SaleDetailClient.tsx`

Add `useRouter` and call `router.refresh()` after cancel and after confirm-payment actions.

### Step 5 (optional): Force dynamic on dashboard

If Steps 1-4 don't fully resolve the issue, add `export const dynamic = "force-dynamic"` to the dashboard page. This is the nuclear option but guarantees fresh data on every navigation.

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/api/sales/[id]/route.ts` | Fix revalidateTag, add revalidatePath |
| 2 | `src/app/api/sales/route.ts` | Fix revalidateTag, add revalidatePath |
| 3 | `src/app/api/deliveries/route.ts` | Fix revalidateTag, add revalidatePath |
| 4 | `src/app/api/deliveries/[id]/route.ts` | Fix revalidateTag, add revalidatePath |
| 5 | `src/app/api/orders/[id]/route.ts` | Fix revalidateTag, add revalidatePath |
| 6 | `src/app/api/comgate/callback/route.ts` | Fix revalidateTag, add revalidatePath |
| 7 | `src/app/api/sales/[id]/confirm-payment/route.ts` | Add revalidateTag + revalidatePath |
| 8 | `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | Add router.refresh() |

## Testing

1. Create a sale, verify it appears in dashboard stats
2. Cancel the sale, immediately navigate to dashboard — stats should update
3. Confirm payment on a TRANSFER sale, verify "awaiting payment" count drops
4. Test with browser back/forward navigation to ensure Router Cache is cleared
