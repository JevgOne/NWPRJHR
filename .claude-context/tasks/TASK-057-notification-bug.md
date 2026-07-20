# TASK-057: Bug — Notification for NEW_INQUIRY opens Orders instead of Inquiries

## Bug

Clicking a "Nova poptavka" notification navigates to the Orders page instead of the Inquiries page.

## Root Cause

**File:** `src/app/(app)/notifications/NotificationsClient.tsx`, line 29

```typescript
case "NEW_INQUIRY":
  return d.inquiryId ? `/orders?tab=inquiries` : "/orders";
```

This routes to `/orders?tab=inquiries`, but:
1. The inquiries page is a **standalone route** at `/inquiries` — it is NOT a tab within orders
2. The orders page (`OrdersClient`) has **no tab parameter handling** — `?tab=inquiries` is silently ignored
3. Result: user sees the orders list instead of inquiries

## Fix

**Single line change** in `src/app/(app)/notifications/NotificationsClient.tsx`, line 29:

```typescript
// BEFORE:
case "NEW_INQUIRY":
  return d.inquiryId ? `/orders?tab=inquiries` : "/orders";

// AFTER:
case "NEW_INQUIRY":
  return "/inquiries";
```

No `d.inquiryId` routing needed — `InquiriesClient` is a single-page list with no `/inquiries/[id]` detail route.

## Verification

No other files contain inquiry notification routing logic:
- `src/components/AppShell.tsx` — notification badge links to `/notifications` page only, no inline routing
- `src/lib/notifications.ts` — defines display text (title/message) only, no URLs
- The `getNotificationUrl()` function in `NotificationsClient.tsx` is the **only place** notification click routing is defined

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(app)/notifications/NotificationsClient.tsx` | Line 29: change `/orders?tab=inquiries` to `/inquiries` |
