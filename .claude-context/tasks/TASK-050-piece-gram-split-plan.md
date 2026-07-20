# TASK-050: BY_PIECE partial gram sales (split ponytail by weight)

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-15

---

## Context

BY_PIECE products (ponytails/culiky) are stocked as whole pieces with a known weight (e.g. 1 piece at 150g). Currently, selling BY_PIECE always deducts whole pieces. The user needs to support selling PARTIAL grams from a BY_PIECE piece — e.g. sell 100g to customer A, then 50g to customer B from the same 150g piece.

**Key insight:** The Delivery model already tracks both `remainingGrams` AND `remainingPieces` independently. For BY_PIECE stock-in, `remainingGrams = totalPieces * pieceWeightGrams`. The system just needs to allow gram-level deduction from BY_PIECE deliveries without requiring whole-piece deduction.

---

## Current state analysis

### Stock-in (works correctly, no changes needed)
- `stock-in.ts` line 51: `remainingGrams: data.totalGrams` (for BY_PIECE: `totalPieces * pieceWeightGrams`)
- `stock-in.ts` line 52: `remainingPieces: data.totalPieces`
- Example: Stock 1 piece at 150g → `remainingGrams=150, remainingPieces=1, pieceWeightGrams=150`

### FIFO deduction (needs changes)
- `fifo.ts` lines 82-92: When `requestedPieces > 0`, deducts WHOLE pieces and auto-calculates grams
- `fifo.ts` line 88-91: When `requestedPieces == 0` (gram mode), already deducts only grams — BUT this path is never reached for BY_PIECE items because the UI always sends `pieces > 0`
- **The gram-deduction path at lines 88-91 already works** — the issue is upstream: the UI and `completeSale` always send `pieces > 0` for BY_PIECE variants

### Sales logic (`sales.ts`)
- Line 86-88: `lineTotal = isByPiece ? pricePerUnit * item.pieces : pricePerUnit * item.grams`
- When selling BY_PIECE by grams, pricing must use `pricePerGram * grams` instead of `pricePerPiece * pieces`

### UI (`NewSaleWizard.tsx`)
- Line 126-141: BY_PIECE adds item with `pieces: 1, grams: 0` — no option to enter grams
- Line 206-211: `updateItem` for BY_PIECE only recalculates from `pricePerPiece * pieces`

### UI (`SaleItemRow.tsx`)
- Lines 60-66: BY_PIECE shows ONLY pieces input — no gram input available

### Price preview (`price-preview/route.ts`)
- Line 36: BY_PIECE returns `pricePerPiece * pieces` — doesn't support gram-based pricing for BY_PIECE

---

## Design decision: "Sell by grams" toggle on BY_PIECE items

Rather than changing the selling mode at variant level, add a **per-sale-item toggle** that lets the seller choose to sell a BY_PIECE item by grams. This preserves backward compatibility — whole-piece sales still work exactly as before.

**User flow:**
1. Scan QR / pick a BY_PIECE variant → item added with pieces=1 (default, unchanged)
2. User sees a toggle/button: "Prodat po gramech" (Sell by grams)
3. Toggling it switches the row to show a gram input instead of piece input
4. Backend receives `pieces: 0, grams: 100` — FIFO uses the existing gram-deduction path
5. Pricing uses `retailPricePerGram * grams` (the variant ALREADY has `retailPricePerGram`)

---

## Files to edit

### 1. `src/components/sales/SaleItemRow.tsx` — Add gram toggle for BY_PIECE

**Current:** BY_PIECE shows only pieces input (lines 60-66).

**Change:** Add `sellByGrams` prop to `SaleItemData`. When true AND `sellingMode === "BY_PIECE"`, show gram input instead of piece input.

```typescript
interface SaleItemData {
  // ... existing fields ...
  sellByGrams?: boolean;       // NEW — partial gram sale from BY_PIECE piece
}

interface SaleItemRowProps {
  // ... existing props ...
  onToggleSellByGrams?: () => void;  // NEW
}
```

**Updated render logic:**

```tsx
{isByPiece ? (
  <div className="space-y-2">
    {/* Toggle: sell by grams */}
    <button
      type="button"
      onClick={onToggleSellByGrams}
      className="text-xs text-rose underline"
    >
      {item.sellByGrams ? t("sellByPieces") : t("sellByGrams")}
    </button>

    {item.sellByGrams ? (
      /* Gram input for partial piece sale */
      <Input
        label={t("enterGrams")}
        type="number"
        min={1}
        max={item.availableGrams}
        value={item.grams || ""}
        onChange={(e) => onGramsChange(parseInt(e.target.value) || 0)}
        error={item.grams > item.availableGrams ? t("insufficientStock") : undefined}
      />
    ) : (
      /* Piece input (existing behavior) */
      <Input
        label={t("enterPieces")}
        type="number"
        min={1}
        value={item.pieces || ""}
        onChange={(e) => onPiecesChange(parseInt(e.target.value) || 0)}
        error={insufficientStock ? t("insufficientStock") : undefined}
      />
    )}
  </div>
) : (
  /* BY_GRAM: unchanged */
  ...
)}
```

**Stock display (line 90-95):** When `sellByGrams`, show available grams instead of pieces:

```tsx
<span className="text-muted">
  {t("availableStock")}:{" "}
  {isByPiece
    ? item.sellByGrams
      ? `${item.availableGrams} ${tStock("grams")}`
      : `${item.availablePieces} ${tStock("pieces")}`
    : `${item.availableGrams} ${tStock("grams")} / ${item.availablePieces} ${tStock("pieces")}`}
</span>
```

**Price display (line 100-103):** When `sellByGrams`, show `pricePerGram` instead of `pricePerPiece`:

```tsx
<span className="text-muted">
  {isByPiece
    ? item.sellByGrams
      ? `${formatCZK(item.pricePerGram)} CZK/${tStock("grams")}`
      : `${formatCZK(item.pricePerPiece ?? 0)} CZK/${tStock("pieces")}`
    : `${t("pricePerGram")}: ${formatCZK(item.pricePerGram)} CZK`}
</span>
```

**Insufficient stock check (line 44-46):** When `sellByGrams`, check grams instead of pieces:

```tsx
const insufficientStock = isByPiece
  ? item.sellByGrams
    ? item.grams > item.availableGrams
    : item.pieces > item.availablePieces
  : item.grams > item.availableGrams;
```

### 2. `src/app/(app)/sales/new/NewSaleWizard.tsx` — Handle gram toggle + pricing

**Add `sellByGrams` to SaleItem interface:**

```typescript
interface SaleItem {
  // ... existing fields ...
  sellByGrams?: boolean;    // NEW
}
```

**New toggle handler:**

```typescript
const toggleSellByGrams = useCallback((index: number) => {
  setItems((prev) => {
    const updated = [...prev];
    const item = updated[index];
    const nowByGrams = !item.sellByGrams;

    updated[index] = {
      ...item,
      sellByGrams: nowByGrams,
      // Reset quantities when toggling
      grams: nowByGrams ? 0 : 0,
      pieces: nowByGrams ? 0 : 1,
      lineTotal: nowByGrams ? 0 : roundUp((item.pricePerPiece ?? 0) * 1),
    };
    return updated;
  });
}, []);
```

**Update `updateItem` (line 200):** When `sellByGrams`, use `pricePerGram * grams` for lineTotal:

```typescript
if (updated[index].sellingMode === "BY_PIECE") {
  if (updated[index].sellByGrams) {
    // Partial gram sale from piece
    if (updates.grams !== undefined) {
      updated[index].lineTotal = roundUp(
        updated[index].pricePerGram * updated[index].grams
      );
    }
  } else {
    // Standard whole-piece sale
    if (updates.pieces !== undefined) {
      updated[index].lineTotal = roundUp(
        (updated[index].pricePerPiece ?? 0) * updated[index].pieces
      );
    }
  }
}
```

**Update `addItemFromVariantId` (line 126-141):** Currently hardcodes `pricePerGram: 0` and `availableGrams: 0` for BY_PIECE. These need to be populated from the preview response (price-preview already returns `pricePerGram` and `availableStock.grams` for BY_PIECE variants):

```typescript
if (isByPiece) {
  const piecePreview = await fetchPricePreview(variantId, 0, 1);
  setItems((prev) => [
    ...prev,
    {
      variantId,
      variantLabel: label,
      grams: 0,
      pieces: 1,
      pricePerGram: piecePreview?.pricePerGram ?? preview?.pricePerGram ?? 0,  // WAS: 0 — NOW: from preview
      pricePerPiece: piecePreview?.pricePerPiece ?? preview?.pricePerPiece ?? 0,
      sellingMode: "BY_PIECE",
      sellByGrams: false,    // NEW — default to whole pieces
      lineTotal: piecePreview?.lineTotal ?? 0,
      availableGrams: piecePreview?.availableStock?.grams ?? preview?.availableStock?.grams ?? 0,  // WAS: 0 — NOW: from preview
      availablePieces: piecePreview?.availableStock?.pieces ?? preview?.availableStock?.pieces ?? 0,
    },
  ]);
}
```

**Pass toggle to SaleItemRow:**

```tsx
<SaleItemRow
  item={item}
  onGramsChange={(g) => updateItem(i, { grams: g })}
  onPiecesChange={(p) => updateItem(i, { pieces: p })}
  onToggleSellByGrams={() => toggleSellByGrams(i)}
  onRemove={() => removeItem(i)}
/>
```

**Update `handleSubmit`:** When `sellByGrams`, send `pieces: 0, grams: X` to the backend:

```typescript
items: items.map((item) => ({
  variantId: item.variantId,
  grams: item.sellByGrams ? item.grams : (item.sellingMode === "BY_PIECE" ? 0 : item.grams),
  pieces: item.sellByGrams ? 0 : item.pieces,
})),
```

**CRITICAL: Update `canSubmit` validation (line 316):** Currently requires `i.pieces > 0` for ALL BY_PIECE items. When `sellByGrams` is toggled, `pieces=0` and `grams>0`, so validation must account for this:

```typescript
const canSubmit =
  customerType &&
  (customerType === "SALON" ? !!salonId : true) &&
  items.length > 0 &&
  items.every((i) => {
    if (i.sellingMode === "BY_PIECE") {
      return i.sellByGrams ? i.grams > 0 : i.pieces > 0;
    }
    return i.grams > 0;
  }) &&
  !submitting;
```

**Update summary display (lines 488-505):** When `sellByGrams` is true, the summary should show grams instead of pieces:

```tsx
{item.sellingMode === "BY_PIECE"
  ? item.sellByGrams
    ? `${item.grams} ${tStock("grams")} @ ${formatCZK(item.pricePerGram)} CZK/${tStock("grams")}`
    : `${item.pieces} ${tStock("pieces")} @ ${formatCZK(item.pricePerPiece ?? 0)} CZK`
  : <>
      {item.grams} {tStock("grams")}
      {item.pieces > 0 && ` / ${item.pieces} ${tStock("pieces")}`}
      {" @ "}
      {formatCZK(item.pricePerGram)} CZK/{tStock("grams")}
    </>
}
```

### 3. `src/lib/sales.ts` — Support gram-based pricing for BY_PIECE variants

**Current (line 86-88):** Always uses `pricePerUnit * pieces` for BY_PIECE.

**Change:** When `item.pieces === 0 && item.grams > 0` on a BY_PIECE variant, use gram-based pricing:

```typescript
// Line 86-88: replace with
let lineTotal: number;
if (isByPiece && item.pieces > 0) {
  // Standard whole-piece sale
  lineTotal = roundHalereUp(pricePerUnit * item.pieces);
} else {
  // Gram-based sale (either BY_GRAM variant, or partial BY_PIECE sale)
  lineTotal = roundHalereUp(pricePerGram * item.grams);
}
```

**FIFO call (line 133-139):** No change needed — `fifoDeduct` already receives `item.grams` and `item.pieces` directly. When `pieces=0, grams=100`, it takes the gram-deduction path (lines 88-91 of fifo.ts).

**FIFO lineTotal (line 145-147):** Update to handle the gram case:

```typescript
const fifoLineTotal = (item.sellingMode === "BY_PIECE" && item.pieces > 0)
  ? roundHalereUp(item.pricePerUnit * fifo.pieces)
  : roundHalereUp(item.pricePerGram * fifo.grams);
```

### 4. `src/lib/fifo.ts` — Minor: handle BY_PIECE gram deduction edge case

**Current behavior works BUT has one issue:** When deducting grams from a BY_PIECE delivery, it only decrements `remainingGrams` but NOT `remainingPieces`. This means after selling 150g from a 150g piece by grams, `remainingGrams=0` but `remainingPieces=1` — the piece appears available as a whole piece.

**Fix (after gram deduction, line 88-92):** When gram deduction from a BY_PIECE delivery fully consumes a piece's worth of grams, also decrement the piece count:

```typescript
} else {
  // Gram-based sale (loose hair OR partial from piece)
  gramsFromThis = Math.min(gramsRemaining, delivery.remainingGrams);
  gramsRemaining -= gramsFromThis;

  // If this delivery has pieces (BY_PIECE stock) and all grams are consumed,
  // mark pieces as consumed too
  if (delivery.pieceWeightGrams && delivery.pieceWeightGrams > 0) {
    const gramsAfter = delivery.remainingGrams - gramsFromThis;
    const fullPiecesConsumed = Math.floor(
      (delivery.remainingGrams - gramsAfter) / delivery.pieceWeightGrams
    );
    // If remaining grams can no longer form a complete piece, piece is consumed
    const piecesAfter = Math.floor(gramsAfter / delivery.pieceWeightGrams);
    const piecesBefore = delivery.remainingPieces;
    piecesFromThis = Math.max(0, piecesBefore - piecesAfter);
  }
}
```

**Simpler approach (recommended):** Since a delivery has exactly 1 piece, just check if remainingGrams reaches 0:

```typescript
} else {
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
```

**Update delivery (line 97-103):** Already decrements both grams and pieces — `piecesFromThis` will be correct with the fix above.

### 5. `src/app/api/sales/price-preview/route.ts` — Support gram pricing for BY_PIECE

**Current (line 35-43):** BY_PIECE always returns `pricePerPiece * pieces`.

**Change:** When `pieces === 0 && grams > 0` for a BY_PIECE variant, return gram-based lineTotal:

```typescript
if (pricing.sellingMode === "BY_PIECE") {
  if ((pieces ?? 0) > 0) {
    // Standard whole-piece sale
    const lineTotal = roundHalereUp((pricing.pricePerPiece ?? 0) * (pieces ?? 0));
    return NextResponse.json({
      sellingMode: "BY_PIECE",
      pricePerPiece: pricing.pricePerPiece,
      pricePerGram: pricing.pricePerGram,
      lineTotal,
      availableStock,
    });
  } else {
    // Partial gram sale from BY_PIECE stock
    const lineTotal = roundHalereUp(pricing.pricePerGram * grams);
    return NextResponse.json({
      sellingMode: "BY_PIECE",
      pricePerPiece: pricing.pricePerPiece,
      pricePerGram: pricing.pricePerGram,
      lineTotal,
      availableStock,
    });
  }
}
```

### 6. i18n translations — Add new keys

Add to `cs.json`, `uk.json`, `ru.json` under `"sale"` namespace:

```json
{
  "sellByGrams": "Prodat po gramech",
  "sellByPieces": "Prodat po kusech"
}
```

---

## What does NOT need changes

| Component | Why |
|-----------|-----|
| `stock-in.ts` / `deliveries/route.ts` | Stock-in already sets both `remainingGrams` and `remainingPieces` correctly |
| `stock.ts` / `getStockNumbers` | Already returns both `availableGrams` and `availablePieces` |
| `sale-pricing.ts` / `getSalePrice` | Already returns both `pricePerGram` and `pricePerPiece` for BY_PIECE |
| `credit-note.ts` | Returns work at line-item level, agnostic to gram/piece source |
| `fifo.ts` / `fifoReturn` | Returns increment grams/pieces as stored on SaleItem — works correctly |
| Prisma schema | No new fields needed — existing `grams`, `pieces` on SaleItem handles both cases |
| `QrLabelSheet.tsx` / QR modals | Not affected |

---

## Edge cases

| Case | Handling |
|------|----------|
| Sell exactly `pieceWeightGrams` grams | Piece fully consumed, `remainingPieces` decremented to 0 |
| Sell more grams than available | `InsufficientStockError` thrown (line 57-63 of fifo.ts) |
| Multiple pieces on one delivery | E.g. 3 pieces at 50g each = 150g. Selling 120g consumes 2 full pieces (100g) + 20g partial from 3rd. Piece count goes from 3 → 1 (simplified: `piecesAfter = floor(30/50) = 0` — actually piece count should reflect that 30g remain from last piece). **Recommended: keep it simple — for partial gram sales, only decrement pieces when ALL grams reach 0.** This is the safest approach. |
| Return of partial gram sale | `SaleItem` stores `grams` and `pieces` correctly. `fifoReturn` increments both back. If `pieces=0, grams=100`, only grams are returned. |
| Mixed sale: 1 whole piece + 50g partial | User adds item twice: once as whole piece, once toggled to grams. Each creates separate `SaleItem`. FIFO handles them independently. |
| `retailPricePerGram` is 0 on BY_PIECE variant | This shouldn't happen — BY_PIECE variants have `wholesalePricePerGram` set during stock-in. If 0, lineTotal will be 0. Not a new problem — same applies to regular BY_GRAM variants with price 0. |

---

## Files to edit — summary

| # | File | Change | Complexity |
|---|------|--------|------------|
| 1 | `src/components/sales/SaleItemRow.tsx` | Add gram toggle for BY_PIECE, show gram input when toggled | LOW |
| 2 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Add `sellByGrams` to SaleItem, toggle handler, update pricing logic | MEDIUM |
| 3 | `src/lib/sales.ts` | Support gram-based lineTotal for BY_PIECE when pieces=0 | LOW |
| 4 | `src/lib/fifo.ts` | Decrement pieces when all grams consumed from BY_PIECE delivery | LOW |
| 5 | `src/app/api/sales/price-preview/route.ts` | Support gram-based lineTotal for BY_PIECE | LOW |
| 6 | i18n `cs.json` / `uk.json` / `ru.json` | Add `sellByGrams`, `sellByPieces` keys | LOW |

**Total: 6 files, no schema changes, no migrations.**
