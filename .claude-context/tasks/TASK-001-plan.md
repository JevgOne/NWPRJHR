# TASK-001: B2B/Dropshipping System with Three Price Tiers

## Implementation Plan

**Date:** 2026-06-26
**Status:** Ready for implementation

---

## Overview

The system currently has two customer types (SALON, RETAIL) with wholesale and retail pricing on Variant. We need to add a third tier (HAIRDRESSER) between them. The existing Salon model and registration already handle B2B salons with admin approval. We extend this to also support individual hairdressers.

### Price Tiers

| Tier | Example Price (per gram) | Discount | Maps to |
|------|-------------------------|----------|---------|
| CUSTOMER | retailPricePerGram (500 EUR) | 0% | New public visitors |
| HAIRDRESSER | ~20% off retail | 20% | Individual stylists |
| SALON | wholesalePricePerGram (36% off retail) | 36% | Registered salons |

### Key Architectural Decision

**Reuse existing Variant pricing fields** rather than adding new columns per tier:
- `wholesalePricePerGram` = Salon price (existing, already used)
- `retailPricePerGram` = Customer price (existing, already used)
- **Hairdresser price** = calculated: `retailPricePerGram * (1 - hairdresserDiscountPercent / 100)` using a configurable discount stored in a new `B2BSettings` model

This avoids schema bloat and keeps the pricing logic centralized.

---

## Phase 1: Schema & Auth Changes

### Step 1.1: Extend Prisma Schema

**File:** `prisma/schema.prisma`

Add `HAIRDRESSER` to the `CustomerType` enum (used in Sale):
```
enum CustomerType {
  SALON
  RETAIL
  HAIRDRESSER   // <-- NEW
}
```

Add `HAIRDRESSER` to the `Role` enum (used in User/auth):
```
enum Role {
  OWNER
  EMPLOYEE
  SALON
  HAIRDRESSER   // <-- NEW
}
```

Add new model for B2B tier settings:
```
model B2BSettings {
  id                      String @id @default(cuid())
  hairdresserDiscountPct  Int    @default(2000)  // basis points: 2000 = 20%
  salonDiscountPct        Int    @default(3600)  // basis points: 3600 = 36%
  updatedAt               DateTime @updatedAt
  @@map("b2b_settings")
}
```

**Note:** This replaces the need for a third price column on Variant. The discounts are off the `retailPricePerGram`.

**Dependencies:** None. Must be done first.

**After schema change:**
```bash
npx prisma db push   # (or generate + migrate)
```

### Step 1.2: Update Auth (NextAuth) to support HAIRDRESSER role

**File:** `src/lib/auth.ts`

Current auth already handles SALON role with approval check. Extend:
- In `authorize()`: Add similar block for HAIRDRESSER users — check if they have an associated Salon (or a new `HairdresserProfile`) that is approved
- The `Role` type import from Prisma already covers the new enum value
- Session/JWT types already use `Role` — no changes needed there

**Decision: Hairdresser storage model**

Option A: Hairdressers get their own `Salon` record (type field) — reuse existing Salon infrastructure (approval, dashboard, orders)
Option B: New `HairdresserProfile` model

**Recommended: Option A** — Add a `type` field to Salon:
```
// In Salon model, add:
type  SalonType @default(SALON)

enum SalonType {
  SALON
  HAIRDRESSER
}
```

This lets hairdressers reuse all existing salon infrastructure: orders, invoices, samples, portal.

### Step 1.3: Seed B2BSettings

**File:** `prisma/seed.ts` (or a migration script)

Create a default B2BSettings record:
```ts
await prisma.b2BSettings.upsert({
  where: { id: "default" },
  create: { id: "default", hairdresserDiscountPct: 2000, salonDiscountPct: 3600 },
  update: {},
});
```

---

## Phase 2: Pricing Logic

### Step 2.1: Update sale-pricing.ts

**File:** `src/lib/sale-pricing.ts`

Current `getSalePrice()` returns `wholesalePricePerGram` for SALON, `retailPricePerGram` for RETAIL.

Extend to support HAIRDRESSER:
```ts
export async function getSalePrice(
  variantId: string,
  customerType: CustomerType,
  _salonId?: string
): Promise<{ pricePerGram: number }> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: variantId },
  });

  if (customerType === "RETAIL") {
    return { pricePerGram: variant.retailPricePerGram };
  }

  if (customerType === "HAIRDRESSER") {
    const settings = await prisma.b2BSettings.findFirst();
    const discountPct = settings?.hairdresserDiscountPct ?? 2000;
    const price = roundHalereUp(
      (variant.retailPricePerGram * (10000 - discountPct)) / 10000
    );
    return { pricePerGram: price };
  }

  // SALON: wholesale price (+ loyalty discounts applied separately)
  return { pricePerGram: variant.wholesalePricePerGram };
}
```

### Step 2.2: Update salon-portal catalog API

**File:** `src/app/api/salon-portal/catalog/route.ts`

Currently only serves SALON role. Extend to also serve HAIRDRESSER:
- Check `session.user.role` is `SALON` or `HAIRDRESSER`
- For HAIRDRESSER: calculate price as `retailPricePerGram * (1 - hairdresserDiscountPct/10000)`
- For SALON: keep existing wholesale + loyalty discount logic

### Step 2.3: Public product page — show price based on logged-in user

**File:** `src/app/(public)/offer/[id]/page.tsx`

Currently shows NO prices (inquiry-based model). Now:
- If user is not logged in → show retail price (or "from X EUR")
- If user is logged in as HAIRDRESSER → show hairdresser price with "your price" badge
- If user is logged in as SALON → show salon/wholesale price with "your price" badge
- Add `auth()` call to get session, pass tier info to a client component

**New component:** `PriceBadge.tsx` — displays the appropriate price with tier label

### Step 2.4: Admin B2B Settings page

**File:** `src/app/(app)/settings/b2b/page.tsx` (NEW)

Admin UI to configure:
- Hairdresser discount percentage
- Salon discount percentage (informational — salon uses wholesale directly)
- Preview calculated prices for a sample product

**API:** `src/app/api/b2b-settings/route.ts` (NEW)
- GET: return current settings
- PUT: update settings (OWNER only)

---

## Phase 3: Registration

### Step 3.1: Extend registration form for hairdressers

**File:** `src/app/(public)/registrace/RegisterForm.tsx`

Add a "type" selector at the top of the form:
- "Salon / Studio" (existing flow)
- "Individual Hairdresser" (new)

When "Hairdresser" is selected:
- Hide salon-specific fields (salon name → use personal name)
- IČO becomes optional (not all hairdressers have it)
- Add optional field: certification/photo upload
- The rest remains the same (contact, password, terms)

### Step 3.2: Update register-salon API

**File:** `src/app/api/public/register-salon/route.ts`

Extend the schema to accept a `type` field:
```ts
const registerSchema = z.object({
  type: z.enum(["SALON", "HAIRDRESSER"]).default("SALON"),
  // ... existing fields ...
  ico: z.string().min(1).max(20).optional(), // make optional for hairdressers
});
```

In the transaction:
- Set `salon.type` based on the `type` field
- Set `user.role` to `"SALON"` or `"HAIRDRESSER"` based on type
- Salon created with `approved: false` (same as now)

### Step 3.3: Update login redirect logic

**File:** `src/app/login/LoginForm.tsx` (or wherever redirect happens)

After login:
- OWNER/EMPLOYEE → `/dashboard` (existing)
- SALON → `/salon/catalog` (existing)
- HAIRDRESSER → `/salon/catalog` (reuse salon portal)

**File:** `src/app/(salon)/salon/layout.tsx`

Update guard:
```ts
// Currently: if (session.user.role !== "SALON") redirect("/dashboard");
// Change to:
if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") {
  redirect("/dashboard");
}
```

---

## Phase 4: Admin Management

### Step 4.1: Update admin salons list to show type

**File:** `src/app/(app)/salons/SalonsClient.tsx`

- Add a "Type" column or badge showing SALON vs HAIRDRESSER
- Add filter tab or dropdown to filter by type
- Pending approval salons should show prominently (already shows `approved` badge)

### Step 4.2: Update admin salon detail

**File:** `src/app/(app)/salons/[id]/SalonDetailClient.tsx`

- Show salon type (SALON / HAIRDRESSER)
- Approve/reject functionality already exists — just verify it works for both types

### Step 4.3: Update salons API

**File:** `src/app/api/salons/route.ts`

Add `type` filter parameter to GET:
```ts
const type = url.searchParams.get("type"); // "SALON" | "HAIRDRESSER" | null
if (type) where.type = type;
```

**File:** `src/app/api/salons/[id]/route.ts`
- No changes needed — already handles all salon records

---

## Phase 5: B2B Landing Page

### Step 5.1: Create /pro page

**File:** `src/app/(public)/pro/page.tsx` (NEW)

Public landing page for the B2B program:
- Hero section: "Join our B2B program"
- Two cards: "For Salons" and "For Hairdressers"
- Benefits for each tier (pricing advantage, priority support, etc.)
- How it works (register → get approved → start ordering)
- CTA buttons → `/registrace`
- Fully translated (cs/uk/ru)

### Step 5.2: Add navigation link

**File:** `src/components/public/PublicNavbar.tsx`

Add "Pro kadeřníky" / "For Professionals" link in the navbar pointing to `/pro`

### Step 5.3: Add translations

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

New translation keys under `"b2b"`:
```json
{
  "b2b": {
    "pageTitle": "Pro kadeřníky a salony",
    "heroTitle": "Spolupracujte s Hairland",
    "heroSubtitle": "Získejte zvýhodněné ceny na prémiové vlasy",
    "salonCard": { "title": "Pro salony", "discount": "Až 36% sleva", ... },
    "hairdresserCard": { "title": "Pro kadeřnice", "discount": "20% sleva", ... },
    "howItWorks": { ... },
    "ctaRegister": "Zaregistrovat se",
    "ctaLogin": "Přihlásit se"
  }
}
```

Also add translations for:
- Registration form type selector
- Price badge labels ("Vaše cena", "Retail cena", etc.)
- B2B dashboard labels

---

## Phase 6: B2B Dashboard Enhancements

### Step 6.1: Salon portal dashboard

**File:** `src/app/(salon)/salon/page.tsx` or `dashboard/page.tsx` (NEW if not exists)

Dashboard showing:
- Current tier (SALON / HAIRDRESSER) with discount percentage
- Total orders / Total spent
- Recent orders with status
- Quick links to catalog, orders, invoices, profile

This is mostly an assembly of existing data that the salon portal already shows across different pages.

### Step 6.2: Show tier-specific pricing in catalog

**File:** `src/app/(salon)/salon/catalog/CatalogClient.tsx`

Add a banner at top: "Your tier: Salon — 36% discount" or "Your tier: Hairdresser — 20% discount"

Prices are already shown from the API response (which we updated in Step 2.2).

---

## Implementation Order (Dependencies)

```
Phase 1 (Schema + Auth)
  ├── Step 1.1: Prisma schema changes
  ├── Step 1.2: Auth updates (depends on 1.1)
  └── Step 1.3: Seed B2BSettings (depends on 1.1)

Phase 2 (Pricing) — depends on Phase 1
  ├── Step 2.1: sale-pricing.ts
  ├── Step 2.2: salon-portal catalog API
  ├── Step 2.3: Public product page pricing
  └── Step 2.4: Admin B2B settings

Phase 3 (Registration) — depends on Phase 1
  ├── Step 3.1: Registration form
  ├── Step 3.2: Register API
  └── Step 3.3: Login redirect

Phase 4 (Admin) — depends on Phase 1
  ├── Step 4.1: Salons list
  ├── Step 4.2: Salon detail
  └── Step 4.3: Salons API

Phase 5 (Landing page) — independent, can be parallel
  ├── Step 5.1: /pro page
  ├── Step 5.2: Navbar link
  └── Step 5.3: Translations

Phase 6 (Dashboard) — depends on Phase 2
  ├── Step 6.1: Dashboard page
  └── Step 6.2: Catalog tier banner
```

**Parallelizable:** Phases 3, 4, 5 can run in parallel after Phase 1 is complete. Phase 6 requires Phase 2.

---

## Files to Create (NEW)

| File | Purpose |
|------|---------|
| `src/app/(public)/pro/page.tsx` | B2B landing page |
| `src/app/api/b2b-settings/route.ts` | B2B settings API |
| `src/app/(app)/settings/b2b/page.tsx` | Admin B2B settings UI |
| `src/app/(app)/settings/b2b/B2BSettingsClient.tsx` | Client component for B2B settings |

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add HAIRDRESSER to Role + CustomerType enums, SalonType enum, B2BSettings model, type field on Salon |
| `src/lib/auth.ts` | Add HAIRDRESSER role approval check in authorize(), add `isHairdresser()` helper |
| `src/lib/sale-pricing.ts` | Add HAIRDRESSER pricing logic |
| `src/app/api/salon-portal/catalog/route.ts` | Support HAIRDRESSER role, calculate hairdresser prices |
| `src/app/(public)/offer/[id]/page.tsx` | Show prices based on user tier |
| `src/app/(public)/registrace/RegisterForm.tsx` | Add type selector (Salon/Hairdresser) |
| `src/app/api/public/register-salon/route.ts` | Accept type field, set correct role |
| `src/app/(salon)/salon/layout.tsx` | Allow HAIRDRESSER role access |
| `src/app/(app)/salons/SalonsClient.tsx` | Show type column/badge |
| `src/app/(app)/salons/[id]/SalonDetailClient.tsx` | Show salon type |
| `src/app/api/salons/route.ts` | Add type filter |
| `src/app/(salon)/salon/catalog/CatalogClient.tsx` | Add tier banner |
| `src/components/public/PublicNavbar.tsx` | Add /pro link |
| `messages/cs.json` | Add b2b translations |
| `messages/uk.json` | Add b2b translations |
| `messages/ru.json` | Add b2b translations |
| `src/lib/validations/salon.ts` | Add type to createSalonSchema |

---

## Risks & Considerations

1. **SQLite enum migration**: Prisma with SQLite may require `db push` rather than migrations for enum changes. Test with `npx prisma db push`.

2. **Existing SALON data**: Adding `type` field with `@default(SALON)` is backward-compatible. All existing salons automatically get `type = SALON`.

3. **Session JWT invalidation**: Adding new role doesn't break existing JWTs — the `role` field is already a string in the JWT. Existing SALON/OWNER/EMPLOYEE users continue working.

4. **Currency**: Task mentions EUR (500 EUR, 400 EUR), but the system uses CZK halere internally. The prices stored in `Variant.retailPricePerGram` and `Variant.wholesalePricePerGram` are in halere. The discount percentages are currency-agnostic, so this is fine.

5. **Loyalty discount stacking**: For SALON tier, the existing loyalty discount (from `LoyaltySettings`) should NOT stack on top of the B2B salon discount — they are the same thing. The `B2BSettings.salonDiscountPct` is informational/display only; the actual salon price comes from `wholesalePricePerGram`. For HAIRDRESSER, loyalty should not apply (they don't have tiers).
