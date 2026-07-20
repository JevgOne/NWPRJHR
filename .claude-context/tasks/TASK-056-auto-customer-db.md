# TASK-056: Automatic Customer Database from Inquiries & Orders

## Goal

When a public inquiry is submitted, automatically find or create a `Customer` record by email and link it to the `Inquiry`. This builds a customer database passively — every person who submits an inquiry becomes a known customer with full history visible in admin.

**Scope:** Inquiry → Customer auto-upsert + Customer model expansion (firstName/lastName/city) + inquiry form update + admin UI enrichment + backfill migration.

---

## 1. Current State Analysis

### What exists
- `Customer` model: id, **name** (single field), email?, phone?, note, passwordHash, slug
- Customer is linked to `Sale` (customerId FK) and `Invoice` (customerId FK)
- Admin pages: `/customers` (list + search + manual add), `/customers/[id]` (detail with sales history)
- Customer API: GET search, POST create, GET detail, PUT update
- Inquiry form (`InquiryCartClient.tsx`): single `name` field, `email`, `phone`, `message` — NO city field

### What the lead wants on Customer
- **firstName** (Jmeno)
- **lastName** (Prijmeni)
- **email**
- **phone**
- **city** (Mesto kde bydli)

### The gaps
1. `Customer.name` is a single field — needs split into `firstName` + `lastName`
2. No `city` field on Customer
3. `Inquiry` model has `name`, `email`, `phone` but NO `customerId` FK — inquiries are disconnected from customers
4. Inquiry form collects single `name` — needs `firstName` + `lastName` split
5. Inquiry form has no `city` field
6. `Inquiry` model has no `city` field
7. `ContactMessage` model similarly disconnected (lower priority)
8. No auto-creation: customers only exist if manually created or through POS sale flow
9. Admin customer detail shows sales only — no inquiry history
10. Orders are B2B (tied to `Salon`, not `Customer`) — B2B poptavky come through Inquiry, not Order

---

## 2. Schema Changes

### 2.1 Expand Customer model

```prisma
model Customer {
  id           String   @id @default(cuid())
  firstName    String                    // NEW — was "name"
  lastName     String                    // NEW
  name         String                    // KEEP — computed "firstName lastName" for backwards compat
  email        String?
  phone        String?
  city         String?                   // NEW
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  passwordHash String?
  slug         String?  @unique

  sales     Sale[]
  invoices  Invoice[]
  referrals Referral[] @relation("ReferrerCustomer")
  inquiries Inquiry[]                    // NEW

  @@index([email])
  @@index([name])
  @@map("customers")
}
```

**Decision — keep `name` field:** The `name` field is used extensively in Sales, Invoices, and admin UI. Instead of refactoring all consumers, keep `name` as a denormalized field set to `"${firstName} ${lastName}"` on every write. This avoids a massive refactor while adding the structured fields.

### 2.2 Add fields to Inquiry model

```prisma
model Inquiry {
  // ... existing fields ...

  // REPLACE single "name" with first/last (keep "name" for backwards compat)
  firstName    String?                   // NEW — nullable for existing rows
  lastName     String?                   // NEW
  city         String?                   // NEW

  customerId   String?                   // NEW
  customer     Customer?  @relation(fields: [customerId], references: [id])

  // ... rest unchanged ...
  @@index([customerId])
}
```

**Note:** `firstName` and `lastName` are nullable because existing inquiries only have `name`. New inquiries will always populate both. The existing `name` field stays — it's used in emails, Telegram notifications, and admin views.

### 2.3 Migration

```bash
npx prisma migrate dev --name add-customer-fields-and-inquiry-link
```

This migration adds:
- `firstName String?`, `lastName String?`, `city String?` columns to `customers` table
- `firstName String?`, `lastName String?`, `city String?` columns to `inquiries` table
- `customerId String?` column to `inquiries` table with index and FK

**Data migration within the Prisma migration SQL:**
```sql
-- Backfill existing customers: split "name" into firstName/lastName
UPDATE customers SET
  "firstName" = CASE
    WHEN instr(name, ' ') > 0 THEN substr(name, 1, instr(name, ' ') - 1)
    ELSE name
  END,
  "lastName" = CASE
    WHEN instr(name, ' ') > 0 THEN substr(name, instr(name, ' ') + 1)
    ELSE ''
  END
WHERE "firstName" IS NULL;
```

After backfill, make `firstName` and `lastName` required on Customer:
```prisma
  firstName    String    // NOT NULL after backfill
  lastName     String    // NOT NULL after backfill
```

This requires a two-step migration: (1) add nullable + backfill, (2) alter to NOT NULL.

---

## 3. Public Inquiry Form Changes

### 3.1 Form fields update

**File:** `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx`

Replace single `name` field with `firstName` + `lastName` + add `city`:

**Before (line 24):**
```typescript
const [form, setForm] = useState({ name: "", email: "", phone: "", message: reasonMessage, promoCode: "" });
```

**After:**
```typescript
const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", city: "", message: reasonMessage, promoCode: "" });
```

**Form grid (lines 212-242):** Replace single name input with two inputs side by side:
```
[Jmeno *]         [Prijmeni *]
[Email *]          [Telefon]
[Mesto]
```

Both `firstName` and `lastName` are required. `city` is optional.

The submit body (line 114) sends `{ ...form, ... }` which will now include `firstName`, `lastName`, `city` instead of just `name`.

### 3.2 Inquiry API schema update

**File:** `src/app/api/public/inquiry/route.ts`

Update `inquirySchema`:

```typescript
const inquirySchema = z.object({
  firstName: z.string().min(1).max(100),   // NEW — replaces name
  lastName: z.string().min(1).max(100),    // NEW
  name: z.string().min(1).max(200).optional(),  // KEEP for backwards compat (old clients)
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().default(""),
  city: z.string().max(100).optional().default(""),  // NEW
  // ... rest unchanged
});
```

**Backwards compatibility:** If `name` is provided but `firstName`/`lastName` are not, split `name` on first space. This handles any cached old clients.

Compute `name` for storage: `const name = \`${firstName} ${lastName}\`.trim();`

### 3.3 Inquiry model write

In the `prisma.inquiry.create()` call, add:
```typescript
data: {
  name,           // computed from firstName + lastName
  firstName,      // stored separately
  lastName,       // stored separately
  city: city || null,
  // ... rest unchanged
}
```

### 3.4 Notification updates

**Emails, Telegram, in-app notifications** all use `name` — no changes needed since `name` is still computed and stored.

---

## 4. Auto-Upsert Logic

### 4.1 New helper: `src/lib/customer-upsert.ts`

```typescript
export async function upsertCustomerFromContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
}): Promise<string> // returns customerId
```

Logic:
1. `findFirst` where `email = data.email` (case-insensitive via `.toLowerCase()`)
2. If found:
   - Update `phone` if customer's phone is null and data.phone is provided
   - Update `city` if customer's city is null and data.city is provided
   - Update `firstName`/`lastName` if customer's are empty (from pre-split backfill)
   - Return existing id
3. If not found:
   - `create` with firstName, lastName, name (`${firstName} ${lastName}`), email, phone, city
   - Return new id

**Important considerations:**
- Email is the unique identifier for matching
- `name` is always set to `"${firstName} ${lastName}"` on create/update
- Additive merge only — never overwrite non-null fields on existing customer
- No `note`, `slug`, or `passwordHash` set during auto-creation

### 4.2 Integrate into inquiry POST handler

**File:** `src/app/api/public/inquiry/route.ts`

Before `prisma.inquiry.create()`:

```typescript
const customerId = await upsertCustomerFromContact({
  firstName, lastName, email, phone, city
}).catch(() => null);
```

Include `customerId` in the inquiry create data.

### 4.3 Edge cases

| Scenario | Behavior |
|----------|----------|
| Same email, different name | Match by email, keep existing name |
| Same email, new phone/city | Update only if customer's field is null |
| Email with different casing | Normalize to lowercase for matching |
| Upsert fails (DB error) | Log error, continue without linking (non-critical) |
| Rapid duplicate submissions | Rate limiter already prevents this (5/hr/IP) |
| Old client sends `name` without firstName/lastName | Split on first space |

---

## 5. Admin UI Changes

### 5.1 Customer Detail — Show Full Info + Inquiry History

**File:** `src/app/(app)/customers/[id]/CustomerDetailClient.tsx`

Update the info card to show:
```
Jmeno:     Anna Novakova
Email:     anna@email.cz
Telefon:   +420 123 456 789
Mesto:      Praha
```

Add edit fields for firstName, lastName, city.

Add a new `<Card>` section below the sales history:

```
Poptavky (N)
─────────────────────────────────
  16.07.2026    3 polozky    NOVA
  10.06.2026    Poradenstvi  DOKONCENA
```

Each row links to the inquiry detail.

### 5.2 Customer Detail API — Include Inquiries

**File:** `src/app/api/customers/[id]/route.ts`

Add to the `include`:

```typescript
inquiries: {
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    status: true,
    createdAt: true,
    items: { select: { id: true } },
  },
  take: 50,
},
```

Return `inquiriesCount` in response.

### 5.3 Customer List — Show Counts + City

**File:** `src/app/(app)/customers/CustomersClient.tsx`

Show inquiry/sale count badges and city next to each customer.

**File:** `src/app/api/customers/route.ts`

Add `_count: { select: { inquiries: true, sales: true } }` and include `city` in response.

### 5.4 Customer Create/Edit — Update Forms

**File:** `src/app/(app)/customers/CustomersClient.tsx` (add form)
**File:** `src/app/(app)/customers/[id]/CustomerDetailClient.tsx` (edit form)

Replace single `name` input with `firstName` + `lastName`, add `city` input.

**File:** `src/lib/validations/sale.ts` (customerSchema)

Update:
```typescript
export const customerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
});
```

**File:** `src/app/api/customers/route.ts` (POST)

Compute `name` from firstName + lastName before create.

**File:** `src/app/api/customers/[id]/route.ts` (PUT)

Compute `name` from firstName + lastName before update.

### 5.5 Inquiry Admin — Show Customer Link

**File:** `src/app/(app)/inquiries/InquiriesClient.tsx`

If `customerId` exists on inquiry, show a link to the customer profile.

### 5.6 Sale Flow — Customer Selection

The POS sale flow (`SaleForm` or similar) currently uses `customerId` with a customer picker. Update the customer picker to search by firstName, lastName, city in addition to name/email/phone. The `name` field (denormalized) keeps existing search working.

---

## 6. Backfill Migration Script

### 6.1 Script: `scripts/backfill-customer-from-inquiries.ts`

Run once after deployment to link existing inquiries to customers.

Logic:
1. Fetch all inquiries where `customerId IS NULL`, grouped by email (lowercased)
2. For each unique email:
   a. Check if Customer with that email exists
   b. If yes → link all matching inquiries to that customer
   c. If no → create new Customer from the most recent inquiry's data:
      - Split inquiry `name` into firstName (first word) + lastName (rest)
      - email, phone from inquiry
      - city = null (not available on old inquiries)
   d. Link all matching inquiries to the new/found customer
3. Log summary: N customers created, M inquiries linked

**Important:** Run in a transaction per-email-group for consistency.

### 6.2 Execution

```bash
npx tsx scripts/backfill-customer-from-inquiries.ts
```

Idempotent — re-running skips already-linked inquiries.

---

## 7. i18n

### New/updated keys

**Public form** — `messages/{cs,uk,ru}.json` under `public.inquiry`:
```json
{
  "firstNameLabel": "Jmeno",
  "lastNameLabel": "Prijmeni",
  "cityLabel": "Mesto"
}
```

**Admin** — `messages/{cs,uk,ru}.json` under `customer`:
```json
{
  "firstName": "Jmeno",
  "lastName": "Prijmeni",
  "city": "Mesto",
  "inquiries": "Poptavky",
  "noInquiries": "Zadne poptavky",
  "inquiryCount": "Pocet poptavek"
}
```

---

## 8. Files to Modify

### New files (2)
| File | Purpose |
|------|---------|
| `src/lib/customer-upsert.ts` | `upsertCustomerFromContact()` helper |
| `scripts/backfill-customer-from-inquiries.ts` | One-time backfill script |

### Modified files (12)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add firstName/lastName/city to Customer, add firstName/lastName/city/customerId to Inquiry, add inquiries relation |
| `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx` | Split name into firstName+lastName, add city field |
| `src/app/api/public/inquiry/route.ts` | Update schema for firstName/lastName/city, call upsertCustomerFromContact |
| `src/lib/validations/sale.ts` | Update customerSchema with firstName/lastName/city |
| `src/app/api/customers/route.ts` | Update POST to use firstName/lastName/city, add counts to GET |
| `src/app/api/customers/[id]/route.ts` | Update PUT for firstName/lastName/city, include inquiries in GET |
| `src/app/(app)/customers/CustomersClient.tsx` | Split name inputs, add city, show counts |
| `src/app/(app)/customers/[id]/CustomerDetailClient.tsx` | Split name inputs, add city, add inquiry history section |
| `src/app/(app)/inquiries/InquiriesClient.tsx` | Show customer link if customerId exists |
| `messages/cs.json` | Add firstName/lastName/city/inquiry i18n keys |
| `messages/uk.json` | Add firstName/lastName/city/inquiry i18n keys |
| `messages/ru.json` | Add firstName/lastName/city/inquiry i18n keys |

---

## 9. Implementation Order

1. **Schema migration (step 1)** — Add nullable firstName/lastName/city to Customer + Inquiry, add customerId to Inquiry. Run SQL backfill for existing Customer.name split.
2. **Schema migration (step 2)** — Make Customer.firstName and Customer.lastName NOT NULL after backfill.
3. **Validation** — Update `customerSchema` in `src/lib/validations/sale.ts`
4. **Helper** — Create `customer-upsert.ts` with `upsertCustomerFromContact()`
5. **Inquiry form** — Update InquiryCartClient with firstName/lastName/city fields
6. **Inquiry API** — Update schema + create call + integrate upsert
7. **Customer APIs** — Update POST/PUT/GET for new fields + inquiry relations
8. **Customer admin UI** — Update list + detail pages for new fields + inquiry history
9. **Inquiry admin** — Add customer link
10. **Backfill script** — Write and run for existing inquiries → customers
11. **i18n** — Add all translation keys

---

## 10. What This Does NOT Cover

- **ContactMessage → Customer linking** — lower priority, general messages not purchase-intent. Same pattern can be applied later.
- **Order → Customer linking** — Orders are B2B (tied to `Salon`, not `Customer`). B2B poptavky come through the Inquiry system and ARE covered.
- **Customer merge/dedup** — If two customers have different emails but are the same person, admin must merge manually. Out of scope.
- **Customer self-service portal** — `passwordHash` and `slug` fields exist but login/registration is not part of this task.
- **Address fields beyond city** — Only city is added per requirements. Full address (street, zip) not needed now.
