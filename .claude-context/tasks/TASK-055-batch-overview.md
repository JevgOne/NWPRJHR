# TASK-055: Batch Overview (Naskladnovaci varky)

## Goal

Add an explicit batch management system for stock-in operations. A batch (varka) represents a single stocking session that may span multiple days. Each delivery belongs to exactly one batch. The batch overview page shows aggregate financials per batch.

---

## 1. Why an Explicit Batch Model

Date-based grouping was the original plan, but it fails because:
- A single stocking session can span 2+ days (e.g. started evening of July 15, finished morning of July 16)
- Multiple unrelated stocking sessions could happen on the same day
- There's no way to "close" a batch or add metadata (name, notes) without a model

The existing `batchCode` field on Delivery (`String?`, schema line 298) is a free-text string — not a foreign key. It's unsuitable as a grouping key because:
- No validation (typos create phantom batches)
- No metadata (name, status, creation date)
- No referential integrity

### Solution: New `StockBatch` Model

A lightweight model that owns deliveries. The existing `batchCode` field on Delivery is repurposed as a foreign key to `StockBatch.id`.

---

## 2. Data Model

### New Model: `StockBatch`

```prisma
model StockBatch {
  id          String    @id @default(cuid())
  name        String                          // e.g. "Várka 1 — červenec 2026"
  status      String    @default("OPEN")      // "OPEN" | "CLOSED"
  note        String?
  createdAt   DateTime  @default(now())
  closedAt    DateTime?
  updatedAt   DateTime  @updatedAt

  deliveries  Delivery[]

  @@index([status])
  @@index([createdAt])
  @@map("stock_batches")
}
```

### Delivery Model Changes

Replace the free-text `batchCode String?` with a proper relation:

```prisma
model Delivery {
  // ... existing fields ...

  // REMOVE: batchCode String?
  // ADD:
  batchId     String?
  batch       StockBatch? @relation(fields: [batchId], references: [id])

  // ... rest unchanged ...
  @@index([batchId])  // ADD
}
```

### Migration Strategy

1. Create `StockBatch` table
2. Add `batchId` column to `deliveries` (nullable)
3. For existing deliveries: group by `stockedAt` date, create one StockBatch per date, set `batchId`
4. Remove `batchCode` column from `deliveries`

**Migration script (in migration SQL or a seed script):**

```sql
-- 1. Create stock_batches table
CREATE TABLE stock_batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add batchId to deliveries
ALTER TABLE deliveries ADD COLUMN batch_id TEXT REFERENCES stock_batches(id);

-- 3. Backfill: group existing deliveries by stockedAt date
-- (done in a TypeScript migration script since SQLite can't do INSERT...SELECT with grouping easily)
```

**TypeScript backfill script:** `scripts/migrate-batches.ts`

```typescript
// For each unique stockedAt date:
//   1. Create a StockBatch with name = "Várka {date}"
//   2. Update all deliveries on that date to point to the batch
//   3. Set batch status to "CLOSED" (historical batches)
```

### Auto-Naming

When creating a new batch automatically:
- Format: `B-{YYYY}-{MM}-{seq}` where seq is 1-indexed within the month
- Display name: `Várka {seq} — {month} {year}` (e.g. "Várka 1 — červenec 2026")
- Example IDs: `B-2026-07-01`, `B-2026-07-02`

The `name` field is editable — user can rename to anything.

---

## 3. StockInForm Integration

### Batch Selector in StockInForm

**File:** `src/components/inventory/StockInForm.tsx`

Add a batch selector at the top of the form (before category/origin). This is the first thing the user sees.

```
┌──────────────────────────────────────────────────┐
│ Várka: [▼ Várka 1 — červenec 2026 (otevřená)  ] │
│        [+ Nová várka]                            │
├──────────────────────────────────────────────────┤
│ Kategorie: [VIRGIN] [LUXE] [STANDARD] [SALE]    │
│ ...rest of form...                               │
└──────────────────────────────────────────────────┘
```

**Behavior:**
1. On form load, fetch open batches via `GET /api/inventory/batches?status=OPEN`
2. If exactly one open batch exists → auto-select it
3. If no open batches → show "Vytvořit novou várku" button, auto-create on click
4. If multiple open batches → show dropdown to select
5. "+ Nová várka" button always visible → creates new batch, selects it

**Changes to submit body:**
- Add `batchId: string` to the POST body sent to `/api/deliveries`
- Both `stockInSchema` and `newStockInSchema` in `delivery.ts` get a new optional field: `batchId: z.string().optional()`

**Changes to StockInForm:**
- New state: `batchId`, `batches` (list of open batches)
- New `useEffect` to fetch open batches on mount
- New UI: dropdown + "new batch" button at the top of the form
- Submit body includes `batchId`

### API: POST /api/deliveries Changes

**File:** `src/app/api/deliveries/route.ts`

When creating a delivery, if `batchId` is provided:
1. Verify the batch exists and is OPEN
2. Set `delivery.batchId = batchId`

If `batchId` is NOT provided (backward compat):
1. Find the most recent OPEN batch, or create a new one
2. Set `delivery.batchId = newBatch.id`

### stock-in.ts Changes

**File:** `src/lib/stock-in.ts`

Add `batchId?: string` to `StockInInput`. Pass it through to `delivery.create()`.

---

## 4. Batch API

### `GET /api/inventory/batches`

**File:** `src/app/api/inventory/batches/route.ts` (new)

**Query params:**
- `status` — `OPEN` | `CLOSED` | omit for all
- `from` — start date (YYYY-MM-DD)
- `to` — end date (YYYY-MM-DD)

**Response:** Array of batch summaries with aggregated delivery data.

**Authorization:** OWNER only.

```typescript
const batches = await prisma.stockBatch.findMany({
  where: {
    ...(status ? { status } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    } : {}),
  },
  include: {
    deliveries: {
      include: {
        variant: {
          select: {
            lengthCm: true, color: true,
            retailPricePerGram: true, retailPricePerPiece: true,
            sellingMode: true,
            product: { select: { name: true, category: true, texture: true } },
          },
        },
        supplier: { select: { name: true } },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### `POST /api/inventory/batches`

Create a new batch. Auto-generates name.

**Body:** `{ name?: string }` — optional custom name, otherwise auto-generated.

**Response:** Created batch object.

### `PUT /api/inventory/batches/[id]`

Update batch: rename, add note, or close.

**Body:** `{ name?: string; note?: string; status?: "OPEN" | "CLOSED" }`

When `status` changes to `CLOSED`, set `closedAt = now()`.

### `GET /api/inventory/batches/[id]`

Detailed batch with all deliveries. Used for batch detail view.

---

## 5. Batch Overview Page

### URL: `/inventory/batches`

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Sklad > Várky                              [+ Nová várka]       │
├──────────────────────────────────────────────────────────────────┤
│ [Filtr: Od ____ Do ____]  [Stav: Všechny ▼]                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ── OTEVŘENÉ ──────────────────────────────────────────────────── │
│ │ Várka 2 — červenec 2026        │ 12 ks │ 1.5kg │ OTEVŘENÁ │  │
│ │  Dodavatelé: Nataliya, Olena   │       │       │ [Uzavřít] │  │
│                                                                  │
│ ── UZAVŘENÉ ──────────────────────────────────────────────────── │
│ │▶ Várka 1 — červenec 2026       │32 ks│3.2kg│150k│300k│100%│  │
│ │▶ Várka 3 — červen 2026         │18 ks│1.8kg│ 85k│170k│100%│  │
│ │▶ Várka 2 — červen 2026         │45 ks│5.0kg│220k│440k│100%│  │
├──────────────────────────────────────────────────────────────────┤
│ CELKEM (uzavřené): 95ks │ 10.0kg │ 455 000Kč │ 910 000Kč │100% │
└──────────────────────────────────────────────────────────────────┘
```

**Open batches** are shown at the top with a "Uzavřít" (Close) button.
**Closed batches** are shown below with financial summaries and accordion detail.

### Batch Detail (accordion)

Click on a closed batch row to expand:

```
│ ▼ Várka 1 — červenec 2026  │ 32ks │ 3.2kg │ 150 000Kč │ 300 000Kč │100% │
├─────────────────────────────────────────────────────────────────────────┤
│ SKU         │ Produkt              │ Délka│Barva│  g  │ Nákup/g │Prodej/g│
│ L-RV-02-60  │ Luxe Vlasy — Rovné   │ 60cm │  2 │ 200g│  80 Kč  │ 160 Kč │
│ L-RV-05-40  │ Luxe Vlasy — Rovné   │ 40cm │  5 │ 150g│  70 Kč  │ 140 Kč │
│ V-VL-01-80  │ Panenské V. — Vlnité │ 80cm │  1 │ 100g│  90 Kč  │ 180 Kč │
│─────────────────────────────────────────────────────────────────────────│
│                                          Zbývá z várky: 2800g (87.5%)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Closing a Batch

When user clicks "Uzavřít":
1. Confirmation dialog: "Uzavřít várku '{name}'? Nové naskladnění půjde do nové várky."
2. `PUT /api/inventory/batches/{id}` with `{ status: "CLOSED" }`
3. Batch is locked — no new deliveries can be added
4. Financial summary is finalized (shown in the overview)

**Reopening:** Not supported in v1. If needed, admin can manually update via API.

---

## 6. Validation Schema Changes

**File:** `src/lib/validations/delivery.ts`

```typescript
// Add to both stockInSchema and newStockInSchema:
batchId: z.string().optional(),

// New:
export const stockBatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  note: z.string().max(1000).optional(),
});

export const stockBatchUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  note: z.string().max(1000).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});
```

---

## 7. StockInForm Page Changes

**File:** `src/app/(app)/inventory/stock-in/page.tsx`

The server component needs to fetch open batches and pass them to StockInForm:

```typescript
const openBatches = await prisma.stockBatch.findMany({
  where: { status: "OPEN" },
  orderBy: { createdAt: "desc" },
  select: { id: true, name: true, createdAt: true },
});
```

Pass `openBatches` as a prop to `StockInForm`.

---

## 8. i18n Keys

**File:** `messages/cs.json` (under `stock` namespace)

```json
"batches": "Várky",
"batchOverview": "Přehled várek",
"batchName": "Název várky",
"batchOpen": "Otevřená",
"batchClosed": "Uzavřená",
"batchClose": "Uzavřít várku",
"batchCloseConfirm": "Uzavřít várku \"{name}\"? Nové naskladnění půjde do nové várky.",
"batchNew": "Nová várka",
"batchSelect": "Vyberte várku",
"batchAutoName": "Várka {seq} — {month} {year}",
"batchPieces": "Kusů",
"batchWeight": "Váha",
"batchPurchase": "Nákup",
"batchRetail": "Prodej",
"batchMargin": "Marže",
"batchSuppliers": "Dodavatelé",
"batchRemaining": "Zbývá",
"batchTotal": "Celkem",
"batchNoData": "Žádné várky v tomto období",
"batchFilterFrom": "Od",
"batchFilterTo": "Do",
"batchStatus": "Stav",
"batchAll": "Všechny"
```

Same keys in `messages/uk.json` and `messages/ru.json` with translations.

---

## 9. Margin Calculation

```
purchaseTotal = SUM(delivery.purchasePricePerGramCZK * delivery.initialGrams)
retailTotal   = SUM(variant.retailPricePerGram * delivery.initialGrams)
               + SUM(variant.retailPricePerPiece * delivery.initialPieces)  // for BY_PIECE
margin        = (retailTotal - purchaseTotal) / purchaseTotal * 100
```

Uses current retail prices (not historical). Acceptable for portfolio value view.

---

## 10. Formatting

### Prices
All prices in halere. Display as CZK: `(halere / 100).toLocaleString("cs-CZ") + " Kč"`

### Weight
Display in KG when >= 1000g: `3 200g` → `3.2 kg`

### Margin Color
- Green (>= 80%): good
- Amber (50-79%): moderate
- Red (< 50%): low

### Date
Czech format: `15.7.2026` via `toLocaleDateString("cs-CZ")`

---

## File Change Summary

### Schema + Migration

| File | Action |
|------|--------|
| `prisma/schema.prisma` | **MODIFY** — add `StockBatch` model, add `batchId` + relation to Delivery, remove `batchCode` |
| `scripts/migrate-batches.ts` | **CREATE** — backfill existing deliveries into auto-created batches |

### API

| File | Action |
|------|--------|
| `src/app/api/inventory/batches/route.ts` | **CREATE** — GET (list) + POST (create) |
| `src/app/api/inventory/batches/[id]/route.ts` | **CREATE** — GET (detail) + PUT (update/close) |
| `src/app/api/deliveries/route.ts` | **MODIFY** — accept `batchId`, auto-assign if not provided |
| `src/lib/stock-in.ts` | **MODIFY** — add `batchId` to StockInInput, pass to delivery create |
| `src/lib/validations/delivery.ts` | **MODIFY** — add `batchId` to schemas, add `stockBatchSchema` + `stockBatchUpdateSchema` |

### Frontend

| File | Action |
|------|--------|
| `src/app/(app)/inventory/batches/page.tsx` | **CREATE** — server component: auth, data fetch, aggregation |
| `src/app/(app)/inventory/batches/BatchOverviewClient.tsx` | **CREATE** — client component: table, accordion, filters, close button |
| `src/components/inventory/StockInForm.tsx` | **MODIFY** — add batch selector dropdown at top |
| `src/app/(app)/inventory/stock-in/page.tsx` | **MODIFY** — fetch open batches, pass to StockInForm |
| `src/app/(app)/inventory/page.tsx` | **MODIFY** — add "Várky" button to header |

### i18n

| File | Action |
|------|--------|
| `messages/cs.json` | **MODIFY** — add `stock.batch*` keys |
| `messages/uk.json` | **MODIFY** — add `stock.batch*` keys |
| `messages/ru.json` | **MODIFY** — add `stock.batch*` keys |

**Total: 6 new files, 10 modified files**

---

## What NOT to Do

- **Do NOT group by date alone** — a batch can span multiple days
- **Do NOT use free-text batchCode** — no referential integrity, prone to typos
- **Do NOT show purchase prices to EMPLOYEE** — batch page is OWNER-only
- **Do NOT add batch page to AppShell main nav** — sub-page of inventory, accessible via button
- **Do NOT allow editing closed batches** — no adding/removing deliveries after close
- **Do NOT make batchId mandatory on Delivery** — nullable for backward compat, auto-assigned when not provided

---

## Implementation Order

1. **Schema + migration** — add StockBatch model, alter Delivery, run backfill
2. **API endpoints** — batch CRUD + delivery route changes
3. **StockInForm** — batch selector
4. **Batch overview page** — table + accordion + filters
5. **Navigation** — link from inventory page

Each step is independently deployable after step 1.

---

## Migration Details

### Step-by-step

1. Add `StockBatch` model to schema
2. Add `batchId String?` + relation to Delivery (keep `batchCode` temporarily)
3. Run `prisma migrate` (or `prisma db push` for Turso)
4. Run `scripts/migrate-batches.ts`:
   - Group all deliveries by `DATE(stockedAt)`
   - For each date group: create a StockBatch (name = "Várka — {date}", status = "CLOSED")
   - Update all deliveries in that group to set `batchId`
5. Verify: `SELECT COUNT(*) FROM deliveries WHERE batch_id IS NULL` should be 0
6. Remove `batchCode` column from Delivery in a subsequent migration

### Backward Compatibility

- `batchId` is nullable → old deliveries work without migration
- The backfill script sets `batchId` for ALL existing deliveries
- After backfill, no delivery has null `batchId`
- The `batchCode` column is removed in a separate migration after verification
