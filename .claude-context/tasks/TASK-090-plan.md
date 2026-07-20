# TASK-090: Cost price change shows wrong retail price

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-19

---

## Summary

User reports: "Changed cost to 3300 CZK per 100g, retail shows 10586 instead of expected 6600 (100% markup)."

Two bugs found in the admin VariantTable cost/retail price editing:

1. **BUG (primary): Unit mismatch between display and edit field** — display shows CZK/100g, edit field works in CZK/gram
2. **BUG (secondary): Variant PUT handler uses `Math.round` instead of centralized `calculateRetailPrice`/`roundHalereUp`** — inconsistent rounding

---

## Root Cause Analysis

### The unit mismatch (Bug 1)

In `src/components/products/VariantTable.tsx`:

**Display** (line 293, 328) — shows price per 100g:
```typescript
// Retail: multiply per-gram halere by 100 → per-100g halere → formatCZK
{formatCZK(variant.retailPricePerGram * 100)}/100g

// Cost: same pattern
costDisplay = variant.costPricePerGram * 100; // per-100g halere
{formatCZK(costDisplay)}{unit}  // unit = "/100g"
```

**Edit field initialization** (line 289, 348) — uses CZK per gram:
```typescript
// Retail edit: halere/gram → CZK/gram (divide by 100)
setEditValue((variant.retailPricePerGram! / 100).toString());

// Cost edit: halere/gram → CZK/gram (divide by 100)
setEditValue((variant.costPricePerGram! / 100).toString());
```

**Save** (PriceInput, line 196) — converts CZK back to halere/gram:
```typescript
const val = Math.round(parseFloat(editValue) * 100); // CZK → halere
handleSavePrice(variantId, field, val); // sends halere/gram to API
```

**Example walkthrough:**
- DB: `costPricePerGram = 3300` (halere/gram = 33 CZK/gram)
- Display shows: `formatCZK(3300 * 100)` = `formatCZK(330000)` = **"3 300 Kc/100g"**
- User clicks → edit shows: `3300 / 100` = **"33"** (CZK/gram!)
- User sees "3 300" → clicks → sees "33" → gets confused
- User types "3300" thinking per-100g → saves as `3300 * 100 = 330000` halere/gram
- API calculates: `330000 * 2 = 660000` halere/gram retail
- Display: `formatCZK(660000 * 100)` = **"660 000 Kc/100g"** ← 100x too high!

The specific "10586" number from the user's report likely came from a different sequence (possibly a delivery-imported cost that was correct in halere/gram, and the user is seeing the raw-ish number). Regardless, **the root cause is the same**: the edit field uses per-gram CZK while the display uses per-100g CZK.

### Rounding inconsistency (Bug 2)

The variant PUT handler (`src/app/api/variants/[id]/route.ts:39-41`) uses:
```typescript
const newRetail = Math.round(
  parsed.data.costPricePerGram * (10000 + markupPercent * 100) / 10000
);
```

But `src/lib/pricing.ts` has `calculateRetailPrice()` which uses `roundHalereUp()` (ceil to whole CZK). The function is imported on line 6 of the variant route but never called. The inline formula uses `Math.round` instead of the centralized rounding.

---

## Implementation Plan

### Fix 1: VariantTable — make edit field use per-100g CZK (same as display)

**File: `src/components/products/VariantTable.tsx`**

**Change A: Cost price edit initialization (line 348)**

```typescript
// BEFORE:
setEditValue((variant.costPricePerGram! / 100).toString());

// AFTER (BY_GRAM: show per-100g CZK; BY_PIECE stays per-piece CZK):
setEditValue(
  isByPiece
    ? ((variant.pricePerPiece ?? variant.costPricePerGram!) / 100).toString()
    : (variant.costPricePerGram! / 100 * 100).toString()
);
```

Wait — `costPricePerGram / 100 * 100` = `costPricePerGram`. That means the edit value for BY_GRAM should just be `variant.costPricePerGram` (which numerically equals CZK/100g).

Actually, let's simplify. The math:
- `costPricePerGram` is in halere/gram
- Display = `costPricePerGram * 100` halere → `formatCZK` → CZK/100g = `costPricePerGram * 100 / 100` = `costPricePerGram` CZK
- So the CZK/100g display number == `costPricePerGram` numerically

For the edit field to show the same number as display: `setEditValue(costPricePerGram.toString())`
For the save to convert back correctly: the input value (CZK/100g) needs to be divided by 100 to get CZK/gram, then multiplied by 100 to get halere/gram. So: `inputValue * 100 / 100` = `inputValue`. The halere/gram value equals the CZK/100g value numerically.

So we just need `setEditValue(costPricePerGram.toString())` and the PriceInput save (`val = parseFloat(editValue) * 100`) would then save `costPricePerGram * 100`, which is 100x too much!

We need a different approach. Let me think about this more carefully.

**The cleanest fix**: Make the PriceInput aware of whether it's editing a per-gram or per-100g field, and adjust the conversion accordingly.

**Simplest fix**: Keep PriceInput generic (always CZK → halere conversion), but change what the edit value is initialized to AND what multiplier the save uses based on the field type.

Actually the **simplest correct fix** is:

For BY_GRAM cost/retail fields:
- Edit init: show CZK/100g = `(field * 100) / 100` = `field` (as number string)
- Save: convert CZK/100g to halere/gram = `inputCZK / 100 * 100` = `inputCZK` (as halere number, same value!)

Wait no. Let me be very precise:
- `costPricePerGram` = halere per gram
- CZK per 100g = `(costPricePerGram * 100) / 100` = `costPricePerGram` (numerically)
- So edit field shows `costPricePerGram.toString()` (CZK/100g)
- User edits to e.g. "3300" (meaning 3300 CZK/100g)  
- Need to save as halere/gram: 3300 CZK/100g = 33 CZK/gram = 3300 halere/gram
- So saved value = `parseFloat("3300")` = 3300 halere/gram

The value the user enters (CZK/100g) equals the DB value (halere/gram) numerically! No conversion needed!

So the fix is:
1. **Edit init**: `setEditValue(variant.costPricePerGram!.toString())` (not `/ 100`)
2. **PriceInput save**: when field is cost/retail per-gram, send the value directly (not `* 100`)

This requires making PriceInput aware of the unit. OR, simpler: create a separate save handler for per-100g fields.

**Recommended approach:**

### Step 1: Add a `per100g` flag to PriceInput

```typescript
function PriceInput({ variantId, field, cellKey, per100g = false }: {
  variantId: string; field: string; cellKey: string; per100g?: boolean;
}) {
  if (editingCell !== cellKey) return null;
  return (
    <input
      ...
      onBlur={() => {
        // per100g: CZK/100g → halere/gram (same number)
        // default: CZK → halere (* 100)
        const val = per100g
          ? Math.round(parseFloat(editValue))
          : Math.round(parseFloat(editValue) * 100);
        if (val >= 0) handleSavePrice(variantId, field, val);
        else setEditingCell(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = per100g
            ? Math.round(parseFloat(editValue))
            : Math.round(parseFloat(editValue) * 100);
          if (val >= 0) handleSavePrice(variantId, field, val);
        }
        if (e.key === "Escape") setEditingCell(null);
      }}
      ...
    />
  );
}
```

### Step 2: Update edit value initialization for BY_GRAM fields

**Cost price edit (line 346-349):**
```typescript
// BEFORE:
setEditValue((variant.costPricePerGram! / 100).toString());

// AFTER:
setEditValue(
  isByPiece
    ? ((variant.pricePerPiece ?? variant.costPricePerGram!) / 100).toString()
    : variant.costPricePerGram!.toString()
);
```

**Cost price PriceInput (line 338-341):**
```typescript
// BEFORE:
<PriceInput variantId={variant.id} field="costPricePerGram" cellKey={`cost-${cellKey}`} />

// AFTER:
<PriceInput variantId={variant.id} field="costPricePerGram" cellKey={`cost-${cellKey}`} per100g={!isByPiece} />
```

**Retail price edit for BY_GRAM (line 286-289):**
```typescript
// BEFORE:
setEditValue((variant.retailPricePerGram! / 100).toString());

// AFTER:
setEditValue(variant.retailPricePerGram!.toString());
```

**Retail price PriceInput for BY_GRAM (line 276-279):**
```typescript
// BEFORE:
<PriceInput variantId={variant.id} field="retailPricePerGram" cellKey={cellKey} />

// AFTER:
<PriceInput variantId={variant.id} field="retailPricePerGram" cellKey={cellKey} per100g />
```

**Retail price edit for BY_PIECE (line 312-314):**
```typescript
// Leave as-is — BY_PIECE uses CZK, no per-100g conversion needed
setEditValue((variant.retailPricePerPiece! / 100).toString());
```

### Step 3: Fix retail manual override flag

When user manually edits retailPricePerGram through PriceInput, the variant PUT API should set `retailManualOverride: true`. Currently it doesn't.

**File: `src/app/api/variants/[id]/route.ts`**

Add after line 44:
```typescript
// When retail price is manually edited, set override flag
if (parsed.data.retailPricePerGram !== undefined && parsed.data.costPricePerGram === undefined) {
  data.retailManualOverride = true;
}
```

### Step 4: Use centralized calculateRetailPrice (optional cleanup)

**File: `src/app/api/variants/[id]/route.ts`**

Replace lines 39-43:
```typescript
// BEFORE:
const newRetail = Math.round(
  parsed.data.costPricePerGram * (10000 + markupPercent * 100) / 10000
);
data.retailPricePerGram = newRetail;
data.wholesalePricePerGram = newRetail;

// AFTER:
const newRetail = calculateRetailPrice(parsed.data.costPricePerGram, markupPercent);
data.retailPricePerGram = newRetail;
data.wholesalePricePerGram = newRetail;
```

Note: `calculateRetailPrice` is already imported (line 6) but unused.

---

## Files to modify

| # | File | Change |
|---|------|--------|
| 1 | `src/components/products/VariantTable.tsx` | Add `per100g` param to PriceInput, fix edit value init for BY_GRAM fields |
| 2 | `src/app/api/variants/[id]/route.ts` | Set retailManualOverride on manual retail edit; optionally use calculateRetailPrice |

---

## Testing

1. **BY_GRAM cost price edit:**
   - Click cost price showing "3 300 Kc/100g"
   - Edit field should show "3300" (not "33")
   - Change to "4000", save
   - Cost should show "4 000 Kc/100g"
   - Retail should show "8 000 Kc/100g" (100% markup)

2. **BY_GRAM retail price edit:**
   - Click retail price showing "6 600 Kc/100g"
   - Edit field should show "6600" (not "66")
   - Change to "7000", save
   - Retail should show "7 000 Kc/100g"
   - retailManualOverride should be set to true

3. **BY_PIECE price edit:**
   - Should continue working as before (CZK per piece, * 100 conversion)

4. **Cost change after manual retail override:**
   - Variant with retailManualOverride=true
   - Change cost price → retail should NOT change
   - Reset override → change cost price → retail should auto-calculate

---

## Summary of the unit math

| Unit | DB field | Value for "33 CZK/gram" |
|------|----------|------------------------|
| halere/gram | costPricePerGram | 3300 |
| CZK/gram | (display calc) | 33 |
| halere/100g | (display calc) | 330000 |
| CZK/100g | formatCZK output | 3300 |

Key insight: `halere/gram` == `CZK/100g` numerically (both = 3300). So when editing in CZK/100g, the value can be sent directly as halere/gram without any conversion.
