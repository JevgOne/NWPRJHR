# TASK-060: Redesign length buttons — show price + availability inline

## Status: READY FOR IMPLEMENTATION

## Context

User wants customers to see price and stock BEFORE selecting a length. Currently `AddToInquiryForm.tsx` shows plain "50 cm" buttons; price and availability appear only AFTER clicking (in a separate Step 3 block). This forces customers to memorize info.

### Key discovery

`ProductVariantPicker.tsx` already exists in the same directory with the exact improved pattern we need — rich length buttons showing price per gram and stock, with disabled state for out-of-stock variants. **It is NOT used anywhere** (page.tsx imports `AddToInquiryForm` on line 13/360). This is our reference implementation.

## Data available

`PickerVariant` interface (both files share it):
```ts
interface PickerVariant {
  lengthCm: number;
  color: string;
  pricePerGram: number;       // in halere (divide by 100 for CZK)
  retailPricePerGram: number; // in halere
  availableGrams: number;     // grams in stock
}
```

Prices are in **halere** (Czech cents). `formatCZK(5500)` → `"55,00"`.

## Changes required

### FILE 1: `src/app/(public)/offer/[id]/AddToInquiryForm.tsx`

#### Change 1.1: Modify `availableLengths` memo (lines 51-56)

**Current:** Returns `number[]` (just lengthCm values)
```ts
const availableLengths = useMemo(() => {
  if (!selectedColor) return [];
  return [...new Set(
    variants.filter((v) => v.color === selectedColor).map((v) => v.lengthCm)
  )].sort((a, b) => a - b);
}, [variants, selectedColor]);
```

**New:** Return full `PickerVariant[]` (sorted by lengthCm) — same pattern as `ProductVariantPicker.tsx` line 55-60:
```ts
const availableLengths = useMemo(() => {
  if (!selectedColor) return [];
  return variants
    .filter((v) => v.color === selectedColor)
    .sort((a, b) => a.lengthCm - b.lengthCm);
}, [variants, selectedColor]);
```

#### Change 1.2: Rebuild length buttons (lines 127-145)

**Current:** Simple buttons showing only `{cm} cm`

**New:** Rich buttons with 3 lines (length, price, stock). Reference: `ProductVariantPicker.tsx` lines 128-155.

```tsx
<div className="flex flex-wrap gap-2">
  {availableLengths.map((v) => {
    const isSelected = selectedLength === v.lengthCm;
    const inStock = v.availableGrams > 0;
    return (
      <button
        key={v.lengthCm}
        type="button"
        onClick={() => inStock && setSelectedLength(v.lengthCm)}
        disabled={!inStock}
        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
          isSelected
            ? "border-rose bg-rose/10 text-ink ring-1 ring-rose"
            : inStock
              ? "border-line bg-white text-muted hover:border-espresso/30"
              : "border-line bg-nude-100 opacity-50 cursor-not-allowed"
        }`}
      >
        <div className="font-medium text-ink">{v.lengthCm} cm</div>
        <div className="text-xs text-muted">
          {formatCZK(v.pricePerGram)} Kc/g
        </div>
        <div className={`text-[11px] ${inStock ? "text-emerald-600" : "text-red-400"}`}>
          {inStock ? `${v.availableGrams}g` : t("inquiry.outOfStock")}
        </div>
      </button>
    );
  })}
</div>
```

Key differences from current code:
- `gap-1.5` → `gap-2` (slightly more breathing room for taller buttons)
- Button iterates over `PickerVariant` objects, not `number`
- Three lines inside each button: length, price/g, stock
- Disabled + muted styling when `availableGrams <= 0`
- Uses `t("inquiry.outOfStock")` for out-of-stock label

#### Change 1.3: Delete Step 3 block (lines 150-180)

Remove the entire `{/* Step 3: Price + availability display */}` block. This info is now embedded in the length buttons. The `tierBadge` discount badge and retail price strikethrough can be removed — the length button already shows the resolved price. If tierBadge display is desired, it can stay in the page-level price section (which already exists in `page.tsx` lines 268-291).

#### Change 1.4: Update Step 4 comment (line 182)

Change `{/* Step 4: Quantity + add button */}` to `{/* Step 3: Quantity + add button */}`.

#### Change 1.5: Fix `selectedLength` references

After Change 1.1, `availableLengths` items are `PickerVariant` objects. The color-change handler (lines 97-104) uses:
```ts
const lengthsForColor = variants
  .filter((v) => v.color === code)
  .map((v) => v.lengthCm);
if (!lengthsForColor.includes(selectedLength)) {
  setSelectedLength(null);
}
```
This code already works with the raw `variants` array, so **no change needed** here.

#### Change 1.6: formatCZK adjustment for price/g display

The existing `formatCZK` (lines 24-29) uses `minimumFractionDigits: 2`. For the length button price display, we want whole numbers (e.g., "55 Kc/g" not "55,00 Kc/g"). Two options:

**Option A (preferred):** Add a simpler format function alongside:
```ts
function formatPrice(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
```
Use `formatPrice` for the length button price, keep `formatCZK` for any remaining uses.

**Option B:** Use `formatCZK` as-is (shows "55,00 Kc/g"). Acceptable but verbose for small buttons.

Recommend Option A — matches `ProductVariantPicker.tsx` which uses the same `formatPrice` pattern.

### FILE 2: `messages/cs.json`

Add inside `"inquiry"` block (after line 658, before closing `}`):

```json
"outOfStock": "Vyprodano"
```

Note: Value matches existing `public.outOfStock` ("Vyprodano") for consistency.

### FILE 3: `messages/uk.json`

Add inside `"inquiry"` block:

```json
"outOfStock": "Nemaje v najavnosti"
```

### FILE 4: `messages/ru.json`

Add inside `"inquiry"` block:

```json
"outOfStock": "Net v nalichii"
```

### FILE 5 (optional cleanup): `src/app/(public)/offer/[id]/ProductVariantPicker.tsx`

This file is **unused** — no imports reference it. After this task is complete, it can be deleted as dead code. The improved `AddToInquiryForm.tsx` will contain all the same functionality.

**Decision for implementor:** Delete `ProductVariantPicker.tsx` as part of this task, or leave for a separate cleanup task.

## Implementation order

1. Add `"outOfStock"` translation key to all 3 message files (cs, uk, ru)
2. Modify `availableLengths` memo to return `PickerVariant[]`
3. Rebuild length buttons with price + stock
4. Delete Step 3 price/availability block
5. Add `formatPrice` helper (or reuse `formatCZK`)
6. Renumber step comments
7. (Optional) Delete unused `ProductVariantPicker.tsx`

## Verification checklist

- [ ] Length buttons show 3 lines: length, price/g, available grams
- [ ] Out-of-stock variants are disabled + visually muted (opacity-50)
- [ ] Out-of-stock variants show translated "Vyprodano" text
- [ ] Clicking out-of-stock button does nothing
- [ ] Step 3 price block is gone — no duplicate info
- [ ] Color → length flow still works (selecting color shows lengths)
- [ ] Selecting length + quantity → Add button works
- [ ] `inquiry.outOfStock` key exists in cs/uk/ru
- [ ] No TypeScript errors
- [ ] Mobile responsive (buttons wrap correctly)

## Risk assessment

**Low risk.** Changes are confined to one component + translation files. The pattern is proven (already implemented in `ProductVariantPicker.tsx`). No backend/API changes needed. No new dependencies.
