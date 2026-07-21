# TASK-103: NotificationBell Click Does Nothing

## Problem

User clicks on a notification in the bell dropdown — nothing happens except marking it as read (if unread). No navigation to the relevant entity (order, reservation, invoice, etc.).

## Root Cause

**`src/components/NotificationBell.tsx` line 150-156:**

```tsx
<div
  key={n.id}
  className={`... cursor-pointer hover:bg-nude-50 ...`}
  onClick={() => !n.read && handleMarkRead(n.id)}
>
```

The click handler ONLY calls `handleMarkRead(n.id)` which marks the notification as read via `PUT /api/notifications/{id}`. There is **no navigation logic** at all.

### Additional issues found:

1. **`NotificationItem` interface (line 7-14) is missing the `data` field** — the API returns `data: Json?` from the DB but the frontend interface doesn't include it, so even if we wanted to navigate, we don't have the entity IDs.

2. **The "View All" link (line 176-180) points to `/notifications`** — this route/page **does not exist** (no `src/app/(app)/notifications/` directory). Clicking it results in a 404.

3. **Notifications already store navigation data** — all `createNotificationForRole()` and `createSalonNotification()` calls pass a `data` object with entity IDs that could be used for navigation. Examples from codebase:

| NotificationType | `data` field content | Target URL |
|---|---|---|
| `NEW_ORDER` | `{ orderId, orderNumber }` | `/orders/{orderId}` |
| `ORDER_CONFIRMED` | `{ orderId, orderNumber }` | `/orders/{orderId}` |
| `ORDER_REJECTED` | `{ orderId, orderNumber }` | `/orders/{orderId}` |
| `ORDER_READY` | `{ orderId }` or `{ saleId }` | `/orders/{orderId}` |
| `ORDER_IN_TRANSIT` | `{ orderId, orderNumber }` | `/orders/{orderId}` |
| `RESERVATION_CREATED` | `{ reservationId, reservationNumber }` | `/reservations/{reservationId}` |
| `RESERVATION_PAID` | `{ reservationId }` | `/reservations/{reservationId}` |
| `RESERVATION_EXPIRED` | (none) | `/reservations` |
| `INCOMING_PAYMENT` | `{ invoiceId, amount, invoiceNumber }` | `/invoices/{invoiceId}` |
| `INVOICE_ISSUED` | `{ invoiceId, invoiceNumber }` | `/invoices/{invoiceId}` |
| `INVOICE_PAID` | `{ invoiceId, invoiceNumber }` | `/invoices/{invoiceId}` |
| `PAYMENT_REMINDER` | `{ invoiceId }` | `/invoices/{invoiceId}` |
| `RETURN_REQUEST` | `{ saleId }` | `/returns` or `/sales/{saleId}` |
| `NEW_COMPLAINT` | `{ complaintId }` | `/complaints/{complaintId}` |
| `SAMPLE_REQUEST` | `{ sampleId }` | `/samples` |
| `NEW_REVIEW` | (none) | `/reviews` |
| `NEW_CONTACT` | (none) | `/inquiries` |
| `NEW_INQUIRY` | (none) | `/inquiries` |
| `REGISTRATION` | (none) | `/salons` |
| `REFERRAL_USED` | (none) | `/referrals` |

---

## Implementation Plan

### Fix 1: Add `data` to NotificationItem interface and API fetch

**File:** `src/components/NotificationBell.tsx`

Update the interface (line 7-14):
```typescript
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown> | null;  // ADD THIS
}
```

The API (`/api/notifications` GET) already returns the full notification object including `data` field from Prisma — no backend change needed.

### Fix 2: Add URL resolver function

**File:** `src/components/NotificationBell.tsx`

Add a function that maps notification type + data to a URL:

```typescript
function getNotificationHref(n: NotificationItem): string | null {
  const d = n.data as Record<string, string> | null;
  if (!d) return null;

  switch (n.type) {
    case "NEW_ORDER":
    case "ORDER_CONFIRMED":
    case "ORDER_REJECTED":
    case "ORDER_READY":
    case "ORDER_IN_TRANSIT":
      return d.orderId ? `/orders/${d.orderId}` : null;
    case "RESERVATION_CREATED":
    case "RESERVATION_PAID":
      return d.reservationId ? `/reservations/${d.reservationId}` : null;
    case "RESERVATION_EXPIRED":
      return "/reservations";
    case "INCOMING_PAYMENT":
    case "INVOICE_ISSUED":
    case "INVOICE_PAID":
    case "PAYMENT_REMINDER":
      return d.invoiceId ? `/invoices/${d.invoiceId}` : null;
    case "RETURN_REQUEST":
      return d.saleId ? `/sales/${d.saleId}` : "/returns";
    case "NEW_COMPLAINT":
      return d.complaintId ? `/complaints/${d.complaintId}` : "/complaints";
    case "SAMPLE_REQUEST":
      return "/samples";
    case "NEW_REVIEW":
      return "/reviews";
    case "NEW_CONTACT":
    case "NEW_INQUIRY":
      return "/inquiries";
    case "REGISTRATION":
      return "/salons";
    case "REFERRAL_USED":
      return "/referrals";
    default:
      return null;
  }
}
```

### Fix 3: Replace div with Link for clickable notifications

**File:** `src/components/NotificationBell.tsx`

Change the notification item rendering (line 149-172). Replace the `<div onClick>` with a conditional `<Link>` or `<div>`:

```tsx
import { useRouter } from "next/navigation";

// In component:
const router = useRouter();

// In the map (line 149):
{notifications.map((n) => {
  const href = getNotificationHref(n);
  return (
    <div
      key={n.id}
      className={`px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-nude-50 ${
        !n.read ? "bg-rose/10" : ""
      }`}
      onClick={() => {
        if (!n.read) handleMarkRead(n.id);
        if (href) {
          setIsOpen(false);
          router.push(href);
        }
      }}
    >
      {/* ... same content ... */}
    </div>
  );
})}
```

**Note:** Using `router.push()` instead of `<Link>` because we need to both mark-as-read AND navigate in the same click, and close the dropdown.

### Fix 4: Fix "View All" link or remove it

**File:** `src/components/NotificationBell.tsx`

The "View All" link (line 176-180) points to `/notifications` which doesn't exist.

**Option A (simple):** Remove the "View All" link entirely — the bell dropdown already shows the 10 most recent.

**Option B (if notifications page is wanted later):** Create `src/app/(app)/notifications/page.tsx` — but this is a separate task.

**Recommendation:** Option A for now. Remove lines 176-180.

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/NotificationBell.tsx` | Add `data` to interface, add URL resolver, add navigation on click, fix/remove "View All" |

## No Backend Changes Needed

The API already returns the `data` field. All notification creators already pass `data` with entity IDs. The only fix is in the frontend component.

## Testing

- Click notification with order data → should navigate to `/orders/{id}`
- Click notification with reservation data → should navigate to `/reservations/{id}`
- Click notification with invoice data → should navigate to `/invoices/{id}`
- Click unread notification → should mark as read AND navigate
- Click notification without data/unknown type → should only mark as read (no navigation)
- Dropdown should close after clicking any notification that navigates
