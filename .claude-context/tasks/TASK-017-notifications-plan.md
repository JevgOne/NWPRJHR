# Task #17: Notifications in Sidebar + Mark as Read on Click

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

User: "ty notrifikace musi bejt i v levo ve sloupci, jakmile notrifikaci rozkliknu tak musi zmizet tak jako normalne"

Two requirements:
1. Show notification count in the LEFT sidebar nav (not just the bell in the header)
2. When a notification is clicked/opened, mark it as read and remove from unread list

---

## Current State Analysis

### What exists:

- **`NotificationBell.tsx`** -- bell icon in top-right header with dropdown, shows unread count badge, polls every 30s, marks individual notifications read on click, has "mark all read" button
- **`/api/notifications`** GET -- returns `{ data, total, unreadCount }`, supports `?unread=true`
- **`/api/notifications/[id]`** PUT -- marks single notification as read (sets `read: true, readAt: new Date()`)
- **`/api/notifications`** PUT with `{ action: "read-all" }` -- marks all as read
- **`NotificationsClient.tsx`** -- full page at `/notifications` with list view, marks read on click
- **`AppShell.tsx`** -- sidebar has `/notifications` item? Let me check... NO -- there is NO notifications entry in the sidebar navItems (lines 24-44). The bell is only in the header (line 125).

### What's missing:

1. No "Oznameni" / "Notifications" entry in the sidebar
2. Mark-as-read on click already works in the bell dropdown and on the notifications page -- this is NOT broken

---

## Implementation Steps

### Step 1: Add notifications to sidebar with unread count badge

**File:** `src/components/AppShell.tsx`

This integrates with the Task #12 menu restructure. In the grouped navGroups structure, add a notifications item. It should go at the top level (visible to all roles) or in its own spot.

**Best placement:** Right after Dashboard (visible to everyone, high priority).

In the navGroups (from TASK-012 plan), update the first group:

```typescript
{
  label: "",
  items: [
    { href: "/dashboard", label: t("dashboard"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
    { href: "/notifications", label: "Oznameni", roles: ["OWNER", "EMPLOYEE", "SALON"], badge: "notifications" },
  ],
},
```

**If Task #12 is NOT yet implemented** (flat navItems still), simply add to the existing array:

```typescript
// After dashboard entry:
{ href: "/notifications", label: "Oznameni", roles: ["OWNER", "EMPLOYEE", "SALON"] },
```

### Step 2: Add unread notification count to sidebar badge

**File:** `src/components/AppShell.tsx`

The bell component (`NotificationBell.tsx`) already fetches unread count and polls every 30s. For the sidebar, we need to also show this count.

**Approach:** Add a separate `useEffect` to fetch notification count (similar to the pending registrations count from Task #12):

```typescript
const [notifCount, setNotifCount] = useState(0);

useEffect(() => {
  async function fetchNotifCount() {
    try {
      const res = await fetch("/api/notifications?unread=true&limit=1");
      if (res.ok) {
        const json = await res.json();
        setNotifCount(json.unreadCount ?? 0);
      }
    } catch {}
  }
  fetchNotifCount();
  const interval = setInterval(fetchNotifCount, 30000);
  return () => clearInterval(interval);
}, []);
```

In the nav rendering, show the badge for the notifications item:

```tsx
{item.badge === "notifications" && notifCount > 0 && (
  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    {notifCount > 99 ? "99+" : notifCount}
  </span>
)}
```

### Step 3: Verify mark-as-read behavior

The mark-as-read on click already works:

- **Bell dropdown** (`NotificationBell.tsx` line 155): `onClick={() => !n.read && handleMarkRead(n.id)}` -- calls `PUT /api/notifications/[id]`, updates local state, decrements count
- **Full page** (`NotificationsClient.tsx` line 106): same pattern -- click triggers `handleMarkRead(id)` which calls the API and refetches

**No changes needed** for mark-as-read behavior. It already works as the user expects.

### Step 4: Consider removing the bell from the header (optional)

With notifications in the sidebar, the bell icon in the header (`AppShell.tsx` line 125, `<NotificationBell />`) may become redundant. However, the bell provides a quick dropdown without navigating away from the current page.

**Recommendation:** Keep the bell in the header as a quick-access dropdown. The sidebar link navigates to the full `/notifications` page. Both are useful and non-conflicting. The user's complaint was about notifications NOT being in the sidebar, not about removing them from the header.

---

## Integration with Task #12 (Menu Restructure)

If Task #12 is being implemented at the same time, the notifications item should be added to the first navGroup (Dashboard group). The badge rendering already supports different badge types (`"pending"` for registrations, `"notifications"` for notification count).

Update the badge rendering in the nav to handle both types:

```tsx
{item.badge === "pending" && pendingCount > 0 && (
  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    {pendingCount}
  </span>
)}
{item.badge === "notifications" && notifCount > 0 && (
  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    {notifCount > 99 ? "99+" : notifCount}
  </span>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppShell.tsx` | Add "Oznameni" nav item with unread count badge, add notifCount fetch with 30s polling |

## Files NOT Modified

- `NotificationBell.tsx` -- keep as-is (quick-access dropdown in header)
- `NotificationsClient.tsx` -- keep as-is (mark-as-read already works)
- `/api/notifications/` -- keep as-is (API already supports all needed operations)

## Dependencies

- Coordinates with Task #12 (menu restructure) -- if both are implemented, merge the navGroups structure
- If Task #12 is implemented first, just add the notifications item to the existing navGroups
- If this is implemented first on the flat navItems, Task #12 will need to include it in the grouped structure

## Risk

- LOW: Adding one nav item + one useEffect for count polling
- The 30s polling interval matches what `NotificationBell.tsx` already does -- two parallel polls to the same endpoint. If this is a concern, a shared context/hook could be created, but for simplicity this is fine (the endpoint is lightweight -- single `COUNT` query)
