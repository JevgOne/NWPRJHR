# TASK-022: Admin Brand Color Fixes — ACTIONABLE REPLACEMENT LIST

## Status: Zero indigo/blue-600/blue-500 remain in admin or components. Already fixed.

The real issue: generic Tailwind **gray** defaults everywhere instead of brand colors.

---

## STEP 1: Fix 3 UI Components (cascades to ALL 50 pages)

### File: `src/components/ui/Card.tsx` line 18
```
FIND:    border border-gray-200
REPLACE: border border-line
```

### File: `src/components/ui/Input.tsx` line 15
```
FIND:    text-gray-700
REPLACE: text-espresso
```

### File: `src/components/ui/Input.tsx` line 23
```
FIND:    border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400
REPLACE: border border-line px-3 py-2 text-ink placeholder-muted
```

### File: `src/components/ui/Button.tsx` line 14 (secondary variant)
```
FIND:    bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-rose
REPLACE: bg-white text-espresso border border-line hover:bg-nude-50 focus:ring-rose
```

### File: `src/components/ui/Button.tsx` line 16 (ghost variant)
```
FIND:    text-gray-600 hover:bg-gray-100 focus:ring-gray-500
REPLACE: text-muted hover:bg-nude-100 focus:ring-rose
```

---

## STEP 2: Fix AppShell header (every page)

### File: `src/components/AppShell.tsx` line 201
```
FIND:    border-b border-gray-200
REPLACE: border-b border-line
```

### File: `src/components/AppShell.tsx` line 204
```
FIND:    text-gray-600 hover:text-gray-900
REPLACE: text-muted hover:text-espresso
```

---

## STEP 3: Bulk replace across all 50 admin pages in `src/app/(app)/`

**IMPORTANT**: Do NOT replace in status badge strings like `"bg-gray-100 text-gray-600"` or `"bg-gray-100 text-gray-500"` when they represent COMPLETED/CANCELLED/disabled states. Those are intentional.

### 3a. Table headers
```
FIND:    text-left text-gray-500
REPLACE: text-left text-muted
```

### 3b. Table row hover
```
FIND:    hover:bg-gray-50
REPLACE: hover:bg-nude-50
```

### 3c. Table header backgrounds (in thead contexts)
```
FIND:    bg-gray-50
REPLACE: bg-nude-50
```
Files: ReturnsClient, ComplaintsClient, PaymentsClient, AuditLogClient, DeliveryDetailClient

### 3d. Loading/empty text
```
FIND:    text-gray-500">{tCommon("loading")}
REPLACE: text-muted">{tCommon("loading")}
```
```
FIND:    text-gray-500 text-center
REPLACE: text-muted text-center
```

### 3e. Secondary/subtle text
```
FIND:    text-gray-400
REPLACE: text-muted
```

### 3f. Select borders (inline selects)
```
FIND:    border border-gray-200 bg-white
REPLACE: border border-line bg-white
```

### 3g. All remaining border-gray-200 (not in UI components, already fixed)
```
FIND:    border-gray-200
REPLACE: border-line
```

### 3h. Table body dividers
```
FIND:    divide-gray-200
REPLACE: divide-line
```

### 3i. Inactive tab backgrounds
```
FIND:    bg-gray-100 text-gray-700 hover:bg-gray-200
REPLACE: bg-nude-100 text-espresso hover:bg-nude-200
```
```
FIND:    bg-gray-100 text-gray-600 hover:bg-gray-200
REPLACE: bg-nude-100 text-muted hover:bg-nude-200
```

### 3j. Strong text / headings
```
FIND:    text-gray-900
REPLACE: text-ink
```

### 3k. Label/body text
```
FIND:    text-gray-700
REPLACE: text-espresso
```

### 3l. Secondary text
```
FIND:    text-gray-600
REPLACE: text-muted
```

### 3m. Subtle borders
```
FIND:    border-gray-300
REPLACE: border-line
```

### 3n. Fine borders
```
FIND:    border-gray-100
REPLACE: border-nude-100
```

---

## STEP 4: Dashboard QuickBadge

### File: `src/app/(app)/dashboard/page.tsx`

Line 290:
```
FIND:    color="indigo"
REPLACE: color="espresso"
```

Line 312:
```
FIND:    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
REPLACE: espresso: "bg-nude-50 text-espresso border-line",
```

---

## STEP 5: Login page

### File: `src/app/login/page.tsx`

Line 5:
```
FIND:    bg-gray-50
REPLACE: bg-nude-50
```

Line 8 — add logo above heading:
```
FIND:    <h1 className="text-3xl font-bold text-gray-900">Hairland</h1>
REPLACE: <img src="/icons/icon-192x192.png" alt="Hairland" className="w-12 h-12 rounded-lg mx-auto mb-2" /><h1 className="text-3xl font-bold text-espresso">Hairland</h1>
```

---

## STEP 6: "hairora" → "hairland" text

| File | Find | Replace |
|------|------|---------|
| `src/components/CookieBanner.tsx:6` | `hairora_cookie_consent` | `hairland_cookie_consent` |
| `src/lib/export-pohoda.ts:43` | `hairora-` | `hairland-` |
| `src/app/(app)/export/ExportClient.tsx:101` | `hairora-export` | `hairland-export` |
| `src/app/api/cron/backup/route.ts:12` | `/var/backups/hairora` | `/var/backups/hairland` |
| `src/app/api/export/pohoda/route.ts:40` | `hairora-pohoda` | `hairland-pohoda` |
| `src/app/api/export/excel/route.ts:43` | `hairora-export` | `hairland-export` |
| `src/app/api/export/excel/route.ts:52` | `hairora-export` | `hairland-export` |

---

## DO NOT CHANGE (intentional semantic colors)

- PREMIUM category badges: `bg-indigo-500`, `bg-indigo-100` (in dashboard, HeroProductSlider, ProductsShowcase)
- Status badges: `bg-blue-100`, `bg-green-100`, `bg-red-100`, `bg-yellow-100`, `bg-amber-100`, `bg-purple-100`
- COMPLETED/CANCELLED statuses: `bg-gray-100 text-gray-600` / `bg-gray-100 text-gray-500`
- SILVER tier: `bg-gray-200 text-gray-700`
- Error text: `text-red-600`

---

## All 50 admin files with gray:

src/app/(app)/dashboard/page.tsx
src/app/(app)/reviews/ReviewsClient.tsx
src/app/(app)/registrations/RegistrationsClient.tsx
src/app/(app)/notifications/NotificationsClient.tsx
src/app/(app)/export/ExportClient.tsx
src/app/(app)/orders/[id]/OrderDetailClient.tsx
src/app/(app)/orders/OrdersClient.tsx
src/app/(app)/returns/ReturnsClient.tsx
src/app/(app)/finance/partners/[id]/PartnerDetailClient.tsx
src/app/(app)/finance/partners/PartnersClient.tsx
src/app/(app)/finance/FinanceOverviewClient.tsx
src/app/(app)/finance/discounts/DiscountHistoryClient.tsx
src/app/(app)/finance/costs/CostsClient.tsx
src/app/(app)/inventory/deliveries/[id]/DeliveryDetailClient.tsx
src/app/(app)/inventory/deliveries/[id]/page.tsx
src/app/(app)/inventory/page.tsx
src/app/(app)/inventory/InventoryClient.tsx
src/app/(app)/inventory/movements/page.tsx
src/app/(app)/inventory/movements/MovementsClient.tsx
src/app/(app)/inventory/stock-in/page.tsx
src/app/(app)/salons/[id]/SalonDetailClient.tsx
src/app/(app)/salons/new/NewSalonClient.tsx
src/app/(app)/salons/SalonsClient.tsx
src/app/(app)/samples/SamplesClient.tsx
src/app/(app)/audit-log/page.tsx
src/app/(app)/audit-log/AuditLogClient.tsx
src/app/(app)/discounts/DiscountsClient.tsx
src/app/(app)/invoices/InvoicesClient.tsx
src/app/(app)/invoices/[id]/InvoiceDetailClient.tsx
src/app/(app)/sales/[id]/SaleDetailClient.tsx
src/app/(app)/sales/SalesHistoryClient.tsx
src/app/(app)/sales/new/NewSaleWizard.tsx
src/app/(app)/suppliers/page.tsx
src/app/(app)/suppliers/SuppliersClient.tsx
src/app/(app)/stylists/page.tsx
src/app/(app)/stylists/[id]/page.tsx
src/app/(app)/stylists/StylistForm.tsx
src/app/(app)/stylists/new/page.tsx
src/app/(app)/products/page.tsx
src/app/(app)/products/[id]/ProductDetailClient.tsx
src/app/(app)/products/new/CreateProductForm.tsx
src/app/(app)/products/ProductListClient.tsx
src/app/(app)/complaints/ComplaintsClient.tsx
src/app/(app)/payments/PaymentsClient.tsx
src/app/(app)/settings/companies/CompaniesClient.tsx
src/app/(app)/settings/pricing/PricingSettingsClient.tsx
src/app/(app)/settings/b2b/B2BSettingsClient.tsx
src/app/(app)/settings/loyalty/LoyaltySettingsClient.tsx
src/app/(app)/customers/[id]/CustomerDetailClient.tsx
src/app/(app)/customers/CustomersClient.tsx
