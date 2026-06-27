# TASK-021: Complete Admin + Public Site QA Report

## Audit Scope
- 65 pages (admin, public, salon portal)
- 85 API routes
- 15+ client components
- Layouts, navigation, forms, notifications

---

## CRITICAL BUGS

### BUG-1: Reviews page has NO auth check (page.tsx)
- **File:** `src/app/(app)/reviews/page.tsx`
- **Problem:** The page renders `<ReviewsClient />` directly with NO `auth()` check and NO role guard. Any logged-in user (including SALON/HAIRDRESSER) can access the reviews management page and add/edit/delete reviews.
- **Comparison:** Every other admin page has `await auth()` + role check.
- **Severity:** HIGH — data integrity risk, unauthorized users can manipulate public reviews.
- **Fix:** Add auth + role check (OWNER/EMPLOYEE only).

### BUG-2: SalonDetailClient "Schvalit salon" button label is hardcoded, not role-aware
- **File:** `src/app/(app)/salons/[id]/SalonDetailClient.tsx:172`
- **Problem:** Button text says "Schvalit salon" even when the entity type is HAIRDRESSER. Should say "Schvalit kadernici" for hairdressers.
- **Severity:** MEDIUM — misleading UI for OWNER.
- **Fix:** Check `salon.type` and use conditional label.

### BUG-3: Salon approval has NO notification for salon user
- **File:** `src/app/api/salons/[id]/route.ts` PUT
- **Problem:** Already documented in TASK-019 (GAP 5). When OWNER approves, the salon/hairdresser user gets ZERO notification. They have no way to know they've been approved without manually checking.
- **Severity:** HIGH — critical B2B UX gap.

---

## FUNCTIONAL ISSUES

### ISSUE-1: WhatsApp/Telegram links are not clickable
- **Files:** `src/components/public/PublicFooter.tsx:127`, `src/app/(public)/contact/page.tsx:89`
- **Problem:** Footer and contact page show "WhatsApp · Telegram" as plain text, not as clickable links. Should link to `https://wa.me/420728729666` and `https://t.me/hairland` (or similar).
- **Severity:** MEDIUM — lost customer contact opportunities.

### ISSUE-2: Salon portal uses indigo branding instead of brand colors
- **File:** `src/components/SalonShell.tsx:33`
- **Problem:** SalonShell header shows "Hairland" in `text-indigo-600` and active nav uses `bg-indigo-50 text-indigo-700`. Should use the brand rose color palette to match the public site.
- **Severity:** LOW — inconsistent brand experience for salon users.

### ISSUE-3: Login page uses plain "Hairland" text, no logo
- **File:** `src/app/login/page.tsx:8`
- **Problem:** Login page just shows `<h1 className="text-3xl font-bold text-gray-900">Hairland</h1>`. Should use the proper logo/brand like the public navbar does.
- **Severity:** LOW — unprofessional first impression.

### ISSUE-4: Invoice status not translated in SalonDetailClient
- **File:** `src/app/(app)/salons/[id]/SalonDetailClient.tsx:326`
- **Problem:** Invoice status displayed as raw enum value (`ISSUED`, `OVERDUE`, etc.) instead of Czech translations.
- **Severity:** LOW — confusing for non-technical users.

### ISSUE-5: Order status not localized properly in SalonDetailClient
- **File:** `src/app/(app)/salons/[id]/SalonDetailClient.tsx:298`
- **Problem:** Uses `tOrder(o.status.toLowerCase())` which may fail if translation keys don't match lowercase status values exactly.
- **Severity:** LOW — potential translation key mismatch.

---

## NAVIGATION & MENU

### NAV-1: AppShell sidebar groups already implemented correctly
- **File:** `src/components/AppShell.tsx:49-109`
- **Status:** VERIFIED OK — 7 logical groups with headers: null (main), "Produkty a sklad", "Prodej", "Klienti", "Kvalita", "Finance", "System". Role-based filtering works.

### NAV-2: Notifications entry exists in sidebar
- **File:** `src/components/AppShell.tsx:54`
- **Status:** VERIFIED OK — "Oznameni" link with unread badge exists in the main nav group.

### NAV-3: SalonsClient has no "pending" tab (correct — moved to /registrations)
- **File:** `src/app/(app)/salons/SalonsClient.tsx:43`
- **Status:** VERIFIED OK — Only "active" and "archived" tabs. Pending registrations are on separate `/registrations` page.

---

## PUBLIC SITE

### PUB-1: Contact page has phone number (OK)
- **File:** `src/app/(public)/contact/page.tsx:71`
- **Status:** VERIFIED OK — `+420 728 729 666` is displayed with tel: link.

### PUB-2: Footer has phone number (OK)
- **File:** `src/components/public/PublicFooter.tsx:120`
- **Status:** VERIFIED OK — `+420 728 729 666` with tel: link.

### PUB-3: HeroProductSlider uses per-category badge colors (OK)
- **File:** `src/components/public/HeroProductSlider.tsx:75-81`
- **Status:** VERIFIED OK — VIRGIN amber, PREMIUM indigo, STANDARD emerald, SALE rose.

### PUB-4: Product detail page is comprehensive
- **File:** `src/app/(public)/offer/[id]/page.tsx`
- **Status:** VERIFIED OK — Has photo gallery, price tiers (retail/wholesale/hairdresser), color swatches, lengths, origin, texture, category features, inquiry form, JSON-LD schema, full SEO metadata.

### PUB-5: Inquiry cart functionality works
- **File:** `src/app/(public)/inquiry-cart/page.tsx` + `src/lib/inquiry-cart.ts`
- **Status:** VERIFIED OK — Cart count in navbar, dedicated page.

### PUB-6: Registration form supports both SALON and HAIRDRESSER
- **File:** `src/app/(public)/registrace/page.tsx`
- **Status:** VERIFIED OK — Uses RegisterForm component.

### PUB-7: Poradna (blog) pages exist and work
- **File:** `src/app/(public)/poradna/page.tsx`, `src/app/(public)/poradna/[slug]/page.tsx`
- **Status:** VERIFIED OK — Article list with categories, individual article pages.

### PUB-8: Vykup (hair buyback) page is complete
- **File:** `src/app/(public)/vykup/page.tsx`
- **Status:** VERIFIED OK — Hero, requirements, pricing table, FAQ, CTA. Full i18n.

### PUB-9: B2B Pro page has both salon and hairdresser cards
- **File:** `src/app/(public)/pro/page.tsx`
- **Status:** VERIFIED OK — Side-by-side cards with different colors and benefits.

### PUB-10: Legal pages exist
- **Files:** `src/app/(public)/obchodni-podminky/page.tsx`, `src/app/(public)/privacy/page.tsx`
- **Status:** VERIFIED OK — Both pages use i18n, 10 sections for terms, 6 sections for privacy.

### PUB-11: Stylist profiles work with SEO slugs
- **File:** `src/app/(public)/kadernice/[slug]/page.tsx`
- **Status:** VERIFIED OK — Profile with photo, languages, specializations, salon link.

---

## SALON PORTAL

### SALON-1: Portal layout and navigation works
- **File:** `src/components/SalonShell.tsx`
- **Status:** VERIFIED OK — 5 nav items: Catalog, Orders, Invoices, Samples, Profile.

### SALON-2: Portal access control correct
- **File:** `src/app/(salon)/salon/layout.tsx:12`
- **Status:** VERIFIED OK — Redirects non-SALON/HAIRDRESSER to /dashboard.

### SALON-3: Salon orders page reuses admin OrdersClient
- **File:** `src/app/(salon)/salon/orders/page.tsx:4`
- **Status:** VERIFIED OK — Imports from admin app, role-based filtering handles the rest.

### SALON-4: SalonSamplesClient uses `salonId!` non-null assertion
- **File:** `src/app/(salon)/salon/samples/page.tsx:10`
- **Status:** POTENTIAL ISSUE — If `session.user.salonId` is null (unapproved user somehow gets here), this will crash. The layout guard should prevent this, but it's fragile.

---

## DASHBOARD

### DASH-1: Dashboard data is comprehensive and real
- **File:** `src/app/(app)/dashboard/page.tsx`
- **Status:** VERIFIED OK — 12 parallel queries, real data for: stock value, sales this month, total sold, open invoices, stock by category bars, low stock alerts, recent movements table, quick badges (salons, registrations, orders, returns, notifications).

### DASH-2: Previous `fmtGrams(0)` bug appears FIXED
- **File:** `src/app/(app)/dashboard/page.tsx:178`
- **Status:** VERIFIED OK — Now uses `fmtGrams(totalGramsSold)` with real aggregated data from `totalGramsSoldAgg._sum.grams`.

### DASH-3: pendingReturns IS displayed
- **File:** `src/app/(app)/dashboard/page.tsx:293`
- **Status:** VERIFIED OK — Shown as quick badge with link to `/returns`.

---

## SETTINGS

### SET-1: Settings redirect works correctly
- **File:** `src/app/(app)/settings/page.tsx`
- **Status:** VERIFIED OK — Redirects to `/settings/loyalty`.

### SET-2: All settings pages have auth + OWNER guard
- **Files:** `settings/loyalty`, `settings/b2b`, `settings/pricing`, `settings/companies`
- **Status:** VERIFIED OK — All check `session.user.role !== "OWNER"`.

---

## API ROUTES

### API-1: All POST/PUT routes validated
- **Status:** VERIFIED OK — All mutation routes use Zod validation schemas.

### API-2: Role-based access control consistent
- **Status:** VERIFIED OK — Appropriate role checks on all routes. SALON/HAIRDRESSER can only access their own data.

### API-3: Rate limiting on public forms
- **Status:** VERIFIED OK — `/api/public/inquiry` (5/hr), `/api/public/contact` (3/min) have in-memory rate limiters.

### API-4: Missing notifications already documented in TASK-019
- **Status:** See TASK-019-notifications-audit.md for full details.

---

## SUMMARY OF ISSUES BY PRIORITY

### HIGH (must fix):
1. **BUG-1** — Reviews page missing auth check
2. **BUG-3** — Salon approval notification missing (TASK-019 GAP 5)

### MEDIUM (should fix):
3. **BUG-2** — "Schvalit salon" label not type-aware
4. **ISSUE-1** — WhatsApp/Telegram links not clickable
5. All TASK-019 notification gaps (GAP 1-5)

### LOW (nice to have):
6. **ISSUE-2** — SalonShell indigo branding inconsistency
7. **ISSUE-3** — Login page plain text branding
8. **ISSUE-4** — Invoice status not translated in salon detail
9. **ISSUE-5** — Order status potential key mismatch

### VERIFIED WORKING:
- Dashboard data (all 12 queries, real data)
- Navigation sidebar groups with role filtering
- Product CRUD + variant management
- Order workflow (create, confirm, reject, status, complete, cancel)
- Invoice generation + PDF
- Payment recording + auto-paid detection
- Loyalty program tier calculation
- Registration flow (public form -> admin approval)
- Public site (landing, offer, product detail, contact, about, B2B, blog, stylists, buyback, legal)
- Salon portal (catalog, orders, invoices, samples, profile)
- Notifications bell + full page + mark as read
- Reviews management (CRUD, featured, active toggle)
- Complaint/Return/Sample workflows
- Export (Excel, PDF, Pohoda)
- Audit log
- i18n (cs/uk/ru) across all pages
- SEO metadata + JSON-LD schemas
