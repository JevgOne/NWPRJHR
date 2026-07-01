# Dual Selling Mode (BY_GRAM + BY_PIECE) -- Implementation Plan

## Overview

Add support for selling products either "by gram" (raw hair, current default) or "by piece" (ponytails/culiky with fixed weight and per-piece pricing). The `sellingMode` is set at the **Variant** level, determined at stock-in time.

---

## PHASE 1: Schema + DB Migration

### 1.1 Prisma Schema Changes

**File: `prisma/schema.prisma`**

Add enum + fields to Variant:

```prisma
enum SellingMode {
  BY_GRAM
  BY_PIECE
}

model Variant {
  // ... existing fields ...
  sellingMode           SellingMode @default(BY_GRAM)
  pricePerPiece         Int?       // halere, used when sellingMode = BY_PIECE (wholesale)
  retailPricePerPiece   Int?       // halere, retail per piece
  // ... rest of fields ...
}
```

**Why two per-piece prices?** The existing gram-based system has `wholesalePricePerGram` (B2B/salon) and `retailPricePerGram` (retail). BY_PIECE needs the same dual pricing: `pricePerPiece` = wholesale, `retailPricePerPiece` = retail.

### 1.2 DB Migration via Turso

```sql
ALTER TABLE variants ADD COLUMN sellingMode TEXT NOT NULL DEFAULT 'BY_GRAM';
ALTER TABLE variants ADD COLUMN pricePerPiece INTEGER;
ALTER TABLE variants ADD COLUMN retailPricePerPiece INTEGER;
```

### 1.3 Prisma Client Regeneration

```bash
npx prisma generate
```

---

## PHASE 2: Validation Schemas

### 2.1 Product Validations

**File: `src/lib/validations/product.ts`**

Update `createVariantsSchema` and `updateVariantSchema`:

```ts
// createVariantsSchema: add optional sellingMode + pricePerPiece
z.object({
  lengthCm: z.number().int().positive().max(150),
  color: z.string().min(1).max(100),
  wholesalePricePerGram: z.number().int().positive(),
  costPricePerGram: z.number().int().min(0).optional(),
  sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).optional(),  // NEW
  pricePerPiece: z.number().int().positive().optional(),      // NEW
  retailPricePerPiece: z.number().int().positive().optional(),// NEW
})

// updateVariantSchema: add same fields
sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).optional(),
pricePerPiece: z.number().int().positive().optional(),
retailPricePerPiece: z.number().int().positive().optional(),
```

### 2.2 Delivery Validations

**File: `src/lib/validations/delivery.ts`**

Update `newStockInSchema`:

```ts
// Add sellingMode + pricePerPiece
sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).default("BY_GRAM"),
pricePerPiece: z.number().int().positive().optional(),
retailPricePerPiece: z.number().int().positive().optional(),
pieceWeightGrams: z.number().int().positive().optional(),
```

Add refinement: if `sellingMode === "BY_PIECE"`, then `pricePerPiece`, `retailPricePerPiece`, `totalPieces`, and `pieceWeightGrams` are required.

### 2.3 Sale Validations

**File: `src/lib/validations/sale.ts`**

Update `saleItemSchema`:
```ts
// grams should allow 0 for BY_PIECE sales
grams: z.number().int().min(0),  // was .positive()
pieces: z.number().int().min(0),
```

Update `pricePreviewSchema` similarly:
```ts
grams: z.number().int().min(0),  // was .positive()
pieces: z.number().int().min(0),
```

---

## PHASE 3: Business Logic (Backend)

### 3.1 Stock-In

**File: `src/lib/stock-in.ts`**

No changes needed -- already accepts `pieceWeightGrams` and `totalPieces`.

**File: `src/app/api/deliveries/route.ts` (POST handler)**

In the "new wizard flow" section:
- Accept `sellingMode`, `pricePerPiece`, `retailPricePerPiece`, `pieceWeightGrams` from body
- When creating a new variant, set these fields
- When `sellingMode === BY_PIECE`: set `totalGrams = totalPieces * pieceWeightGrams`
- Pass `pieceWeightGrams` to `stockIn()` call

Changes needed:
1. When creating variant (line ~129), add `sellingMode`, `pricePerPiece`, `retailPricePerPiece`
2. When `sellingMode === BY_PIECE`, compute `totalGrams` from `totalPieces * pieceWeightGrams`
3. Pass `pieceWeightGrams` to `stockIn()` in the new wizard flow

### 3.2 Sale Pricing

**File: `src/lib/sale-pricing.ts`**

Rewrite `getSalePrice` to return mode-aware pricing:

```ts
export async function getSalePrice(
  variantId: string,
  customerType: CustomerType,
  _salonId?: string
): Promise<{ pricePerGram: number; pricePerPiece: number | null; sellingMode: string }> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: variantId },
  });

  if (variant.sellingMode === "BY_PIECE") {
    // Return per-piece price based on customer type
    let piecePrice: number;
    if (customerType === "RETAIL") {
      piecePrice = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
    } else if (customerType === "HAIRDRESSER") {
      const settings = await prisma.b2BSettings.findFirst();
      const discountPct = settings?.hairdresserDiscountPct ?? 2000;
      const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
      piecePrice = roundHalereUp((retailPerPiece * (10000 - discountPct)) / 10000);
    } else {
      // SALON: wholesale
      piecePrice = variant.pricePerPiece ?? 0;
    }
    return {
      pricePerGram: variant.wholesalePricePerGram, // still needed for COGS
      pricePerPiece: piecePrice,
      sellingMode: "BY_PIECE",
    };
  }

  // Existing BY_GRAM logic (unchanged)
  // ... return { pricePerGram, pricePerPiece: null, sellingMode: "BY_GRAM" }
}
```

Update `calculateLineTotal`:

```ts
export function calculateLineTotal(
  pricePerGram: number,
  grams: number,
  pricePerPiece?: number | null,
  pieces?: number,
  sellingMode?: string
): number {
  if (sellingMode === "BY_PIECE" && pricePerPiece && pieces) {
    return roundHalereUp(pricePerPiece * pieces);
  }
  return roundHalereUp(pricePerGram * grams);
}
```

### 3.3 Complete Sale

**File: `src/lib/sales.ts`**

Key changes to `completeSale`:

1. **Price determination (step 1)**: Fetch variant, check `sellingMode`. For BY_PIECE: use `pricePerPiece`/`retailPricePerPiece` instead of per-gram prices.
2. **Line total (step 1)**: For BY_PIECE: `lineTotal = pricePerPiece * pieces` instead of `pricePerGram * grams`.
3. **FIFO (step 5)**: Already handles piece-based deduction correctly (fifo.ts line 82-87).
4. **Sale item data (step 5)**: For BY_PIECE fifo results, `lineTotal = pricePerPiece * fifo.pieces` instead of `pricePerGram * fifo.grams`.
5. **SaleItem.pricePerGramUsed**: For BY_PIECE, store the `pricePerPiece` value here (repurpose the field) OR keep pricePerGramUsed for COGS and add a separate tracking. **Decision: store pricePerPiece in pricePerGramUsed for BY_PIECE items** -- the field semantically becomes "price per unit used". This avoids schema changes to SaleItem.

Detailed changes:
```ts
// In pricedItems mapping:
const isByPiece = variant.sellingMode === "BY_PIECE";
let pricePerUnit: number;
let lineTotal: number;

if (isByPiece) {
  if (input.customerType === "SALON") {
    pricePerUnit = variant.pricePerPiece ?? 0;
  } else {
    pricePerUnit = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
  }
  lineTotal = roundHalereUp(pricePerUnit * item.pieces);
} else {
  // existing gram logic
  pricePerUnit = pricePerGram;
  lineTotal = roundHalereUp(pricePerGram * item.grams);
}

// In saleItemsData push (inside FIFO loop):
if (isByPiece) {
  lineTotal = roundHalereUp(pricePerUnit * fifo.pieces);
} else {
  lineTotal = roundHalereUp(pricePerUnit * fifo.grams);
}
```

### 3.4 Price Preview API

**File: `src/app/api/sales/price-preview/route.ts`**

Update to return sellingMode + pricePerPiece:

```ts
const [pricing, stock] = await Promise.all([
  getSalePrice(variantId, customerType, salonId),
  getStockNumbers(variantId),
]);

if (pricing.sellingMode === "BY_PIECE") {
  const lineTotal = roundHalereUp((pricing.pricePerPiece ?? 0) * pieces);
  return NextResponse.json({
    sellingMode: "BY_PIECE",
    pricePerPiece: pricing.pricePerPiece,
    pricePerGram: pricing.pricePerGram, // for reference
    lineTotal,
    availableStock: { grams: stock.availableGrams, pieces: stock.availablePieces },
  });
}

// Existing gram response
return NextResponse.json({
  sellingMode: "BY_GRAM",
  pricePerGram: pricing.pricePerGram,
  lineTotal: calculateLineTotal(pricing.pricePerGram, grams),
  availableStock: { grams: stock.availableGrams, pieces: stock.availablePieces },
});
```

### 3.5 Order Workflow

**File: `src/lib/order-workflow.ts`**

Update `createOrder`:
1. Fetch variant `sellingMode`, `pricePerPiece`
2. For BY_PIECE: `lineTotal = pricePerPiece * pieces` (not `pricePerGram * grams`)
3. Stock check: for BY_PIECE, check `availablePieces` primarily
4. OrderItem: `pricePerGram` field stores per-piece price for BY_PIECE (same repurposing as SaleItem)

### 3.6 Invoicing

**File: `src/lib/invoicing.ts`**

Update `createInvoiceFromSale`:
- The `isPiece` check (line 89) already exists and correctly sets unit and quantity
- Change: for BY_PIECE items, `pricePerUnit` should be the per-piece price, not `pricePerGramUsed`
- Since we store pricePerPiece in `pricePerGramUsed` for BY_PIECE, this works automatically
- **No changes needed** -- the existing logic at line 89-98 already handles this correctly:
  ```ts
  const isPiece = item.pieces > 0;
  quantity: isPiece ? item.pieces : item.grams,
  unit: isPiece ? t.piece : t.gram,
  pricePerUnit: item.pricePerGramUsed,  // already stores per-piece for BY_PIECE
  ```

### 3.7 Returns

**File: `src/lib/returns.ts`**

Update `approveReturn`:
- Credit note value calculation (line 107): for BY_PIECE items, `returnValue = pricePerGramUsed * pieces` (not `* grams`)
- Need to detect if the sale item was BY_PIECE. Since we don't have sellingMode on SaleItem, check `saleItem.pieces > 0` as indicator.

```ts
// In approveReturn, line 107-108:
const isByPiece = ret.saleItem.pieces > 0 && ret.pieces > 0;
if (isByPiece) {
  returnValue = ret.saleItem.pricePerGramUsed * ret.pieces;
  // Credit note items:
  unit: "ks",
  quantity: ret.pieces,
} else {
  returnValue = ret.saleItem.pricePerGramUsed * ret.grams;
  // Credit note items:
  unit: "g",
  quantity: ret.grams,
}
```

### 3.8 Complaints

**File: `src/lib/complaints.ts`**

Similar to returns -- when calculating refund amount (line 67):
```ts
const isByPiece = saleItem.pieces > 0;
const refundAmount = isByPiece
  ? saleItem.pricePerGramUsed * input.pieces
  : saleItem.pricePerGramUsed * input.grams;
// Use appropriate unit in credit note description
```

### 3.9 FIFO

**File: `src/lib/fifo.ts`**

Already handles piece-based deduction (lines 82-87). **No changes needed.**

### 3.10 Product Serializers

**File: `src/lib/api/product-serializer.ts`**

Add `sellingMode`, `pricePerPiece`, `retailPricePerPiece` to serialized output:

```ts
// In serializeVariantForRole:
case "OWNER":
  return {
    ...base,
    sellingMode: variant.sellingMode,          // NEW
    pricePerPiece: variant.pricePerPiece,      // NEW
    retailPricePerPiece: variant.retailPricePerPiece, // NEW
    costPricePerGram: variant.costPricePerGram,
    wholesalePricePerGram: variant.wholesalePricePerGram,
    retailPricePerGram: variant.retailPricePerGram,
    retailManualOverride: variant.retailManualOverride,
  };

// Similar for EMPLOYEE, SALON, HAIRDRESSER
```

**File: `src/lib/api/sale-serializer.ts`**

No changes needed -- `pricePerGramUsed` and `lineTotal` already capture the correct values.

---

## PHASE 4: Stock-In Form (Frontend)

### 4.1 StockInForm Component

**File: `src/components/inventory/StockInForm.tsx`**

Add after the length selection step (before "Details"):

1. **New step: Selling Mode toggle** -- appears after length is selected
   - Two buttons: "Na gramy" (BY_GRAM) / "Na kusy (culiky)" (BY_PIECE)
   - Default: BY_GRAM

2. **When BY_PIECE is selected, show additional fields:**
   - `totalPieces` (number, required) -- "Pocet kusu"
   - `pieceWeightGrams` (number, required) -- "Vaha jednoho kusu (g)"
   - `pricePerPiece` (number CZK, required) -- "Velkoobchodni cena za kus (Kc)"
   - `retailPricePerPiece` (number CZK, optional) -- "Maloobchodni cena za kus (Kc)"
   - Auto-calculate `totalGrams = totalPieces * pieceWeightGrams` and display it
   - Hide the standard `totalGrams` input (auto-calculated)

3. **When BY_GRAM (default):** show existing fields unchanged

4. **Submit body changes:**
   ```ts
   const body = {
     // existing fields...
     sellingMode: sellingMode, // "BY_GRAM" or "BY_PIECE"
     totalGrams: sellingMode === "BY_PIECE" 
       ? totalPieces * pieceWeightGrams 
       : parseInt(totalGrams),
     totalPieces: sellingMode === "BY_PIECE" ? totalPieces : 0,
     pieceWeightGrams: sellingMode === "BY_PIECE" ? pieceWeightGrams : undefined,
     pricePerPiece: sellingMode === "BY_PIECE" ? Math.round(parseFloat(pricePerPieceCzk) * 100) : undefined,
     retailPricePerPiece: sellingMode === "BY_PIECE" && retailPricePerPieceCzk 
       ? Math.round(parseFloat(retailPricePerPieceCzk) * 100) : undefined,
   };
   ```

### 4.2 i18n Keys

**File: `messages/cs.json` (stock section)**

Add:
```json
"sellingMode": "Typ prodeje",
"byGram": "Na gramy",
"byPiece": "Na kusy (culiky)",
"totalPieces": "Pocet kusu",
"pieceWeight": "Vaha kusu (g)",
"pricePerPieceCzk": "VO cena za kus (Kc)",
"retailPricePerPieceCzk": "MO cena za kus (Kc)",
"autoGrams": "Celkem gramu (auto)",
"perPiece": "ks"
```

Similar for `uk.json` and `ru.json`.

---

## PHASE 5: Frontend Display

### 5.1 Public Products API

**File: `src/app/api/public/products/route.ts`**

Add `sellingMode`, `pricePerPiece`, `retailPricePerPiece` to variant select + response:

```ts
variants: {
  select: {
    // existing...
    sellingMode: true,           // NEW
    pricePerPiece: true,         // NEW
    retailPricePerPiece: true,   // NEW
  },
}

// In response mapping:
return {
  // existing...
  sellingMode: v.sellingMode,
  pricePerPiece: v.retailPricePerPiece ?? v.pricePerPiece,
  availableGrams: stock?.availableGrams ?? 0,
  availablePieces: stock?.availablePieces ?? 0,  // NEW
};
```

### 5.2 Salon Catalog API

**File: `src/app/api/salon-portal/catalog/route.ts`**

Add `sellingMode`, per-piece pricing to variant response:

```ts
// In variant mapping:
if (v.sellingMode === "BY_PIECE") {
  const piecePrice = isHairdresser
    ? roundHalereUp((v.retailPricePerPiece ?? v.pricePerPiece ?? 0) * (10000 - hairdresserDiscountPct) / 10000)
    : loyaltyDiscount > 0
      ? roundHalereUp((v.pricePerPiece ?? 0) * (10000 - loyaltyDiscount) / 10000)
      : (v.pricePerPiece ?? 0);
  return {
    id: v.id, lengthCm: v.lengthCm, color: v.color,
    sellingMode: "BY_PIECE",
    pricePerPiece: piecePrice,
    pricePerGram: price,   // keep for reference
    availableGrams: stock?.availableGrams ?? 0,
    availablePieces: stock?.availablePieces ?? 0,
  };
}
```

### 5.3 ProductGridCard

**File: `src/components/public/ProductGridCard.tsx`**

Update price display:
- Interface: add `sellingMode?`, `pricePerPiece?`, `availablePieces?` to `ProductGridCardVariant`
- Check if ALL variants are BY_PIECE: show "Kc/ks" instead of "Kc/g"
- Stock display: show pieces instead of grams for BY_PIECE products

```tsx
// Price section:
const isByPiece = p.variants.every(v => v.sellingMode === "BY_PIECE");
if (isByPiece) {
  const minPiecePrice = Math.min(...p.variants.filter(v => v.pricePerPiece).map(v => v.pricePerPiece!));
  return <div>{(minPiecePrice / 100).toFixed(0)} Kc<span>/ks</span></div>;
}

// Stock section:
const totalStock = isByPiece
  ? p.variants.reduce((sum, v) => sum + (v.availablePieces ?? 0), 0)
  : p.variants.reduce((sum, v) => sum + v.availableGrams, 0);
const stockLabel = isByPiece ? `${totalStock} ks` : `${totalStock} g`;
```

### 5.4 Product Detail Page (Offer)

**File: `src/app/(public)/offer/[slug]/page.tsx`**

1. Add `sellingMode` to `productSelect.variants.select`
2. Price display: show "Kc/ks" for BY_PIECE, "Kc/g" for BY_GRAM
3. Stock display: show "X ks" for BY_PIECE, "X g" for BY_GRAM
4. Tip price: for BY_PIECE show "cena za 1 ks" instead of "cena za 100 g"

### 5.5 AddToInquiryForm

**File: `src/app/(public)/offer/[slug]/AddToInquiryForm.tsx`**

1. Add `sellingMode?`, `pricePerPiece?`, `availablePieces?` to `PickerVariant` interface
2. For BY_PIECE variants:
   - Show "Kc/ks" instead of "Kc/g"
   - Stock: show "X ks" instead of "Xg"
   - Quantity selector: increment by 1 (not 50g), label "ks" not "g"
   - Max: `availablePieces` not `availableGrams`
   - Add to cart with `unit: "ks"`

### 5.6 Inquiry Cart

**File: `src/lib/inquiry-cart.tsx`**

Already supports `unit: "g" | "ks"` -- no changes needed.

**File: `src/app/(public)/inquiry-cart/InquiryCartClient.tsx`**

Update `CartItemRow`:
- Show `{item.quantity} ks` or `{item.quantity} g` based on `item.unit`
- Increment/decrement: use 1 for "ks", 50 for "g"

```tsx
const step = item.unit === "ks" ? 1 : 50;
// In minus button: Math.max(1, item.quantity - step)
// In display: <span>{item.quantity}{item.unit}</span>
// In plus button: item.quantity + step
```

### 5.7 Salon Catalog Client

**File: `src/app/(salon)/salon/catalog/CatalogClient.tsx`**

1. Add `sellingMode?`, `pricePerPiece?` to variant interface
2. Table header: conditionally show "Kc/ks" or "Kc/g"
3. Price cell: show per-piece or per-gram price based on sellingMode
4. Stock cell: show pieces for BY_PIECE, grams for BY_GRAM
5. Order input: for BY_PIECE, input is pieces (no "g" placeholder, use "ks")
6. Cart total: `pricePerPiece * pieces` for BY_PIECE items

### 5.8 Sale Components

**File: `src/components/sales/SaleItemRow.tsx`**

1. Add `sellingMode?` to `SaleItemData` interface
2. For BY_PIECE:
   - Hide grams input, show only pieces input (required, min 1)
   - Show "Kc/ks" instead of "Kc/g"
   - Stock: show "X ks" available
   - Line total: pricePerPiece * pieces

**File: `src/components/sales/SaleSummary.tsx`**

1. Add `sellingMode?` to `SummaryItem` interface
2. Display: show "X ks @ Y Kc/ks" for BY_PIECE, keep "X g @ Y Kc/g" for BY_GRAM

**File: `src/app/(app)/sales/new/NewSaleWizard.tsx`**

1. Add `sellingMode` to `SaleItem` interface
2. `addItemFromVariantId`: detect sellingMode from preview response, set defaults (pieces=1, grams=0 for BY_PIECE)
3. `updateItem`: for BY_PIECE, recalculate as `pricePerPiece * pieces`
4. `canProceed` step 1: for BY_PIECE items require `pieces > 0` (not `grams > 0`)
5. Submit body: grams can be 0 for BY_PIECE items

### 5.9 Sale Detail / Invoice Detail

**File: `src/app/(app)/sales/[id]/SaleDetailClient.tsx`**

Show "ks" for piece items, "g" for gram items (use `item.pieces > 0` check).

**File: `src/app/(app)/invoices/[id]/InvoiceDetailClient.tsx`**

No changes needed -- invoice items already have `unit` field.

---

## PHASE 6: Variant Management UI

### 6.1 Variant Table

**File: `src/components/products/VariantTable.tsx`**

- Show `sellingMode` column (badge: "g" or "ks")
- Show `pricePerPiece` / `retailPricePerPiece` columns when BY_PIECE
- Editing: allow changing these fields

### 6.2 Variant API

**File: `src/app/api/products/[id]/variants/route.ts`**

Accept `sellingMode`, `pricePerPiece`, `retailPricePerPiece` in variant creation.

**File: `src/app/api/variants/[id]/route.ts`**

Accept these fields in variant update (PATCH).

---

## Implementation Order (for Implementor)

Execute in this exact order to avoid broken dependencies:

### Step 1: DB + Schema (must be first)
1. Run Turso migration SQL (3 ALTER TABLE statements)
2. Update `prisma/schema.prisma` (add enum + 3 fields to Variant)
3. Run `npx prisma generate`

### Step 2: Validation Schemas
4. Update `src/lib/validations/product.ts`
5. Update `src/lib/validations/delivery.ts`
6. Update `src/lib/validations/sale.ts`

### Step 3: Backend Business Logic
7. Update `src/lib/sale-pricing.ts` (getSalePrice + calculateLineTotal)
8. Update `src/lib/sales.ts` (completeSale)
9. Update `src/lib/returns.ts` (approveReturn)
10. Update `src/lib/complaints.ts` (createComplaint)
11. Update `src/app/api/deliveries/route.ts` (POST - new wizard flow)
12. Update `src/app/api/sales/price-preview/route.ts`
13. Update `src/lib/order-workflow.ts` (createOrder)
14. Update `src/lib/api/product-serializer.ts`

### Step 4: APIs
15. Update `src/app/api/public/products/route.ts`
16. Update `src/app/api/salon-portal/catalog/route.ts`
17. Update `src/app/api/products/[id]/variants/route.ts`
18. Update `src/app/api/variants/[id]/route.ts`

### Step 5: Frontend - Stock-In
19. Update `src/components/inventory/StockInForm.tsx`
20. Add i18n keys to `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

### Step 6: Frontend - Display
21. Update `src/components/public/ProductGridCard.tsx`
22. Update `src/app/(public)/offer/[slug]/page.tsx`
23. Update `src/app/(public)/offer/[slug]/AddToInquiryForm.tsx`
24. Update `src/app/(public)/inquiry-cart/InquiryCartClient.tsx`
25. Update `src/app/(salon)/salon/catalog/CatalogClient.tsx`

### Step 7: Frontend - Sales
26. Update `src/components/sales/SaleItemRow.tsx`
27. Update `src/components/sales/SaleSummary.tsx`
28. Update `src/app/(app)/sales/new/NewSaleWizard.tsx`
29. Update `src/app/(app)/sales/[id]/SaleDetailClient.tsx`

### Step 8: Frontend - Admin Variant Management
30. Update `src/components/products/VariantTable.tsx`

---

## Files Changed Summary

| # | File | Change Type |
|---|------|-------------|
| 1 | `prisma/schema.prisma` | Add SellingMode enum + 3 Variant fields |
| 2 | `src/lib/validations/product.ts` | Add sellingMode + pricePerPiece to schemas |
| 3 | `src/lib/validations/delivery.ts` | Add sellingMode + prices to newStockInSchema |
| 4 | `src/lib/validations/sale.ts` | Allow grams=0 for BY_PIECE |
| 5 | `src/lib/sale-pricing.ts` | Return sellingMode + pricePerPiece |
| 6 | `src/lib/sales.ts` | BY_PIECE lineTotal = pricePerPiece * pieces |
| 7 | `src/lib/returns.ts` | BY_PIECE return value calculation |
| 8 | `src/lib/complaints.ts` | BY_PIECE refund calculation |
| 9 | `src/lib/order-workflow.ts` | BY_PIECE order pricing |
| 10 | `src/lib/api/product-serializer.ts` | Include sellingMode in serialized output |
| 11 | `src/app/api/deliveries/route.ts` | Accept sellingMode in stock-in |
| 12 | `src/app/api/sales/price-preview/route.ts` | Return sellingMode-aware preview |
| 13 | `src/app/api/public/products/route.ts` | Include sellingMode + pieces in public API |
| 14 | `src/app/api/salon-portal/catalog/route.ts` | Include sellingMode + piece pricing |
| 15 | `src/app/api/products/[id]/variants/route.ts` | Accept sellingMode in variant creation |
| 16 | `src/app/api/variants/[id]/route.ts` | Accept sellingMode in variant update |
| 17 | `src/components/inventory/StockInForm.tsx` | Selling mode toggle + piece fields |
| 18 | `src/components/public/ProductGridCard.tsx` | Kc/ks display for BY_PIECE |
| 19 | `src/app/(public)/offer/[slug]/page.tsx` | BY_PIECE price/stock display |
| 20 | `src/app/(public)/offer/[slug]/AddToInquiryForm.tsx` | Piece quantity selector |
| 21 | `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` | Show ks/g based on unit |
| 22 | `src/app/(salon)/salon/catalog/CatalogClient.tsx` | BY_PIECE catalog support |
| 23 | `src/components/sales/SaleItemRow.tsx` | BY_PIECE item display |
| 24 | `src/components/sales/SaleSummary.tsx` | BY_PIECE summary display |
| 25 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | BY_PIECE sale flow |
| 26 | `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | ks display for piece items |
| 27 | `src/components/products/VariantTable.tsx` | sellingMode column + editing |
| 28 | `messages/cs.json` | i18n keys for selling mode |
| 29 | `messages/uk.json` | i18n keys for selling mode |
| 30 | `messages/ru.json` | i18n keys for selling mode |

---

## Key Design Decisions

1. **sellingMode on Variant (not Product)**: A product could theoretically have both gram and piece variants (e.g., same hair, different packaging). Variant-level is more flexible.

2. **Repurpose pricePerGramUsed in SaleItem**: For BY_PIECE items, this field stores the per-piece price. Avoids adding a new column to sale_items. The field name is misleading for BY_PIECE but the data is correct for all calculations.

3. **No changes to fifo.ts**: Already handles piece-based deduction. The branching at line 82 already checks `requestedPieces > 0`.

4. **No changes to stock.ts**: Stock calculations are agnostic -- grams and pieces are tracked independently.

5. **No changes to invoicing.ts**: The `isPiece = item.pieces > 0` check at line 89 already handles unit selection. pricePerUnit uses pricePerGramUsed which stores the correct value.

6. **Backward compatibility**: All new fields have defaults (sellingMode defaults to BY_GRAM, price fields are nullable). Existing data and flows continue to work unchanged.

7. **Two piece prices (wholesale + retail)**: Mirrors the existing `wholesalePricePerGram` / `retailPricePerGram` pattern for consistency.
