# Task #25 — Fix Salon/Hairdresser Portal: Implementation Plan

## Summary

The salon portal at `/salon/*` has 11 files. Most pages already fetch real data from APIs, but several have placeholder text, missing features, and navigation bugs from reusing admin components. No dashboard page exists.

---

## FIX 1: Missing `/salon/` Dashboard Page (HIGH PRIORITY)

**Problem:** No page exists at `/salon/` or `/salon/dashboard`. When SalonShell links to `/salon/catalog` as default, there's no overview/landing page. The nav in `SalonShell.tsx` doesn't include a dashboard link either.

**Action:** Create `src/app/(salon)/salon/page.tsx` — a simple dashboard with:
- Welcome message with salon name (from session)
- Quick stats cards: recent orders count, loyalty tier + discount %, pending samples
- Link cards to each portal section (catalog, orders, invoices, samples, profile)
- Fetch stats from existing APIs: `/api/orders?limit=5`, `/api/salon-portal/profile`

**Files to create:**
- `src/app/(salon)/salon/page.tsx` (server component, fetches session)
- `src/app/(salon)/salon/DashboardClient.tsx` (client component with stats)

**Files to modify:**
- `src/components/SalonShell.tsx` line 21: Add dashboard nav item `{ href: "/salon", label: t("dashboard") }` at the beginning of `navItems` array
- `src/components/SalonShell.tsx` line 33: Change default link from `/salon/catalog` to `/salon`

---

## FIX 2: OrderDetailClient Navigation Bugs for Salon Users (HIGH PRIORITY)

**Problem:** `src/app/(app)/orders/[id]/OrderDetailClient.tsx` is reused by salon portal but has hardcoded admin routes:
- Line 96: Back button `<Link href="/orders">` → should be `/salon/orders` for salon users
- Line 108: Table header shows placeholder "-" instead of product name column header
- Line 235-238: Sale link `<Link href={/sales/${order.sale.id}>` → admin route, salon users can't access it

**Action — file: `src/app/(app)/orders/[id]/OrderDetailClient.tsx`:**

| Line | Current | Replace With |
|------|---------|--------------|
| 96 | `<Link href="/orders">` | `<Link href={isStaff ? "/orders" : "/salon/orders"}>` |
| 108 | `<th className="py-1 pr-2">-</th>` | `<th className="py-1 pr-2">{t("product")}</th>` |
| 235-238 | `<Link href={/sales/${order.sale.id}} ...>` | Wrap in `{isStaff && ...}` so salon users don't see sale links |

---

## FIX 3: SalonInvoicesClient — Fix Placeholder & Add PDF Download (MEDIUM)

**Problem:** `src/app/(salon)/salon/invoices/SalonInvoicesClient.tsx`:
- Line 49: Empty state shows "-" instead of a proper message
- Line 60: Table header column says "-" instead of "Status"
- No PDF download button (API exists at `/api/invoices/[id]/pdf` and allows SALON/HAIRDRESSER)
- Links to `/salon/invoices/${inv.id}` which doesn't exist as a page

**Action — file: `src/app/(salon)/salon/invoices/SalonInvoicesClient.tsx`:**

| Line | Current | Replace With |
|------|---------|--------------|
| 49 | `<p className="text-muted text-center py-8">-</p>` | `<p className="text-muted text-center py-8">{t("noInvoices")}</p>` |
| 60 | `<th className="py-2 pr-3">-</th>` | `<th className="py-2 pr-3">{tInvoice("status")}</th>` |

**Add:** After status column (line 85), add a new column with PDF download button:
```tsx
<th className="py-2 pr-3"></th>  // in thead
// in tbody:
<td className="py-2 pr-3">
  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank"
     className="text-espresso hover:underline text-xs">
    PDF
  </a>
</td>
```

**Remove link wrapping** on invoice number (lines 67-70) — since `/salon/invoices/[id]` doesn't exist. Either:
- Option A: Remove the Link, just show `{inv.number}` as plain text
- Option B: Create `/salon/invoices/[id]/page.tsx` that shows invoice detail (more work)

**Recommendation:** Option A (remove Link) for now. Invoice detail can be a follow-up task.

---

## FIX 4: SalonSamplesClient — Fix Placeholder Column Header (MEDIUM)

**Problem:** `src/app/(salon)/salon/samples/SalonSamplesClient.tsx`:
- Line 19: RETURNED status uses `text-gray-600` instead of brand color
- Line 57: Table header shows "-" instead of "Status"

**Action — file: `src/app/(salon)/salon/samples/SalonSamplesClient.tsx`:**

| Line | Current | Replace With |
|------|---------|--------------|
| 19 | `RETURNED: "bg-nude-100 text-gray-600"` | `RETURNED: "bg-nude-100 text-muted"` |
| 57 | `<th className="py-2 pr-3">-</th>` | `<th className="py-2 pr-3">{tSample("status")}</th>` |

---

## FIX 5: SalonShell — Fix Inactive Nav Color (LOW)

**Problem:** `src/components/SalonShell.tsx` line 44: Inactive nav items use `text-gray-600` instead of brand color.

**Action — file: `src/components/SalonShell.tsx`:**

| Line | Current | Replace With |
|------|---------|--------------|
| 44 | `"text-gray-600 hover:bg-nude-100"` | `"text-muted hover:bg-nude-100"` |

---

## FIX 6: ProfileClient — Minor Brand Fix (LOW)

**Problem:** `src/app/(salon)/salon/profile/ProfileClient.tsx` line 37: SILVER tier uses `bg-gray-200` instead of brand color.

**Action — file: `src/app/(salon)/salon/profile/ProfileClient.tsx`:**

| Line | Current | Replace With |
|------|---------|--------------|
| 37 | `SILVER: "bg-gray-200 text-espresso"` | `SILVER: "bg-nude-200 text-espresso"` |

---

## FIX 7: CatalogClient — Hardcoded Czech Strings (LOW)

**Problem:** `src/app/(salon)/salon/catalog/CatalogClient.tsx` has multiple hardcoded Czech strings that should use i18n:
- Line 155: "Objednávka odeslána"
- Line 156: "Vaše objednávka byla úspěšně odeslána..."
- Line 160: "Zpět do katalogu"
- Line 259: "Délka" (table header)
- Line 338-339: "položka/položky/položek"
- Line 341: "Celkem:"
- Line 351: "Poznámka k objednávce..."
- Line 359: "Smazat"
- Line 367: "Odesílám..." / "Odeslat objednávku"
- Lines 53-59: `processingLabels` hardcoded Czech names

**Action:** These should ideally be moved to translation keys. This is a larger task — recommend as follow-up unless the user specifically wants full i18n now.

---

## NOT BROKEN (Confirmed Working)

1. **CatalogClient ordering** — `salonId: ""` at line 123 is harmless because API route line 76-77 overrides it with `session.user.salonId` for SALON/HAIRDRESSER roles.
2. **OrdersClient** — Correctly hides salon column for SALON/HAIRDRESSER (line 109). API filters by session's salonId (line 24-26).
3. **ProfileClient** — Fetches real profile data and shows loyalty info correctly. Edit functionality was not promised in the original task.
4. **Auth/layout** — `(salon)/salon/layout.tsx` correctly checks for SALON/HAIRDRESSER roles and wraps with SalonShell.

---

## Implementation Priority Order

1. **FIX 2** — OrderDetailClient nav bugs (breaks navigation for salon users)
2. **FIX 3** — Invoice placeholders + PDF download
3. **FIX 4** — Samples placeholder fix
4. **FIX 1** — Dashboard page (new file creation)
5. **FIX 5** — SalonShell nav color
6. **FIX 6** — ProfileClient SILVER tier color
7. **FIX 7** — CatalogClient i18n (follow-up task)

---

## Files Modified (Summary)

| File | Changes |
|------|---------|
| `src/app/(app)/orders/[id]/OrderDetailClient.tsx` | Fix back link, "-" header, hide sale link for non-staff |
| `src/app/(salon)/salon/invoices/SalonInvoicesClient.tsx` | Fix "-" placeholders, add PDF download, remove dead link |
| `src/app/(salon)/salon/samples/SalonSamplesClient.tsx` | Fix "-" header, gray→brand color |
| `src/components/SalonShell.tsx` | Fix gray nav color, add dashboard nav item |
| `src/app/(salon)/salon/profile/ProfileClient.tsx` | Fix SILVER tier gray color |
| `src/app/(salon)/salon/page.tsx` | **NEW** — Dashboard page |
| `src/app/(salon)/salon/DashboardClient.tsx` | **NEW** — Dashboard client component |
