# Task #12: Restructure Admin Menu -- Separate "Registrace" Section

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

User complaint: pending registrations are buried inside the Salons page as a tab. User wants:
1. A separate "Registrace" item in the admin sidebar
2. Registrations page divided into Salony and Kadernice tabs
3. Pending count badge in the sidebar

---

## Current State

- `AppShell.tsx` line 31: `/salons` is listed as a nav item
- `SalonsClient.tsx`: has `tab` state with `"pending" | "active" | "archived"` -- pending tab shows unapproved salons
- The pending tab sends `?archived=false&approved=false` to `/api/salons`

---

## Implementation Steps

### Step 1: Add "Registrace" nav item to AppShell

**File:** `src/components/AppShell.tsx`

After the salons entry (line 31), add:
```typescript
{ href: "/registrations", label: "Registrace", roles: ["OWNER", "EMPLOYEE"] },
```

The navItems array becomes:
```typescript
{ href: "/salons", label: t("salons"), roles: ["OWNER", "EMPLOYEE"] },
{ href: "/registrations", label: "Registrace", roles: ["OWNER", "EMPLOYEE"] },
```

**Pending count badge:** To show a dynamic count badge next to "Registrace", the AppShell component would need to fetch the pending count. Since AppShell is a client component, this would mean either:

**Option A:** Fetch count in AppShell via `useEffect` + API call (simple, but adds a request on every page load)
**Option B:** Pass the count from the parent layout as a prop (cleaner)
**Option C:** Use a lightweight API endpoint and show badge only when count > 0

**Recommended: Option A** for simplicity. Add a small fetch to get pending registrations count:

```tsx
// In AppShell, add:
const [pendingCount, setPendingCount] = useState(0);
useEffect(() => {
  if (role === "OWNER" || role === "EMPLOYEE") {
    fetch("/api/salons?archived=false&approved=false&limit=1")
      .then((r) => r.json())
      .then((data) => setPendingCount(data.total ?? 0))
      .catch(() => {});
  }
}, [role]);
```

Then in the nav rendering, add a badge for the registrations item:
```tsx
{item.href === "/registrations" && pendingCount > 0 && (
  <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
    {pendingCount}
  </span>
)}
```

### Step 2: Create registrations page

**File:** `src/app/(app)/registrations/page.tsx` (NEW)

A server component that renders a client component:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegistrationsClient } from "./RegistrationsClient";

export default async function RegistrationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    redirect("/dashboard");

  return <RegistrationsClient role={session.user.role} />;
}
```

### Step 3: Create RegistrationsClient component

**File:** `src/app/(app)/registrations/RegistrationsClient.tsx` (NEW)

A client component with:
- Two tabs: "Salony" and "Kadernice"
- Each tab fetches from `/api/salons?archived=false&approved=false&type=SALON` (or `HAIRDRESSER`)
- Shows: name, contact person, email, phone, city, date
- Each row links to `/salons/[id]` for approval
- "Schvalit" button directly on the list for quick approval

The data source is the same `/api/salons` endpoint with `approved=false` and `type` filter.

Structure:
```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";

interface Registration {
  id: string;
  name: string;
  type?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  city?: string;
  createdAt: string;
  approved: boolean;
}

export function RegistrationsClient({ role }: { role: Role }) {
  const [tab, setTab] = useState<"SALON" | "HAIRDRESSER">("SALON");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/salons?archived=false&approved=false&type=${tab}`)
      .then((r) => r.json())
      .then((data) => setRegistrations(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/salons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Registrace</h1>

      {/* Tabs: Salony / Kadernice */}
      <div className="flex gap-2">
        <button
          className={tab === "SALON" ? "active-tab-style" : "inactive-tab-style"}
          onClick={() => setTab("SALON")}
        >
          Salony
        </button>
        <button
          className={tab === "HAIRDRESSER" ? "active-tab-style" : "inactive-tab-style"}
          onClick={() => setTab("HAIRDRESSER")}
        >
          Kadernice
        </button>
      </div>

      {/* Table of pending registrations */}
      {/* Each row: name, contact, email, phone, city, date, [Schvalit] button */}
    </div>
  );
}
```

### Step 4: Update SalonsClient to remove "pending" tab

**File:** `src/app/(app)/salons/SalonsClient.tsx`

Since pending registrations now have their own page, the "pending" tab in Salons can be removed (or kept for backwards compatibility -- user preference).

**Option A:** Remove the pending tab entirely from SalonsClient. Change default tab from `"pending"` to `"active"`.
**Option B:** Keep it but add a note "See /registrations for full view"

**Recommended: Option A** -- remove the pending tab, set default to `"active"`.

Change line 43:
```tsx
const [tab, setTab] = useState<"active" | "archived">("active");
```

Remove the "pending" button (lines 82-91).

Update the useEffect `if` block to remove the pending case (lines 51-55).

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/(app)/registrations/page.tsx` | Server component for registrations page |
| `src/app/(app)/registrations/RegistrationsClient.tsx` | Client component with Salon/Hairdresser tabs |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppShell.tsx` | Add "Registrace" nav item with pending count badge |
| `src/app/(app)/salons/SalonsClient.tsx` | Remove "pending" tab, default to "active" |

## Dependencies

None. Independent of other tasks.

## Risk

- LOW: Mostly new files + nav restructuring
- The `/api/salons` endpoint already supports all needed filters (`approved`, `type`, `archived`)
- If the pending tab is removed from Salons, users who bookmarked it won't find it -- but the new Registrace page is more intuitive
