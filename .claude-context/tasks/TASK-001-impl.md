# TASK-001: B2B/Dropshipping System — Implementation Output

**Date:** 2026-06-26
**Status:** Complete (5.5 of 6 phases)

---

## Completed Phases

### Phase 1: Schema & Auth Changes

- **prisma/schema.prisma**: Added `HAIRDRESSER` to `Role` and `CustomerType` enums. Added `SalonType` enum (`SALON`, `HAIRDRESSER`). Added `type SalonType @default(SALON)` to `Salon` model. Created `B2BSettings` model with `hairdresserDiscountPct` (default 2000) and `salonDiscountPct` (default 3600).
- **src/lib/auth.ts**: Updated `authorize()` to block unapproved HAIRDRESSER users. Added `isHairdresser()` and `isB2B()` helper functions.
- **prisma/seed.ts**: Added B2BSettings upsert with default values.

### Phase 2: Pricing Logic

- **src/lib/sale-pricing.ts**: Added HAIRDRESSER case — calculates price as `retailPricePerGram * (10000 - hairdresserDiscountPct) / 10000` from B2BSettings.
- **src/app/api/salon-portal/catalog/route.ts**: Extended to allow HAIRDRESSER role. HAIRDRESSER gets retail-based discount price; SALON keeps wholesale + loyalty logic.
- **src/lib/api/product-serializer.ts**: Added HAIRDRESSER case to `serializeVariantForRole` switch (was causing undefined return and build failure).
- **src/app/api/b2b-settings/route.ts** (NEW): GET/PUT for B2BSettings, OWNER only.
- **src/app/(app)/settings/b2b/page.tsx** (NEW): Server component with OWNER guard.
- **src/app/(app)/settings/b2b/B2BSettingsClient.tsx** (NEW): Client component with discount inputs and price preview table.
- **Step 2.3 NOT implemented**: Public product page (`src/app/(public)/offer/[id]/page.tsx`) does not exist in the codebase — there is no base page to extend with tier-based pricing. This would require creating a new product detail page from scratch, which is a separate task.

### Phase 3: Registration

- **src/app/(public)/registrace/RegisterForm.tsx**: Added type selector (Salon/Hairdresser), salon name hidden for hairdressers, ICO made optional for hairdressers.
- **src/app/api/public/register-salon/route.ts**: Added `type` field to schema with default "SALON", made `ico` optional, sets correct `salon.type` and `user.role`, updated notification email.
- **src/app/(salon)/salon/layout.tsx**: Updated guard to allow both SALON and HAIRDRESSER roles.
- **src/app/(app)/dashboard/page.tsx**: Added redirect for SALON/HAIRDRESSER to `/salon/catalog`.

### Phase 4: Admin Management

- **src/app/(app)/salons/SalonsClient.tsx**: Added type badge (blue for HAIRDRESSER), pending approval badge, type filter dropdown.
- **src/app/(app)/salons/[id]/SalonDetailClient.tsx**: Added HAIRDRESSER type badge in header.
- **src/app/api/salons/route.ts**: Added `type` filter parameter, updated SALON role scoping to include HAIRDRESSER.

### Phase 5: B2B Landing Page

- **src/app/(public)/pro/page.tsx** (NEW): Landing page with hero, two cards (Salon/Hairdresser with benefits), how-it-works steps, CTA section.
- **src/components/public/PublicNavbar.tsx**: Added `/pro` link.
- **messages/cs.json, uk.json, ru.json**: Added complete `b2b`, `b2bSettings`, registration type selector, role translations.

### Phase 6: Dashboard Enhancements

- **src/app/(salon)/salon/catalog/CatalogClient.tsx**: Added tier banner showing discount info for HAIRDRESSER and SALON roles.
- **src/app/(salon)/salon/catalog/page.tsx**: Passes `role` prop to CatalogClient.

---

## Cross-Cutting: HAIRDRESSER Role Guards (~30+ files)

Updated all files that had SALON-specific role checks to also handle HAIRDRESSER:

**API routes blocking admin access:**
- deliveries, samples, salon-portal/profile, sales, stylists, customers, stock, invoices, orders, credit-notes, gdpr, salons/[id]

**Page guards:**
- stylists (3 pages), customers (2 pages), inventory, sales/new

**UI conditional checks:**
- OrdersClient.tsx, SalesHistoryClient.tsx

---

## Validation Schema Updates

- **src/lib/validations/salon.ts**: Added `type: z.enum(["SALON", "HAIRDRESSER"]).optional()` to `createSalonSchema`.

---

## Build Status

`next build` passes successfully. All pages compile including new `/pro` and `/settings/b2b`.

---

## Known Issues / Remaining Work

1. **Database schema push**: `prisma db push` cannot run against Turso/LibSQL (`libsql://` URL not supported by Prisma push). Schema changes need to be applied via Turso CLI or migration SQL. `prisma generate` works fine.
2. **Seed B2BSettings**: Needs to be run after schema is applied to DB.
3. **Step 2.3 (Public product page)**: Not implemented — the public offer detail page does not exist. Creating it is a separate feature.

---

## New Files Created

| File | Purpose |
|------|---------|
| `src/app/(public)/pro/page.tsx` | B2B landing page |
| `src/app/api/b2b-settings/route.ts` | B2B settings API (OWNER) |
| `src/app/(app)/settings/b2b/page.tsx` | Admin B2B settings page |
| `src/app/(app)/settings/b2b/B2BSettingsClient.tsx` | B2B settings client component |
