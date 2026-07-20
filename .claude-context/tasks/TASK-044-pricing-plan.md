# TASK-044: Add pricing fields + fix colors in CreateProductForm variant creator

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-15

---

## Context

Two issues:
1. **Pricing:** CreateProductForm creates variants with `wholesalePricePerGram: 0, retailPricePerGram: 0` — no pricing at all
2. **Colors:** User says "tam jsou 4 barvy jenom, na webu jich mame vic" — needs investigation

---

## Issue 1: Missing pricing fields

### Current state

`CreateProductForm.tsx` lines 173-178 — variant data sent to API:
```typescript
const variantData = validVariants.map((v) => ({
  lengthCm: parseInt(v.lengthCm),
  color: v.color,
  wholesalePricePerGram: 0,   // ← HARDCODED 0
  retailPricePerGram: 0,       // ← HARDCODED 0
}));
```

No pricing UI in the variant rows — only lengthCm + color dropdown.

### How it SHOULD work (from existing VariantBatchCreate.tsx)

`VariantBatchCreate.tsx` has a complete pricing system:
1. **Selling mode toggle** — BY_GRAM / BY_PIECE (lines 156-184)
2. **Purchase price** (costPricePerGram or costPricePerPiece) — user enters cost
3. **Retail price** — auto-calculated as `cost * 2` (100% margin), user can override
4. **Price preview** — shows retail/cost/margin in a summary box
5. **Auto-label** — "Auto: nakupni x 2" hint when not manually overridden

### Recommended approach

**Option A (RECOMMENDED): Add shared pricing fields above variant rows**

Same price applies to ALL variants in the batch (same as VariantBatchCreate does it). This is cleaner than per-row pricing:

```
Cenova politika
┌─────────────────────────────────────────────┐
│ [Za gramy]  [Za kusy]          (toggle)     │
│                                              │
│ Nakupni cena/g: [5.00]  Prodejni: [10.00]  │
│                         Auto: nakupni x 2    │
│                                              │
│ Prodejni: 1 000 Kc/100g | Marze: 50%       │
└─────────────────────────────────────────────┘

Varianty
┌─────────────────────────────────────────────┐
│ [40] cm   [1 — Platinova blond]       [x]   │
│ [50] cm   [3 — Zlata blond]           [x]   │
│                            [+ Pridat]        │
└─────────────────────────────────────────────┘
```

**Option B: Per-row pricing**

Each variant row has its own price field. More flexible but cluttered for initial creation.

**Recommendation: Option A** — matches existing VariantBatchCreate UX, simpler for the user.

### Implementation

#### Step 1: Add pricing state to CreateProductForm

```typescript
// Add these state variables (copy from VariantBatchCreate pattern)
const [sellingMode, setSellingMode] = useState<"BY_GRAM" | "BY_PIECE">("BY_GRAM");
const [costPrice, setCostPrice] = useState("");
const [retailPrice, setRetailPrice] = useState("");
const [retailManual, setRetailManual] = useState(false);

const isByPiece = sellingMode === "BY_PIECE";
```

#### Step 2: Add pricing UI section

Copy the pricing fields from VariantBatchCreate.tsx lines 156-293:
- Selling mode toggle
- Purchase price + retail price fields (grid 2-col)
- Auto 2x calculation on cost price change
- Price preview box with margin

#### Step 3: Update handleSubmit to use actual prices

```typescript
const variantData = validVariants.map((v) => {
  if (isByPiece) {
    const moHalere = Math.round(parseFloat(retailPrice) * 100);
    const costHalere = costPrice ? Math.round(parseFloat(costPrice) * 100) : 0;
    return {
      lengthCm: parseInt(v.lengthCm),
      color: v.color,
      costPricePerGram: costHalere,
      wholesalePricePerGram: 0,
      retailPricePerGram: 0,
      sellingMode: "BY_PIECE" as const,
      pricePerPiece: moHalere,
      retailPricePerPiece: moHalere,
    };
  } else {
    const retailHalere = Math.round(parseFloat(retailPrice) * 100);
    const costHalere = costPrice ? Math.round(parseFloat(costPrice) * 100) : 0;
    return {
      lengthCm: parseInt(v.lengthCm),
      color: v.color,
      costPricePerGram: costHalere,
      wholesalePricePerGram: retailHalere,
      retailPricePerGram: retailHalere,
      sellingMode: "BY_GRAM" as const,
    };
  }
});
```

#### Step 4: Add validation

Before submit, require retail price > 0:
```typescript
const retailHalere = Math.round(parseFloat(retailPrice) * 100);
if (!retailHalere || retailHalere <= 0) {
  setError("Zadejte prodejni cenu");
  return;
}
```

---

## Issue 2: Colors — "only 4 shown"

### Investigation

`CreateProductForm.tsx` lines 81-85:
```typescript
const colorOptions = COLOR_CODES.map((code) => ({
  code,
  hex: HAIR_COLORS[code].hex,
  label: (() => { try { return tColors(HAIR_COLORS[code].nameKey as "c1"); } catch { return code; } })(),
}));
```

`COLOR_CODES` = `["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]` (10 colors)

All 10 translations exist in `messages/cs.json` lines 920-929 (c1-c10).

**The code should render all 10 colors in the dropdown.** The "only 4" statement could mean:
1. **HTML `<select>` rendering issue** — the `<select>` dropdown shows all 10 `<option>`s, but the user might see fewer on their screen/browser
2. **User means existing products on the web** — only 4 colors are currently used in existing products
3. **User is confused** about variant colors vs product colorTone (they are different fields)

### Possible visual issue

The variant color is a `<select>` dropdown (lines 363-371). On iOS/iPhone, native `<select>` can show limited options depending on scroll position. This is not a code bug.

### Recommended fix

Replace `<select>` with a **visual color grid** (same pattern as StockInForm.tsx lines 743-759) — colored circles instead of a text dropdown. This:
- Shows all 10 colors at once (no scrolling/truncation)
- Matches stock-in wizard UX
- Is more user-friendly (visual color selection)

```tsx
// Replace <select> with color grid per variant row
<div className="flex gap-1.5 flex-wrap flex-1">
  {colorOptions.map((c) => (
    <button
      key={c.code}
      type="button"
      onClick={() => updateVariant(i, "color", c.code)}
      className={`w-7 h-7 rounded-full border-2 transition-colors ${
        v.color === c.code ? "border-rose scale-110" : "border-line hover:border-muted"
      }`}
      style={{ backgroundColor: c.hex }}
      title={`${c.code} — ${c.label}`}
    />
  ))}
</div>
```

---

## Files to edit

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/app/(app)/products/new/CreateProductForm.tsx` | Add pricing fields (selling mode, cost/retail price, margin preview) + replace color `<select>` with visual color grid | **CRITICAL** |

No API or schema changes needed — the variants API already accepts all pricing fields.

---

## Summary

| What | Current | Fix |
|------|---------|-----|
| Pricing | Hardcoded 0 for all prices | Add purchase/retail price fields with auto 2x markup |
| Selling mode | Hardcoded BY_GRAM | Add toggle BY_GRAM / BY_PIECE |
| Colors | `<select>` dropdown (10 options) | Replace with visual color circles grid |
| Margin preview | Missing | Add price/margin preview box |

**Files to edit: 1** (CreateProductForm.tsx only)

**Reference code:** Copy pricing logic from `VariantBatchCreate.tsx` lines 156-293 (already has complete working implementation).
