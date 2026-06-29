# Task #50 — Full Web Audit: Remaining Issues

**Auditor:** Planner agent
**Date:** 2026-06-28
**Scope:** All pages — public, admin, salon portal

---

## CRITICAL — Breaks functionality or SEO

### C1. Missing favicon.ico
- **File:** `src/app/layout.tsx:27` references `/favicon.ico`
- **Problem:** File does not exist at `public/favicon.ico`
- **Impact:** Browser tab shows generic icon, Google Search Console warnings
- **Fix:** Add favicon.ico to `public/`

### C2. Placeholder phone number in JSON-LD
- **File:** `src/app/(public)/page.tsx:22`
- **Code:** `telephone: "+420 XXX XXX XXX"`
- **Impact:** Google reads invalid phone from structured data, hurts local SEO
- **Fix:** Replace with real business phone number

### C3. Admin invoices — missing table headers
- **File:** `src/app/(app)/invoices/InvoicesClient.tsx`
- **Lines 99, 101:** Two `<th>` elements show literal `"-"` instead of proper labels
- **Line 99:** Column displays `inv.buyerName` → header should be `t("buyer")` or equivalent
- **Line 101:** Column displays `<InvoiceStatusBadge>` → header should be `t("status")`
- **Fix:** Replace `"-"` with proper i18n translation keys

### C4. Admin invoices — empty state placeholder
- **File:** `src/app/(app)/invoices/InvoicesClient.tsx:89`
- **Code:** `<p className="text-muted text-center py-8">-</p>`
- **Impact:** Shows just "-" when no invoices match filter — confusing UX
- **Fix:** Use `t("noInvoices")` or `tCommon("noResults")` translation

---

## HIGH — Brand/visual inconsistency

### H1. Root layout uses gray background
- **File:** `src/app/layout.tsx:81`
- **Code:** `bg-gray-50` on `<body>`
- **Should be:** `bg-nude-50` (brand color)
- **Impact:** Entire app background is off-brand

### H2. `hairora` remnants in codebase (2 files)
- **`src/components/CookieBanner.tsx:6`** — `"hairora_cookie_consent"` cookie name
  - Impact: Existing users who accepted cookies under "hairora" key keep consent; changing requires re-consent
  - Fix: Rename to `"hairland_cookie_consent"` (accept that users re-see the banner once)
- **`src/app/api/cron/backup/route.ts:12`** — `"/var/backups/hairora"` backup directory
  - Fix: Change to `"/var/backups/hairland"` or use env var

### H3. ~45 instances of `text-gray-*` / `bg-gray-*` across admin pages
These violate the brand color palette. Every `text-gray-*` should map to:
- `text-gray-600` → `text-muted` (32 instances)
- `text-gray-300` → `text-muted` or brand-appropriate (star ratings can stay yellow/gray)
- `text-gray-800` → `text-ink` or `text-espresso`
- `bg-gray-200` → `bg-nude-100` or `bg-nude-200`
- `bg-gray-50` → `bg-nude-50`
- `border-gray-100` → `border-line`
- `border-gray-600` → `border-line`
- `hover:bg-gray-200` → `hover:bg-nude-200`
- `hover:border-gray-400` → `hover:border-espresso/30`

**Affected files (non-exhaustive):**
| File | Count |
|------|-------|
| `inventory/deliveries/[id]/DeliveryDetailClient.tsx` | 5 |
| `suppliers/SuppliersClient.tsx` | 6 |
| `inventory/movements/MovementsClient.tsx` | 3 |
| `audit-log/AuditLogClient.tsx` | 3 |
| `dashboard/page.tsx` | 3 |
| `complaints/ComplaintsClient.tsx` | 2 |
| `notifications/NotificationsClient.tsx` | 2 |
| `orders/OrdersClient.tsx` | 1 |
| `sales/[id]/SaleDetailClient.tsx` | 1 |
| `sales/new/NewSaleWizard.tsx` | 1 |
| `returns/ReturnsClient.tsx` | 1 |
| `export/ExportClient.tsx` | 1 |
| `stylists/page.tsx` | 1 |
| `stylists/StylistForm.tsx` | 2 |
| `products/[id]/ProductDetailClient.tsx` | 2 |
| `salons/[id]/SalonDetailClient.tsx` | 1 |
| `salons/SalonsClient.tsx` | 1 |
| `inventory/InventoryClient.tsx` | 1 |
| `reviews/ReviewsClient.tsx` | 1 |
| `registrations/RegistrationsClient.tsx` | 1 |
| `AppShell.tsx` | 1 |
| `NotificationBell.tsx` | 1 |
| `products/PhotoUpload.tsx` | 1 |
| `products/VariantTable.tsx` | 1 |
| `BarcodeScanner.tsx` | 2 |

**Exception:** Star rating colors (`text-yellow-400` / `text-gray-300`) in ReviewsClient, WriteReviewForm, and ProductReviews are standard UX — can stay as-is.

### H4. Hardcoded Czech strings in CatalogClient.tsx (salon portal)
- **File:** `src/app/(salon)/salon/catalog/CatalogClient.tsx`
- **Lines 146, 152, 326, 329, 338, 347, 356**
- Strings: "Objednávka odeslána", "Zpět do katalogu", "položka/položky/položek", "Celkem:", "Poznámka k objednávce...", "Smazat", "Odesílám...", "Odeslat objednávku"
- **Impact:** These won't translate for uk/ru locale users
- **Fix:** Move all to `salonPortal` translation namespace

### H5. Hardcoded Czech strings in StylistForm.tsx
- **File:** `src/app/(app)/stylists/StylistForm.tsx:109,115`
- Strings: "Chyba při ukládání", "Neznámá chyba"
- **Fix:** Use translation keys

### H6. Hardcoded Czech placeholder in StockInForm.tsx
- **File:** `src/components/inventory/StockInForm.tsx:245`
- Code: `placeholder="např. 50"`
- **Fix:** Use translation key or just `placeholder="50"`

---

## MEDIUM — Should fix but not blocking

### M1. Product JSON-LD always shows InStock
- **File:** `src/app/(public)/offer/[id]/page.tsx:204-206`
- **Logic:** Only checks `product.archived` → Discontinued, else → InStock
- **Problem:** A product with 0 grams available still shows InStock to Google
- **Fix:** Check actual stock (sum of variant availableGrams) and use `OutOfStock` when 0

### M2. Homepage JSON-LD priceRange is nonsensical
- **File:** `src/app/(public)/page.tsx:23`
- **Code:** `priceRange: "Kč Kč Kč"`
- **Fix:** Use something like `"500 Kč – 5 000 Kč"` or remove field

### M3. CatalogClient error strings are hardcoded Czech
- **File:** `src/app/(salon)/salon/catalog/CatalogClient.tsx:124,130`
- Strings: "Chyba při odesílání objednávky", "Chyba při odesílání"
- **Fix:** Use translation keys (part of H4 batch)

---

## LOW — Nice to have

### L1. Barcode format comment references "HR-" prefix
- **File:** `src/lib/barcode.ts:3`
- **Code:** Comment says `HR-YYYYMMDD-XXXX (Hairland prefix + date + random 4 chars)`
- **Status:** This is correct (HR = Hairland), just noting it's not a "hairora" remnant

### L2. BarcodeScanner uses dark theme colors
- **File:** `src/components/BarcodeScanner.tsx:164,170`
- **Code:** `text-gray-300`, `bg-gray-800`, `border-gray-600`
- **Context:** Scanner overlay intentionally uses dark background — may be by design
- **Fix:** Consider if these should use brand dark colors or keep as camera overlay

---

## Summary

| Priority | Count | Effort |
|----------|-------|--------|
| CRITICAL | 4 | Small — mostly string replacements + one asset |
| HIGH | 6 | Medium — bulk find-replace for gray colors, i18n for ~10 strings |
| MEDIUM | 3 | Small |
| LOW | 2 | Minimal |
| **TOTAL** | **15** | |

## Recommended Fix Order
1. C1 (favicon) + C2 (phone) + C3+C4 (invoice headers) — quick wins
2. H1 (bg-gray-50 → bg-nude-50) — one line
3. H2 (hairora remnants) — two lines
4. H3 (gray→brand colors) — bulk search-replace, ~45 changes across ~25 files
5. H4+H5+H6+M3 (hardcoded Czech) — add ~15 translation keys
6. M1 (InStock logic) + M2 (priceRange) — small logic changes
