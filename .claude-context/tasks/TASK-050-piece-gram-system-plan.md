# TASK-050 Extended: Comprehensive BY_PIECE System

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-15
**Depends on:** Original TASK-050 (sellByGrams toggle) — already implemented

---

## Overview

Three extensions to the BY_PIECE selling system:

1. **EXKLUZIV flag on Delivery** — exclusive pieces sell ONLY as whole, no gram splitting
2. **Customer demand (poptavka) for specific gram weight** — public inquiry supports custom gram amounts from BY_PIECE stock
3. **Stock tracking** — differentiate exclusive vs. standard pieces in inventory views

---

## 1. EXKLUZIV Flag

### Concept

Some ponytails are premium "exclusive" pieces — unique, high-value items that must be sold whole. The seller marks a delivery as exclusive during stock-in. Exclusive pieces **cannot** use the "Prodat po gramech" toggle in the sale wizard.

This is a **per-delivery** flag, not per-variant — the same variant can have both exclusive and standard pieces stocked at different times.

### 1A. Schema change — add `exclusive` to Delivery

```prisma
model Delivery {
  // ... existing fields ...
  exclusive           Boolean   @default(false)    // NEW: exclusive piece, sell whole only
}
```

**Migration:** `ALTER TABLE deliveries ADD COLUMN exclusive INTEGER NOT NULL DEFAULT 0;`

No index needed — filtering by exclusive is rare and always combined with variantId which is already indexed.

### 1B. Stock-in form — add EXKLUZIV toggle

**File:** `src/components/inventory/StockInForm.tsx`

**Where:** Inside the BY_PIECE section (line 920-945), after the pieces/weight inputs, add an exclusive toggle:

```tsx
{sellingMode === "BY_PIECE" && (
  <div className="space-y-4 p-4 rounded-xl border-2 border-rose/20 bg-rose/5">
    {/* existing pieces + weight inputs */}
    <div className="grid grid-cols-2 gap-4">
      <Input label={t("totalPieces")} ... />
      <Input label={t("pieceWeight")} ... />
    </div>
    {totalPieces && pieceWeightGrams && (
      <p className="text-xs text-muted">...</p>
    )}

    {/* NEW: Exclusive toggle */}
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={exclusive}
        onChange={(e) => setExclusive(e.target.checked)}
        className="w-4 h-4 rounded border-line text-rose focus:ring-rose"
      />
      <span className="text-sm font-medium text-espresso">{t("exclusivePiece")}</span>
    </label>
    {exclusive && (
      <p className="text-xs text-muted">{t("exclusiveHint")}</p>
    )}
  </div>
)}
```

**State:** Add `const [exclusive, setExclusive] = useState(false);` (line ~57, near other state).

**Reset:** Add `setExclusive(false);` in `resetFrom` and success reset.

**Submit body (line 261-284):** Add `exclusive` to the BY_PIECE section:

```typescript
...(isByPiece ? {
  pieceWeightGrams: parsedPieceWeight,
  purchasePricePerPiece: purchasePricePerPieceRaw,
  pricePerPiece: costPerPieceCzk,
  ...(retailPerPieceCzk ? { retailPricePerPiece: retailPerPieceCzk } : {}),
  exclusive,    // NEW
} : {}),
```

### 1C. Deliveries API — pass `exclusive` through

**File:** `src/app/api/deliveries/route.ts`

**POST handler (line 176-191):** Pass `exclusive` to `stockIn`:

```typescript
const delivery = await stockIn(
  {
    // ... existing fields ...
    exclusive: isByPiece ? data.exclusive : false,    // NEW
  },
  session.user.id
);
```

### 1D. Validation schema — add `exclusive`

**File:** `src/lib/validations/delivery.ts`

Add to `newStockInSchema`:

```typescript
exclusive: z.boolean().optional().default(false),
```

### 1E. Stock-in function — persist `exclusive`

**File:** `src/lib/stock-in.ts`

The `stockIn` function creates the Delivery record. Add `exclusive` to the `data` object:

```typescript
// In the Delivery creation:
exclusive: data.exclusive ?? false,
```

Also add to the `StockInInput` interface:

```typescript
interface StockInInput {
  // ... existing fields ...
  exclusive?: boolean;
}
```

### 1F. FIFO — exclusive deliveries skip gram-deduction

**File:** `src/lib/fifo.ts`

When `requestedPieces === 0` (gram sale), exclusive deliveries should be **skipped** in the FIFO loop. This prevents partial gram deduction from exclusive pieces.

**Change in the FIFO loop (line 76-101):**

```typescript
for (const delivery of deliveries) {
  if (gramsRemaining <= 0 && piecesRemaining <= 0) break;

  let gramsFromThis = 0;
  let piecesFromThis = 0;

  if (requestedPieces > 0) {
    // Piece-based sale: deduct pieces (works for both exclusive and standard)
    piecesFromThis = Math.min(piecesRemaining, delivery.remainingPieces);
    gramsFromThis = piecesFromThis * (delivery.pieceWeightGrams ?? 0);
    piecesRemaining -= piecesFromThis;
    gramsRemaining -= gramsFromThis;
  } else {
    // Gram-based sale: skip exclusive deliveries
    if (delivery.exclusive) continue;    // NEW: exclusive pieces cannot be split

    gramsFromThis = Math.min(gramsRemaining, delivery.remainingGrams);
    gramsRemaining -= gramsFromThis;

    // BY_PIECE: when all grams consumed, mark piece as consumed
    if (delivery.remainingPieces > 0 && delivery.pieceWeightGrams) {
      const gramsAfterDeduction = delivery.remainingGrams - gramsFromThis;
      if (gramsAfterDeduction <= 0) {
        piecesFromThis = delivery.remainingPieces;
      }
    }
  }
  // ... rest unchanged
}
```

**Stock availability check:** The `totalAvailableGrams` check (line 57) currently sums ALL deliveries. For gram-based requests from BY_PIECE variants, exclusive grams should be excluded. However, this gets complex because `fifoDeduct` doesn't know if the variant is BY_PIECE.

**Simpler approach:** Don't filter the availability check — just skip exclusive in the loop. If all available grams are exclusive, the loop will exhaust without deducting enough, and the remaining check at the end would need to be moved. Actually, the current code doesn't have a post-loop check — it just returns what it deducted.

**Wait — there IS a pre-loop check at line 57-63 that throws `InsufficientStockError`.** If exclusive grams make up part of `totalAvailableGrams`, the check passes but the loop can't fulfill the request. We need to adjust:

```typescript
// For gram-based deduction, exclude exclusive delivery grams from availability
const totalAvailableGrams = deliveries.reduce(
  (sum, d) => sum + (requestedPieces === 0 && d.exclusive ? 0 : d.remainingGrams),
  0
);
```

This ensures the availability check correctly excludes exclusive stock for gram sales.

### 1G. Sales UI — hide "Prodat po gramech" toggle for exclusive-only stock

**Challenge:** The sale item doesn't currently know about individual delivery exclusivity. The price-preview endpoint returns aggregate stock numbers.

**Approach:** Add `hasNonExclusiveGrams` to the price-preview response for BY_PIECE variants. If all remaining stock is exclusive, the toggle should be hidden.

**File:** `src/app/api/sales/price-preview/route.ts`

Add after getting stock numbers:

```typescript
// Check if any non-exclusive gram stock exists for BY_PIECE
let hasNonExclusiveGrams = true;
if (pricing.sellingMode === "BY_PIECE") {
  const nonExclusiveGrams = await prisma.delivery.aggregate({
    where: {
      variantId,
      exclusive: false,
      remainingGrams: { gt: 0 },
    },
    _sum: { remainingGrams: true },
  });
  hasNonExclusiveGrams = (nonExclusiveGrams._sum.remainingGrams ?? 0) > 0;
}
```

Return it in the BY_PIECE response:

```typescript
return NextResponse.json({
  sellingMode: "BY_PIECE",
  pricePerPiece: pricing.pricePerPiece,
  pricePerGram: pricing.pricePerGram,
  lineTotal,
  availableStock,
  hasNonExclusiveGrams,    // NEW
});
```

**File:** `src/components/sales/SaleItemRow.tsx`

Add to `SaleItemData` interface:

```typescript
hasNonExclusiveGrams?: boolean;    // NEW: false hides gram toggle
```

Only show toggle when `hasNonExclusiveGrams !== false`:

```tsx
{onToggleSellByGrams && item.hasNonExclusiveGrams !== false && (
  <button type="button" onClick={onToggleSellByGrams} className="text-xs text-rose underline">
    {item.sellByGrams ? t("sellByPieces") : t("sellByGrams")}
  </button>
)}
```

**File:** `src/app/(app)/sales/new/NewSaleWizard.tsx`

Add `hasNonExclusiveGrams` to `SaleItem` interface and populate from preview:

```typescript
hasNonExclusiveGrams: piecePreview?.hasNonExclusiveGrams ?? preview?.hasNonExclusiveGrams ?? true,
```

### 1H. Delivery detail — show EXKLUZIV badge

**File:** `src/app/(app)/inventory/deliveries/[id]/DeliveryDetailClient.tsx`

Add to `DeliveryData` interface:

```typescript
exclusive?: boolean;
```

Display badge next to the variant label:

```tsx
{delivery.exclusive && (
  <span className="ml-2 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
    EXKLUZIV
  </span>
)}
```

### 1I. Delivery serializer — include `exclusive`

**File:** `src/lib/api/delivery-serializer.ts`

Add `exclusive` to the serialized output.

---

## 2. Customer Demand (Poptavka) for Specific Gram Weight

### Concept

Public visitors can already submit inquiries (poptavky) for products via `AddToInquiryForm`. Currently, BY_PIECE variants show quantity in "ks" (pieces). The extension allows customers to specify a custom gram amount from BY_PIECE stock — e.g., "I want 100g of this ponytail hair."

### 2A. AddToInquiryForm — gram option for BY_PIECE

**File:** `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx`

Currently (lines 76-86): BY_PIECE uses `unitLabel = "ks"`, `qtyStep = 1`, `minQty = 1`.

**Add a unit toggle for BY_PIECE variants:**

```tsx
// State
const [byPieceUnit, setByPieceUnit] = useState<"ks" | "g">("ks");

// Computed values
const effectiveIsByPiece = isByPiece && byPieceUnit === "ks";
const unitLabel = effectiveIsByPiece ? "ks" : "g";
const qtyStep = effectiveIsByPiece ? 1 : 50;
const minQty = effectiveIsByPiece ? 1 : 50;
const maxQty = isCustomOrder
  ? Infinity
  : effectiveIsByPiece
    ? (selectedVariant?.availablePieces ?? Infinity)
    : (selectedVariant?.availableGrams ?? Infinity);
```

**Toggle UI (only visible when isByPiece):**

```tsx
{isByPiece && (
  <div className="flex gap-2 mb-2">
    <button
      onClick={() => { setByPieceUnit("ks"); setQuantity(1); }}
      className={`px-3 py-1 rounded-lg text-xs font-medium border ${
        byPieceUnit === "ks" ? "border-rose bg-rose/10 text-ink" : "border-line text-muted"
      }`}
    >
      {t("inquiry.byPiece")}
    </button>
    <button
      onClick={() => { setByPieceUnit("g"); setQuantity(100); }}
      className={`px-3 py-1 rounded-lg text-xs font-medium border ${
        byPieceUnit === "g" ? "border-rose bg-rose/10 text-ink" : "border-line text-muted"
      }`}
    >
      {t("inquiry.byGram")}
    </button>
  </div>
)}
```

**handleAdd (line 97-109):** Use the effective unit:

```typescript
addItem({
  productId,
  productName,
  lengthCm: selectedLength,
  color: selectedColor,
  quantity,
  unit: unitLabel,    // "ks" or "g"
});
```

The `InquiryItem` model already has a `unit` field (defaults to "g") so no schema change is needed.

### 2B. Inquiry display — show gram vs. piece unit correctly

**File:** `src/app/(app)/inquiries/InquiriesClient.tsx`

Check how inquiry items are currently displayed and ensure the `unit` field is shown correctly. The `InquiryItem` model stores `unit` as a string — no changes needed to the model.

---

## 3. Stock Tracking — Exclusive vs. Standard Pieces

### Concept

The inventory view should clearly show which stock is exclusive and which is standard, so the seller knows what can be split and what must be sold whole.

### 3A. Stock numbers — add exclusive breakdown

**File:** `src/lib/stock.ts`

Add exclusive breakdown to `StockNumbers`:

```typescript
export interface StockNumbers {
  physicalGrams: number;
  physicalPieces: number;
  reservedGrams: number;
  reservedPieces: number;
  availableGrams: number;
  availablePieces: number;
  exclusiveGrams: number;      // NEW
  exclusivePieces: number;     // NEW
}
```

**`getStockNumbers` function:** Add exclusive aggregate:

```typescript
const exclusive = await db.delivery.aggregate({
  where: { variantId, exclusive: true },
  _sum: {
    remainingGrams: true,
    remainingPieces: true,
  },
});

return {
  // ... existing ...
  exclusiveGrams: exclusive._sum.remainingGrams ?? 0,
  exclusivePieces: exclusive._sum.remainingPieces ?? 0,
};
```

**`getAllStockNumbers` function:** Add exclusive to the raw SQL:

```sql
SELECT variantId,
  COALESCE(SUM(remainingGrams), 0) as physicalGrams,
  COALESCE(SUM(remainingPieces), 0) as physicalPieces,
  COALESCE(SUM(CASE WHEN exclusive = 1 THEN remainingGrams ELSE 0 END), 0) as exclusiveGrams,
  COALESCE(SUM(CASE WHEN exclusive = 1 THEN remainingPieces ELSE 0 END), 0) as exclusivePieces
FROM deliveries
GROUP BY variantId
```

Update `RawStockRow` interface:

```typescript
interface RawStockRow {
  variantId: string;
  physicalGrams: bigint;
  physicalPieces: bigint;
  exclusiveGrams: bigint;     // NEW
  exclusivePieces: bigint;    // NEW
}
```

### 3B. Inventory page — show exclusive breakdown

**File:** `src/app/(app)/inventory/InventoryClient.tsx`

Add to `StockItem` interface:

```typescript
exclusiveGrams: number;
exclusivePieces: number;
```

In the stock display (wherever pieces are shown), add an exclusive sub-label when applicable:

```tsx
{item.availablePieces > 0 && item.exclusivePieces > 0 && (
  <span className="text-[10px] text-amber-600 ml-1">
    ({item.exclusivePieces} EXKLUZIV)
  </span>
)}
```

### 3C. Inventory API — pass exclusive counts through

**File:** `src/app/(app)/inventory/page.tsx`

The server component that prepares `StockItem[]` for `InventoryClient` needs to include `exclusiveGrams` and `exclusivePieces` from `getAllStockNumbers()`.

### 3D. Delivery list — EXKLUZIV badge

In the deliveries list (wherever individual deliveries are shown), add a visual badge:

```tsx
{delivery.exclusive && (
  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
    EXKLUZIV
  </span>
)}
```

---

## i18n translations

Add to `cs.json`, `uk.json`, `ru.json`:

### Czech (`cs.json`)

Under `"stock"` namespace:
```json
{
  "exclusivePiece": "Exkluzivní kus",
  "exclusiveHint": "Exkluzivní kusy se prodávají pouze celé — nelze dělit po gramech",
  "exclusiveBadge": "EXKLUZIV"
}
```

Under `"public.inquiry"` namespace:
```json
{
  "byPiece": "Po kusech",
  "byGram": "Po gramech"
}
```

### Ukrainian (`uk.json`)

Under `"stock"` namespace:
```json
{
  "exclusivePiece": "Ексклюзивний шматок",
  "exclusiveHint": "Ексклюзивні шматки продаються тільки цілком — не можна ділити по грамах",
  "exclusiveBadge": "ЕКСКЛЮЗИВ"
}
```

Under `"public.inquiry"` namespace:
```json
{
  "byPiece": "По штуках",
  "byGram": "По грамах"
}
```

### Russian (`ru.json`)

Under `"stock"` namespace:
```json
{
  "exclusivePiece": "Эксклюзивный кусок",
  "exclusiveHint": "Эксклюзивные куски продаются только целиком — нельзя делить по граммам",
  "exclusiveBadge": "ЭКСКЛЮЗИВ"
}
```

Under `"public.inquiry"` namespace:
```json
{
  "byPiece": "По штукам",
  "byGram": "По граммам"
}
```

---

## Files to edit — summary

| # | File | Change | Complexity |
|---|------|--------|------------|
| 1 | `prisma/schema.prisma` | Add `exclusive Boolean @default(false)` to Delivery | LOW |
| 2 | `src/lib/validations/delivery.ts` | Add `exclusive` to `newStockInSchema` | LOW |
| 3 | `src/lib/stock-in.ts` | Add `exclusive` to input interface and Delivery creation | LOW |
| 4 | `src/components/inventory/StockInForm.tsx` | Add exclusive checkbox in BY_PIECE section | LOW |
| 5 | `src/app/api/deliveries/route.ts` | Pass `exclusive` to `stockIn` | LOW |
| 6 | `src/lib/fifo.ts` | Skip exclusive deliveries for gram deduction, exclude from availability check | MEDIUM |
| 7 | `src/app/api/sales/price-preview/route.ts` | Add `hasNonExclusiveGrams` to BY_PIECE response | LOW |
| 8 | `src/components/sales/SaleItemRow.tsx` | Conditionally hide gram toggle when no non-exclusive stock | LOW |
| 9 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Pass `hasNonExclusiveGrams` through | LOW |
| 10 | `src/lib/stock.ts` | Add `exclusiveGrams`/`exclusivePieces` to `StockNumbers` | MEDIUM |
| 11 | `src/app/(app)/inventory/InventoryClient.tsx` | Show exclusive breakdown | LOW |
| 12 | `src/app/(app)/inventory/page.tsx` | Include exclusive counts in data | LOW |
| 13 | `src/app/(app)/inventory/deliveries/[id]/DeliveryDetailClient.tsx` | Show EXKLUZIV badge | LOW |
| 14 | `src/lib/api/delivery-serializer.ts` | Include `exclusive` in output | LOW |
| 15 | `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx` | Add ks/g toggle for BY_PIECE | MEDIUM |
| 16 | i18n `cs.json` / `uk.json` / `ru.json` | Add exclusive + inquiry unit keys | LOW |

**Total: 16 files, 1 schema change (1 column), 1 migration.**

---

## What does NOT need changes

| Component | Why |
|-----------|-----|
| `sales.ts` / `completeSale` | Already handles `pieces=0, grams=X` correctly |
| `SaleDetailClient.tsx` | Displays based on stored `grams`/`pieces` values — works for all cases |
| `fifoReturn` | Returns to original delivery — exclusivity doesn't affect returns |
| `credit-note.ts` | Works at line-item level, agnostic to exclusive flag |
| `order-workflow.ts` | Orders don't interact with exclusive flag |
| `InquiryItem` model | Already has `unit` field that supports "g" and "ks" |

---

## Edge cases

| Case | Handling |
|------|----------|
| All stock is exclusive, user tries "Prodat po gramech" | Toggle hidden (`hasNonExclusiveGrams = false`), only whole-piece sale possible |
| Mix of exclusive + standard stock, gram sale | FIFO skips exclusive deliveries, deducts from standard only |
| Exclusive delivery with 0 remaining grams | Not in FIFO loop (WHERE `remainingGrams > 0 OR remainingPieces > 0`) |
| Stock-in BY_GRAM with exclusive flag | Ignored — exclusive only applies to BY_PIECE. Form only shows toggle for BY_PIECE. |
| Return of gram sale to non-exclusive delivery | Works — `fifoReturn` increments exact delivery, no exclusive check needed |
| Inquiry with "g" unit for BY_PIECE | Stored in InquiryItem with `unit="g"` — admin sees gram demand |
| Exclusive piece added via legacy API (without exclusive flag) | Default `false` — backward compatible, piece is treated as standard |

---

## Implementation order

1. **Schema + migration** (prisma/schema.prisma, stock-in.ts, delivery validation)
2. **Stock-in UI** (StockInForm.tsx, deliveries/route.ts)
3. **FIFO logic** (fifo.ts — exclusive skip)
4. **Price preview + sale UI** (price-preview route, SaleItemRow, NewSaleWizard)
5. **Stock tracking** (stock.ts, InventoryClient, page.tsx, delivery detail)
6. **Inquiry form** (AddToInquiryForm.tsx)
7. **i18n** (cs/uk/ru.json)
