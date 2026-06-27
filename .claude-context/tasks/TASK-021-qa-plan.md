# TASK-021: Complete QA Test Plan — Hairland Admin + Public Web

## Overview

Comprehensive test plan for the entire admin panel (www.hairland.cz) and public website. Covers every sidebar item, all CRUD operations, edge cases, and role-based access.

**Test environment**: Production at www.hairland.cz
**Roles to test**: OWNER (full access), EMPLOYEE (limited), SALON (salon portal)

---

## PART 1: ADMIN PANEL (`/app/(app)/`)

### 1. Prehled (Dashboard) — `/dashboard`
- [ ] Page loads without errors for OWNER/EMPLOYEE/SALON roles
- [ ] StatCards show correct values (revenue, orders, products, margin)
- [ ] Revenue sub-values (this month, last month) are plausible
- [ ] Margin percentage is positive (negative = seed data bug)
- [ ] Category distribution chart renders with correct colors
- [ ] Recent movements table shows data with correct type badges
- [ ] QuickBadges (active salons, pending registrations, pending orders, pending returns, unread notifications) show correct counts
- [ ] QuickBadge links navigate to correct pages
- [ ] All data is real (no hardcoded/mock values)

### 2. Oznameni (Notifications) — `/notifications`
- [ ] Notification list loads
- [ ] Unread notifications are visually distinct from read
- [ ] Click on notification marks it as read
- [ ] "Mark all as read" button works
- [ ] NotificationBell in header shows correct unread count
- [ ] Clicking NotificationBell opens dropdown with recent notifications
- [ ] Notification links navigate to correct entity (order, invoice, etc.)
- [ ] Notification types display correct icons/labels

### 3. Produkty (Products) — `/products`
- [ ] Product list loads with all products
- [ ] Category filter tabs work (ALL, VIRGIN, PREMIUM, STANDARD, SALE)
- [ ] Search by name works
- [ ] Product cards show image, name, category badge, price
- [ ] Click on product navigates to detail page
- [ ] "New product" button visible for OWNER/EMPLOYEE

#### 3a. Product Detail — `/products/[id]`
- [ ] Product detail page loads with all fields
- [ ] Variant list shows all variants with prices
- [ ] Edit product form pre-fills all fields
- [ ] Save changes works (PUT request succeeds)
- [ ] Image upload/display works
- [ ] Price displayed correctly (halere → CZK conversion)

#### 3b. New Product — `/products/new`
- [ ] Create product form renders all required fields
- [ ] Category dropdown works
- [ ] Supplier autocomplete works
- [ ] Origin autocomplete works
- [ ] Variant creation (length, weight, price) works
- [ ] Form validation shows errors for missing fields
- [ ] Successful creation redirects to product detail
- [ ] New product appears in product list

### 4. Sklad (Inventory) — `/inventory`
- [ ] Inventory table loads with all products/variants
- [ ] Stock quantities are shown correctly
- [ ] Search/filter works
- [ ] "Naskladnit" (stock-in) button navigates correctly

#### 4a. Naskladneni — `/inventory/stock-in`
- [ ] Stock-in form renders
- [ ] Product/variant selection works
- [ ] Quantity, batch number, cost fields work
- [ ] Supplier selection works
- [ ] Submit creates delivery and movement records
- [ ] Stock quantity updates after stock-in

#### 4b. Pohyby (Movements) — `/inventory/movements`
- [ ] Movement history list loads
- [ ] Movement type badges show correct colors (RECEIPT, SALE, RETURN, etc.)
- [ ] Date range filter works
- [ ] Type filter works
- [ ] Movement details are accurate

#### 4c. Delivery Detail — `/inventory/deliveries/[id]`
- [ ] Delivery detail page loads
- [ ] Shows all items in delivery
- [ ] Back button works
- [ ] Cost and quantity data is correct

### 5. Dodavatele (Suppliers) — `/suppliers`
- [ ] Supplier list loads
- [ ] "Add supplier" button works (OWNER only)
- [ ] Create supplier form validates required fields
- [ ] Edit supplier works
- [ ] Delete supplier works (with confirmation)
- [ ] Supplier detail shows associated products

### 6. Prodeje (Sales) — `/sales`
- [ ] Sales history list loads
- [ ] Revenue and margin columns show correct values
- [ ] **CHECK: Are there sales with NEGATIVE margin? If yes → seed data bug**
- [ ] Date filter works
- [ ] Sale detail shows all items, prices, customer info

#### 6a. New Sale — `/sales/new`
- [ ] Sale wizard renders (step-by-step)
- [ ] Customer selection works
- [ ] Product/variant selection works
- [ ] Quantity and price fields work
- [ ] Discount application works
- [ ] Total calculation is correct
- [ ] Submit creates sale, movements, and optional invoice
- [ ] Stock decreases after sale

### 7. Objednavky (Orders) — `/orders`
- [ ] Order list loads with status badges
- [ ] Status filter tabs work (ALL, NEW, CONFIRMED, READY, IN_TRANSIT, COMPLETED, REJECTED, CANCELLED)
- [ ] Click on order navigates to detail

#### 7a. Order Detail — `/orders/[id]`
- [ ] Order detail page loads with all items
- [ ] Confirm button works → status changes to CONFIRMED, salon gets notification
- [ ] Reject button works → status changes to REJECTED, salon gets notification
- [ ] Mark as READY → status changes, salon gets notification
- [ ] Mark as IN_TRANSIT → status changes, salon gets notification
- [ ] Complete order → creates sale + invoice, sends INVOICE_ISSUED notification
- [ ] Cancel order → status changes to CANCELLED (**GAP: no notification sent — see Task #19**)
- [ ] Cannot confirm already confirmed order (button disabled/hidden)

### 8. Faktury (Invoices) — `/invoices`
- [ ] Invoice list loads with status badges (ISSUED, PAID, OVERDUE, CANCELLED)
- [ ] Status filter tabs work
- [ ] Click on invoice opens detail
- [ ] Invoice detail shows all line items, amounts, dates
- [ ] PDF download/generation works
- [ ] Total amounts are correct (halere → CZK)

### 9. Platby (Payments) — `/payments`
- [ ] Payment list loads (OWNER only)
- [ ] Unmatched payments are highlighted
- [ ] Payment matching modal works
- [ ] Assigning payment to invoice updates both records
- [ ] Matching creates INCOMING_PAYMENT and INVOICE_PAID notifications
- [ ] Payment amounts display correctly

### 10. Salony (Salons) — `/salons`
- [ ] Salon list loads with all salons
- [ ] Filter by approved/pending works
- [ ] Search by name works
- [ ] Salon type badge (SALON/HAIRDRESSER) displays correctly

#### 10a. Salon Detail — `/salons/[id]`
- [ ] Salon detail loads with all fields
- [ ] Contact info, address displayed
- [ ] Approve button works for pending salons
- [ ] Approve button label says "Schvalit salon" for SALON type and "Schvalit kadernici" for HAIRDRESSER (**BUG: currently hardcoded "Schvalit salon" — see Task #21 report**)
- [ ] **GAP: Approval sends no notification to salon user — see Task #19**
- [ ] Order history for salon shown
- [ ] Edit salon details works

### 11. Kadernice (Stylists) — `/stylists`
- [ ] Stylist list loads
- [ ] "Add stylist" button works
- [ ] Stylist cards show photo, name, salon
- [ ] Click navigates to stylist detail or salon detail

### 12. Zakaznici (Customers) — `/customers`
- [ ] Customer list loads
- [ ] Search by name/email works
- [ ] Customer detail shows order history
- [ ] Edit customer info works

### 13. Registrace (Registrations) — `/registrations`
- [ ] Pending registrations list loads
- [ ] Registration detail shows all submitted info
- [ ] Approve registration creates salon record
- [ ] Reject registration updates status
- [ ] Badge count in sidebar matches actual pending count
- [ ] Approved registrations disappear from pending list

### 14. Recenze (Reviews) — `/reviews`
- [ ] **CRITICAL BUG: No auth check on this page** — page renders without `auth()` guard
- [ ] Review list loads (assuming auth is fixed)
- [ ] Source badges (GOOGLE, INTERNAL, etc.) display correctly
- [ ] Approve/reject review works
- [ ] Star rating display works
- [ ] Negative reviews trigger Telegram notification

### 15. Reklamace (Complaints) — `/complaints`
- [ ] Complaint list loads (OWNER only)
- [ ] Status badges display correctly
- [ ] Create new complaint form works
- [ ] Complaint detail shows all info
- [ ] Status update works (NEW → IN_PROGRESS → RESOLVED/REJECTED)

### 16. Vratky (Returns) — `/returns`
- [ ] Return list loads
- [ ] Status filter works
- [ ] Create new return form works
- [ ] Return detail shows items and reason
- [ ] Approve return → stock adjustment, status update
- [ ] Reject return → status update
- [ ] RETURN_REQUEST notification sent to OWNER on creation

### 17. Vzorky (Samples) — `/samples`
- [ ] Sample list loads
- [ ] Status badges (REQUESTED, SENT, RETURNED) display
- [ ] Create sample request works
- [ ] Mark as SENT updates status (**GAP: no notification to salon — see Task #19**)
- [ ] Mark as RETURNED updates status

### 18. Finance — `/finance`
- [ ] Finance overview loads (OWNER only)
- [ ] Revenue chart renders
- [ ] Cost breakdown displays
- [ ] Partner/supplier costs shown
- [ ] Date range filter works
- [ ] Totals are mathematically consistent

### 19. Slevy (Discounts) — `/discounts`
- [ ] Discount list loads (OWNER only)
- [ ] Create new discount works
- [ ] Discount types (PERCENTAGE, FIXED, VOLUME) display correctly
- [ ] Edit discount works
- [ ] Delete/deactivate discount works
- [ ] Discount application in sales works correctly

### 20. Export — `/export`
- [ ] Export page loads (OWNER only)
- [ ] Excel export generates downloadable file
- [ ] Pohoda XML export generates valid XML
- [ ] PDF invoice bulk export works
- [ ] Date range filter works
- [ ] Downloaded files have correct filenames (currently use "hairora-export-..." — **minor: should be "hairland-export-..."**)

### 21. Vernostni program (Loyalty) — `/settings/loyalty`
- [ ] Loyalty settings page loads (OWNER only)
- [ ] Point rules configuration works
- [ ] Save settings persists changes
- [ ] Settings reflected in loyalty calculations

### 22. B2B — `/settings/b2b`
- [ ] B2B discount settings page loads (OWNER only)
- [ ] Tier configuration works
- [ ] Save settings works

### 23. Cenotvorba (Pricing) — `/settings/pricing`
- [ ] Pricing settings page loads (OWNER only)
- [ ] Margin/markup configuration works
- [ ] Save settings works

### 24. Firmy (Companies) — `/settings/companies`
- [ ] Company list loads (OWNER only)
- [ ] Create new company (ICO, name, address) works
- [ ] Edit company works
- [ ] Delete company works
- [ ] Company used in invoice generation

### 25. Audit Log — `/audit-log`
- [ ] Audit log list loads (OWNER only)
- [ ] Entries show action, user, entity, timestamp
- [ ] Filter by action type works
- [ ] Filter by date range works
- [ ] Pagination works for large datasets

---

## PART 2: PUBLIC WEBSITE (`/app/(public)/`)

### 26. Homepage — `/`
- [ ] Page loads with hero section
- [ ] Product slider (HeroProductSlider) renders and cycles
- [ ] Category badges show correct colors
- [ ] CTA buttons navigate correctly
- [ ] Responsive design (mobile/tablet/desktop)

### 27. Nabidka (Offer) — `/offer`
- [ ] ProductsShowcase loads all products
- [ ] Category filter buttons work
- [ ] Origin filter works
- [ ] Length filter works
- [ ] Product cards show image, name, price, category badge
- [ ] "Add to inquiry cart" button works
- [ ] Price display correct (halere → CZK)
- [ ] Sorting works (price, name)

### 28. Product Detail — `/offer/[slug]`
- [ ] Product detail page loads
- [ ] All variants listed with prices
- [ ] Variant selection works
- [ ] Add to inquiry cart works
- [ ] Product images display
- [ ] Description and specifications shown
- [ ] Related products section (if any)

### 29. Poptavkovy kosik (Inquiry Cart) — `/inquiry-cart`
- [ ] Cart page loads
- [ ] Added items display with quantities
- [ ] Remove item works
- [ ] Change quantity works
- [ ] Submit inquiry form works
- [ ] Form validates required fields (name, email, phone)
- [ ] Successful submission shows confirmation
- [ ] NEW_INQUIRY notification sent to OWNER (**GAP: only email+Telegram, no in-app — see Task #19**)

### 30. Kontakt (Contact) — `/contact`
- [ ] Contact page loads
- [ ] Contact form renders all fields
- [ ] Form validation works
- [ ] Submit sends email + Telegram notification
- [ ] **WhatsApp and Telegram links are NOT clickable** — displayed as plain text (**BUG — see Task #21 report**)
- [ ] Address, phone, email displayed correctly
- [ ] Map (if any) renders

### 31. Registrace — `/registrace`
- [ ] Registration form loads
- [ ] Salon/Hairdresser type selection works
- [ ] Form validates all required fields
- [ ] Successful registration creates pending record
- [ ] REGISTRATION notification sent to OWNER
- [ ] Confirmation message shown to user

### 32. Blog/Poradna — `/poradna`
- [ ] Article list loads
- [ ] Category filter works
- [ ] Article detail page loads
- [ ] Content renders correctly (markdown/HTML)

### 33. Kadernice (Stylists listing) — `/kadernice`
- [ ] Stylist listing page loads
- [ ] Stylist cards show photo, name, specialization
- [ ] Click navigates to stylist detail

#### 33a. Stylist Detail — `/kadernice/[slug]`
- [ ] Stylist detail page loads
- [ ] Contact info displayed
- [ ] Portfolio/gallery shown
- [ ] Social links work (WhatsApp, Telegram, Instagram)

### 34. O nas (About) — `/about`
- [ ] About page loads
- [ ] Content renders correctly

### 35. Obchodni podminky — `/obchodni-podminky`
- [ ] Terms page loads
- [ ] Content renders correctly

### 36. Privacy — `/privacy`
- [ ] Privacy policy page loads
- [ ] Content renders correctly

### 37. Vykup — `/vykup`
- [ ] Hair buyback page loads
- [ ] Form/info renders correctly

### 38. Pro (Professional) — `/pro`
- [ ] Professional page loads
- [ ] Content renders correctly

---

## PART 3: SALON PORTAL (`/app/(salon)/salon/`)

### 39. Salon Catalog — `/salon/catalog`
- [ ] Product catalog loads
- [ ] Products shown with variants and prices
- [ ] **Variant display may be ugly — see Task #23**
- [ ] Add to order/cart works
- [ ] B2B prices shown (if applicable)

### 40. Salon Orders — `/salon/orders`
- [ ] Order list loads for this salon
- [ ] Status badges correct
- [ ] Create new order works
- [ ] Order detail shows all items

### 41. Salon Invoices — `/salon/invoices`
- [ ] Invoice list loads for this salon
- [ ] PDF download works
- [ ] Status badges correct

### 42. Salon Samples — `/salon/samples`
- [ ] Sample list loads
- [ ] Request new sample works
- [ ] Status updates reflected

### 43. Salon Profile — `/salon/profile`
- [ ] Profile page loads
- [ ] Edit profile works
- [ ] Save changes persists

---

## PART 4: CROSS-CUTTING CONCERNS

### 44. Authentication & Authorization
- [ ] Login page works (`/login`)
- [ ] Logout works (redirects to `/login`)
- [ ] Unauthenticated access to admin redirected to login
- [ ] Role-based menu items visible only for correct roles
- [ ] **CRITICAL: `/reviews` has NO auth check**
- [ ] EMPLOYEE cannot access OWNER-only pages
- [ ] SALON role redirected to salon portal

### 45. Internationalization (i18n)
- [ ] Language switcher works (cs/uk/ru)
- [ ] All navigation labels translated
- [ ] Notification messages translated
- [ ] Date/number formatting correct per locale

### 46. Responsive Design
- [ ] Mobile sidebar toggle works
- [ ] Tables scroll horizontally on mobile
- [ ] Forms usable on mobile
- [ ] Public site looks good on all breakpoints

### 47. Cookie Banner
- [ ] Cookie banner appears on first visit
- [ ] Accept/reject works
- [ ] Consent stored (key: `hairora_cookie_consent` — **minor: should be `hairland_cookie_consent`**)

### 48. PWA / Icons
- [ ] App icon loads (`/icons/icon-192x192.png`)
- [ ] Manifest file correct
- [ ] Favicon displays in browser tab

---

## Known Bugs Summary (from Task #19 and #21 reports)

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | CRITICAL | No auth check on reviews page | `src/app/(app)/reviews/page.tsx` |
| 2 | CRITICAL | No notification on salon approval | `src/app/api/salons/[id]/route.ts` |
| 3 | HIGH | No notification on order cancel | `src/app/api/orders/[id]/route.ts` |
| 4 | HIGH | No notification on sample SENT | `src/app/api/samples/[id]/route.ts` |
| 5 | MEDIUM | Approve button hardcodes "Schvalit salon" | `src/app/(app)/salons/[id]/SalonDetailClient.tsx` |
| 6 | MEDIUM | WhatsApp/Telegram not clickable | `PublicFooter.tsx`, `contact/page.tsx` |
| 7 | LOW | Export filenames say "hairora" | `ExportClient.tsx`, `export routes` |
| 8 | LOW | Cookie consent key says "hairora" | `CookieBanner.tsx` |
| 9 | LOW | No in-app notification for contact form | `api/public/contact/route.ts` |
| 10 | LOW | No INVOICE_ISSUED on standalone invoice | `api/invoices/route.ts` |
