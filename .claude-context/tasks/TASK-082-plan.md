# Reservation System with Payment - Implementation Plan

## Context & Requirements

User wants a reservation system where customers/salons can **reserve a product variant** with a **payment deadline**. This is NOT "just a reservation" — the hair must be paid for. The flow: create reservation -> pay by deadline -> confirmed, or expire if not paid.

The existing `Reservation` model in the schema is a **stock hold** tied to `Order` (locks grams/pieces while order is pending). The new system is a separate concept: a **paid reservation** for products that may not be in stock yet, or that customer wants to hold.

## Important: Reuse Existing Reservation vs New Model

The current `Reservation` model is tightly coupled to Order (orderId required, used only for stock holds during order processing). Creating the reservation system on top of it would break existing order workflow. We need a **new model** `ProductReservation` (or rename concept).

**Decision: Create a new `ProductReservation` model** — keeps the existing Order->Reservation stock-hold system intact.

---

## Phase 1: Database Model

### New Prisma Model: `ProductReservation`

```prisma
enum ProductReservationStatus {
  PENDING      // created, awaiting payment
  PAID         // payment received
  COMPLETED    // product delivered / picked up
  EXPIRED      // payment deadline passed without payment
  CANCELLED    // manually cancelled by admin
}

model ProductReservation {
  id              String                     @id @default(cuid())
  reservationNumber String?                  @unique

  // WHO is reserving
  customerType    CustomerType               // SALON, RETAIL, HAIRDRESSER
  salonId         String?
  salon           Salon?                     @relation(fields: [salonId], references: [id])
  customerId      String?
  customer        Customer?                  @relation(fields: [customerId], references: [id])

  // Contact info (for cases without salon/customer record)
  contactName     String?
  contactEmail    String?
  contactPhone    String?

  // WHAT is reserved
  variantId       String
  variant         Variant                    @relation(fields: [variantId], references: [id])
  grams           Int
  pieces          Int

  // PRICING (snapshot at reservation time)
  pricePerUnit    Int                        // halere — per gram or per piece depending on selling mode
  lineTotal       Int                        // halere — total price for this reservation
  sellingMode     String                     @default("BY_GRAM") // BY_GRAM or BY_PIECE

  // PAYMENT
  status          ProductReservationStatus   @default(PENDING)
  paymentDueDate  DateTime                   // deadline for payment
  paidAt          DateTime?
  paymentNote     String?

  // LINK to sale (when completed → creates a Sale)
  saleId          String?                    @unique
  // sale relation added on Sale model

  // LINK to invoice (auto-generated on creation for TRANSFER payment)
  invoiceId       String?                    @unique
  // invoice relation added on Invoice model

  // ADMIN
  note            String?
  internalNote    String?
  createdByUserId String
  // createdByUser relation on User model

  createdAt       DateTime                   @default(now())
  updatedAt       DateTime                   @updatedAt

  @@index([status])
  @@index([salonId])
  @@index([customerId])
  @@index([variantId])
  @@index([paymentDueDate])
  @@index([createdAt])
  @@map("product_reservations")
}
```

### Schema Changes (Relations on existing models)

Add to `Variant`:
```prisma
productReservations ProductReservation[]
```

Add to `Salon`:
```prisma
productReservations ProductReservation[]
```

Add to `Customer`:
```prisma
productReservations ProductReservation[]
```

Add to `User`:
```prisma
reservationsCreated ProductReservation[] @relation("ReservationsCreated")
```

Add to `Sale`:
```prisma
productReservation ProductReservation?
```

### Notification type addition

Add to `NotificationType` enum:
```prisma
RESERVATION_CREATED
RESERVATION_PAID
RESERVATION_EXPIRED
```

### SQL Migration (manual for Turso)

```sql
-- Create product_reservations table
CREATE TABLE product_reservations (
  id TEXT PRIMARY KEY,
  reservationNumber TEXT UNIQUE,
  customerType TEXT NOT NULL,
  salonId TEXT REFERENCES salons(id),
  customerId TEXT REFERENCES customers(id),
  contactName TEXT,
  contactEmail TEXT,
  contactPhone TEXT,
  variantId TEXT NOT NULL REFERENCES variants(id),
  grams INTEGER NOT NULL,
  pieces INTEGER NOT NULL,
  pricePerUnit INTEGER NOT NULL,
  lineTotal INTEGER NOT NULL,
  sellingMode TEXT NOT NULL DEFAULT 'BY_GRAM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  paymentDueDate DATETIME NOT NULL,
  paidAt DATETIME,
  paymentNote TEXT,
  saleId TEXT UNIQUE,
  invoiceId TEXT UNIQUE,
  note TEXT,
  internalNote TEXT,
  createdByUserId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_reservations_status ON product_reservations(status);
CREATE INDEX idx_product_reservations_salonId ON product_reservations(salonId);
CREATE INDEX idx_product_reservations_customerId ON product_reservations(customerId);
CREATE INDEX idx_product_reservations_variantId ON product_reservations(variantId);
CREATE INDEX idx_product_reservations_paymentDueDate ON product_reservations(paymentDueDate);
CREATE INDEX idx_product_reservations_createdAt ON product_reservations(createdAt);
```

After SQL migration, update `prisma/schema.prisma` with the model + run `npx prisma generate` (no `db push` for Turso).

---

## Phase 2: Business Logic Library

### File: `src/lib/reservations.ts`

Functions needed:

#### `createProductReservation(input, userId)`
- Validates variant exists + is active
- Calculates price (same logic as sales — respect B2B discounts for SALON/HAIRDRESSER)
- Sets `paymentDueDate` (default: 3 days from now, configurable)
- Generates `reservationNumber` (format: `RES-YYYYMMDD-NNN`)
- Creates the record
- Optionally auto-generates an Invoice for TRANSFER payments
- Sends notification to OWNER

#### `markReservationPaid(reservationId, userId, note?)`
- Updates status to PAID
- Sets `paidAt`
- Sends notification

#### `completeReservation(reservationId, userId)`
- Creates a Sale from the reservation (reuse `completeSale` pattern)
- Links sale to reservation
- Updates status to COMPLETED

#### `cancelReservation(reservationId, userId, reason?)`
- Updates status to CANCELLED
- If invoice was created, cancel the invoice

#### `expireOverdueReservations()`
- Called by cron job
- Finds all PENDING reservations where `paymentDueDate < now()`
- Updates status to EXPIRED
- Sends notification to admin

---

## Phase 3: API Routes

### `src/app/api/reservations/route.ts`

**GET** — list reservations (with filters: status, salonId, customerId, page/limit)
- OWNER/EMPLOYEE: see all
- SALON/HAIRDRESSER: see only their own

**POST** — create new reservation
- OWNER/EMPLOYEE: can create for any salon/customer
- Body: `{ customerType, salonId?, customerId?, contactName?, contactEmail?, contactPhone?, variantId, grams, pieces, paymentDueDate?, note? }`

### `src/app/api/reservations/[id]/route.ts`

**GET** — get reservation detail

**POST** — actions (same pattern as orders):
- `action: "mark_paid"` — mark as paid (OWNER only)
- `action: "complete"` — complete reservation → create sale (OWNER only)
- `action: "cancel"` — cancel reservation (OWNER only)
- `action: "update"` — update note, paymentDueDate, etc.

### `src/app/api/cron/expire-reservations/route.ts`

- Called by cron (same pattern as existing cron jobs)
- Runs `expireOverdueReservations()`

---

## Phase 4: Admin UI

### File: `src/app/(app)/reservations/page.tsx`

Server component — auth check, render client.

### File: `src/app/(app)/reservations/ReservationsClient.tsx`

- Table view of all reservations
- Status filter tabs: All | PENDING | PAID | COMPLETED | EXPIRED | CANCELLED
- Each row shows: date, customer/salon name, product variant, amount, status, payment deadline
- Color-coded status badges (same pattern as OrdersClient)
- Click → detail page

### File: `src/app/(app)/reservations/new/page.tsx`

Server component — fetch products for picker.

### File: `src/app/(app)/reservations/new/NewReservationForm.tsx`

Form to create reservation:
1. **Customer selection** — reuse `CustomerSelect` component (SALON or RETAIL)
2. **Product selection** — product/variant picker (same as NewSaleWizard) or barcode scan
3. **Quantity** — grams or pieces input
4. **Payment deadline** — date picker (default: +3 days)
5. **Note** — optional
6. **Price preview** — show calculated price (reuse `/api/sales/price-preview`)
7. **Submit** — creates reservation

### File: `src/app/(app)/reservations/[id]/page.tsx`

Server component — fetch reservation by id.

### File: `src/app/(app)/reservations/[id]/ReservationDetailClient.tsx`

Detail view:
- Reservation info (number, date, customer, product, amount, status)
- Payment deadline countdown (if PENDING)
- Action buttons based on status:
  - PENDING: "Mark as Paid", "Cancel"
  - PAID: "Complete (create sale)", "Cancel"
  - COMPLETED: link to Sale
  - EXPIRED/CANCELLED: read-only
- Invoice link (if exists)
- Notes section
- Audit history

---

## Phase 5: Navigation

### Update `AppShell.tsx`

Add to `groupSales` section (after `orders`):
```ts
{ href: "/reservations", label: t("reservations"), roles: ["OWNER", "EMPLOYEE"] },
```

### Update translations (`messages/cs.json`, `uk.json`, `ru.json`)

Add to `nav`:
```json
"reservations": "Rezervace"
```

Add new section `reservation`:
```json
"reservation": {
  "title": "Rezervace",
  "newReservation": "Nová rezervace",
  "reservationNumber": "Číslo rezervace",
  "paymentDueDate": "Splatnost",
  "status": "Stav",
  "pending": "Čeká na platbu",
  "paid": "Zaplaceno",
  "completed": "Dokončeno",
  "expired": "Expirovalo",
  "cancelled": "Zrušeno",
  "markPaid": "Označit jako zaplaceno",
  "complete": "Dokončit (vytvořit prodej)",
  "cancel": "Zrušit",
  "noReservations": "Žádné rezervace",
  "selectProduct": "Vyberte produkt",
  "quantity": "Množství",
  "deadline": "Datum splatnosti",
  "estimatedPrice": "Odhadovaná cena",
  "createReservation": "Vytvořit rezervaci",
  "daysLeft": "Zbývá {days} dní",
  "overdue": "Po splatnosti",
  "contactInfo": "Kontaktní údaje",
  "paymentInfo": "Platební údaje"
}
```

---

## Phase 6: Cron Job for Expiration

### File: `src/app/api/cron/expire-reservations/route.ts`

- GET endpoint (callable by Vercel Cron or manual trigger)
- Finds all `PENDING` reservations where `paymentDueDate < now()`
- Updates them to `EXPIRED`
- Notifies OWNER about expired reservations
- Pattern: same as existing cron routes in `src/app/api/cron/`

---

## Implementation Order

1. **DB**: Add Prisma model + SQL migration + `prisma generate`
2. **Lib**: Create `src/lib/reservations.ts` with business logic
3. **Validation**: Create `src/lib/validations/reservation.ts` (Zod schemas)
4. **API**: Create API routes (GET/POST for list + detail/actions)
5. **UI - List**: Create reservations list page
6. **UI - Create**: Create new reservation form
7. **UI - Detail**: Create reservation detail page with actions
8. **Navigation**: Add to AppShell + translations
9. **Cron**: Add expiration cron job
10. **Notifications**: Add notification types + email templates

---

## Key Design Decisions

1. **Separate from existing Reservation** — existing model is a stock-hold for orders, not a customer-facing reservation with payment
2. **Does NOT hold stock** — this reservation is a commitment to buy, not a stock lock. The hair gets deducted from stock only when the reservation is completed (converted to sale)
3. **Invoice on creation** — for TRANSFER payments, auto-generate an invoice so the customer can pay via bank transfer with the generated variable symbol + QR payment code
4. **Payment tracking** — admin manually marks as paid (same as current invoice payment matching)
5. **Expiration** — cron job checks daily, expires unpaid reservations past deadline
6. **Completion → Sale** — when paid and completed, creates a real Sale record (FIFO deduction, stock movement, everything)

## Files to Create/Modify

### New files:
- `src/lib/reservations.ts`
- `src/lib/validations/reservation.ts`
- `src/app/api/reservations/route.ts`
- `src/app/api/reservations/[id]/route.ts`
- `src/app/api/cron/expire-reservations/route.ts`
- `src/app/(app)/reservations/page.tsx`
- `src/app/(app)/reservations/ReservationsClient.tsx`
- `src/app/(app)/reservations/loading.tsx`
- `src/app/(app)/reservations/new/page.tsx`
- `src/app/(app)/reservations/new/NewReservationForm.tsx`
- `src/app/(app)/reservations/[id]/page.tsx`
- `src/app/(app)/reservations/[id]/ReservationDetailClient.tsx`

### Modified files:
- `prisma/schema.prisma` — add ProductReservation model + relations + enum + NotificationType
- `src/components/AppShell.tsx` — add reservations nav item
- `messages/cs.json` — add nav.reservations + reservation section
- `messages/uk.json` — add nav.reservations + reservation section
- `messages/ru.json` — add nav.reservations + reservation section
