# Task #12: Restructure Admin Menu -- Intuitive Grouped Sidebar

**Date:** 2026-06-27 (updated with user feedback)
**Status:** Plan ready for implementation

---

## Problem

User feedback: "proc to je pod Salony?? snad by to meli bejt registrace" and "vubec to nedava smysl totiz to menu" and "musi byt zrozumitelne" -- the menu must be logically grouped so anyone can understand it, not just the owner.

**Current menu (flat list, 19 items):**
Dashboard, Produkty, Sklad, Prodeje, Objednavky, Faktury, Salony, Zakaznici, Kadernice, Recenze, Dodavatele, Vzorky, Slevy, Vratky, Reklamace, Platby, Finance, Export, Audit log, Nastaveni

---

## Solution: Grouped Sidebar with Section Headers

Reorganize into logical groups with small section labels (dividers). Add "Registrace" as a separate item.

### New Menu Structure

```
--- (no header) ---
  Dashboard

--- Produkty a sklad ---
  Produkty
  Sklad
  Dodavatele (OWNER only)

--- Prodej ---
  Objednavky
  Prodeje
  Faktury
  Platby (OWNER only)

--- Klienti ---
  Salony
  Registrace (NEW -- with pending count badge, OWNER only)
  Zakaznici
  Kadernice (stylists)

--- Kvalita ---
  Vzorky (OWNER only)
  Vratky (OWNER only)
  Reklamace (OWNER only)
  Recenze

--- Finance ---
  Finance (OWNER only)
  Slevy (OWNER only)

--- System ---
  Export (OWNER only)
  Audit log (OWNER only)
  Nastaveni (OWNER only)
```

**Key changes from current:**
1. Items grouped with section headers
2. "Registrace" added as new item under "Klienti"
3. "Dodavatele" moved from bottom to "Produkty a sklad" (logical -- suppliers provide products)
4. "Platby" moved from bottom to "Prodej" (logical -- payments relate to invoices/sales)
5. "Recenze" moved to "Kvalita" group
6. "Slevy" moved to "Finance" group
7. Order within groups follows the business workflow (orders -> sales -> invoices -> payments)

---

## Implementation Steps

### Step 1: Restructure navItems with groups

**File:** `src/components/AppShell.tsx`

Replace the flat `navItems` array (lines 24-45) with a grouped structure:

```typescript
interface NavGroup {
  label: string;
  items: { href: string; label: string; roles: string[]; badge?: "pending" }[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: t("dashboard"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
    ],
  },
  {
    label: "Produkty a sklad",
    items: [
      { href: "/products", label: t("products"), roles: ["OWNER", "EMPLOYEE"] },
      { href: "/inventory", label: t("inventory"), roles: ["OWNER", "EMPLOYEE"] },
      { href: "/suppliers", label: t("suppliers"), roles: ["OWNER"] },
    ],
  },
  {
    label: "Prodej",
    items: [
      { href: "/orders", label: t("orders"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
      { href: "/sales", label: t("sales"), roles: ["OWNER", "EMPLOYEE"] },
      { href: "/invoices", label: t("invoices"), roles: ["OWNER", "EMPLOYEE", "SALON"] },
      { href: "/payments", label: t("payments"), roles: ["OWNER"] },
    ],
  },
  {
    label: "Klienti",
    items: [
      { href: "/salons", label: t("salons"), roles: ["OWNER", "EMPLOYEE"] },
      { href: "/registrations", label: "Registrace", roles: ["OWNER"], badge: "pending" },
      { href: "/customers", label: t("customers"), roles: ["OWNER", "EMPLOYEE"] },
      { href: "/stylists", label: "Kadeřnice", roles: ["OWNER", "EMPLOYEE"] },
    ],
  },
  {
    label: "Kvalita",
    items: [
      { href: "/samples", label: t("samples"), roles: ["OWNER"] },
      { href: "/returns", label: t("returns"), roles: ["OWNER"] },
      { href: "/complaints", label: t("complaints"), roles: ["OWNER"] },
      { href: "/reviews", label: "Recenze", roles: ["OWNER", "EMPLOYEE"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: t("finance"), roles: ["OWNER"] },
      { href: "/discounts", label: t("discounts"), roles: ["OWNER"] },
    ],
  },
  {
    label: "Systém",
    items: [
      { href: "/export", label: t("export"), roles: ["OWNER"] },
      { href: "/audit-log", label: t("auditLog"), roles: ["OWNER"] },
      { href: "/settings", label: t("settings"), roles: ["OWNER"] },
    ],
  },
];
```

### Step 2: Update the nav rendering to show groups

**File:** `src/components/AppShell.tsx`

Replace the nav rendering (lines 78-95) with grouped rendering:

```tsx
<nav className="flex-1 px-2 py-4 overflow-y-auto">
  {navGroups.map((group) => {
    const visibleItems = group.items.filter((item) => item.roles.includes(role));
    if (visibleItems.length === 0) return null;

    return (
      <div key={group.label || "main"} className={group.label ? "mt-4" : ""}>
        {group.label && (
          <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {group.label}
          </div>
        )}
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
                {item.badge === "pending" && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  })}
</nav>
```

### Step 3: Add pending count fetch

**File:** `src/components/AppShell.tsx`

Add state and useEffect for pending registrations count (add `useState` and `useEffect` to imports, add before navGroups):

```tsx
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

Note: `useEffect` is already imported on line 1. No new import needed for `useState` either (already imported).

### Step 4: Create registrations page

**File:** `src/app/(app)/registrations/page.tsx` (NEW)

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

### Step 5: Create RegistrationsClient component

**File:** `src/app/(app)/registrations/RegistrationsClient.tsx` (NEW)

Client component with:
- Two tabs: "Salony" and "Kadernice"
- Each tab fetches `/api/salons?archived=false&approved=false&type=SALON|HAIRDRESSER`
- Table columns: name, contact person, email, phone, city, date registered
- Inline "Schvalit" button per row (calls PUT `/api/salons/[id]` with `{ approved: true }`)
- Link to detail `/salons/[id]` for full info
- Empty state when no pending registrations

### Step 6: Update SalonsClient -- remove pending tab

**File:** `src/app/(app)/salons/SalonsClient.tsx`

- Line 43: change default tab from `"pending"` to `"active"`
- Change type from `useState<"pending" | "active" | "archived">` to `useState<"active" | "archived">`
- Delete the pending tab button (lines 82-91)
- Remove the pending case from the useEffect fetch logic (lines 52-55)

---

## Visual Design for Section Headers

Section headers in the sidebar:
- Very small (10px), uppercase, letter-spaced
- Gray-500 color (subtle, not distracting)
- No padding/margin top for the first group (Dashboard)
- `mt-4` margin top for subsequent groups (visual separation)
- Groups with zero visible items (after role filtering) are hidden entirely

This matches common admin panel patterns (Vercel, Linear, Stripe dashboards).

---

## Menu Comparison: Before vs After

### Before (OWNER sees 19 flat items):
```
Dashboard
Produkty
Sklad
Prodeje
Objednavky
Faktury
Salony         <-- registrations hidden inside as a tab
Zakaznici
Kadernice
Recenze
Dodavatele
Vzorky
Slevy
Vratky
Reklamace
Platby
Finance
Export
Audit log
Nastaveni
```

### After (OWNER sees 20 items in 7 groups):
```
Dashboard

PRODUKTY A SKLAD
  Produkty
  Sklad
  Dodavatele

PRODEJ
  Objednavky
  Prodeje
  Faktury
  Platby

KLIENTI
  Salony
  Registrace [3]    <-- NEW, with pending count badge
  Zakaznici
  Kadernice

KVALITA
  Vzorky
  Vratky
  Reklamace
  Recenze

FINANCE
  Finance
  Slevy

SYSTEM
  Export
  Audit log
  Nastaveni
```

### EMPLOYEE sees (8 items in 4 groups):
```
Dashboard

PRODUKTY A SKLAD
  Produkty
  Sklad

PRODEJ
  Objednavky
  Prodeje
  Faktury

KLIENTI
  Salony
  Zakaznici
  Kadernice

KVALITA
  Recenze
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/(app)/registrations/page.tsx` | Server component for registrations page |
| `src/app/(app)/registrations/RegistrationsClient.tsx` | Client component with Salon/Hairdresser tabs |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AppShell.tsx` | Replace flat navItems with grouped navGroups, add section headers rendering, add pending count badge |
| `src/app/(app)/salons/SalonsClient.tsx` | Remove "pending" tab, default to "active" |

## Dependencies

None. The `/api/salons` endpoint already supports all needed filters.

## Risk

- LOW: No backend changes, purely frontend restructure
- The grouped nav rendering replaces the flat one -- all existing links and URLs stay the same, just reordered and grouped
- Role filtering works the same way (`.filter()` per group)
- Empty groups are hidden, so EMPLOYEE/SALON users see a clean, shorter menu
