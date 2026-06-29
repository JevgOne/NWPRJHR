# Task #43 — Zjednodušit formulář naskladnění (StockInForm)

## Current State

`src/components/inventory/StockInForm.tsx` (338 lines) has these fields:
1. Produkt (dropdown) — line 118-133
2. Varianta (dropdown) — line 148-161
3. Dodavatel (dropdown) — line 171-183
4. Nákupní cena (input) — line 188-196
5. Měna (dropdown CZK/USD/EUR/UAH) — line 202-216
6. Kurz (input, disabled for CZK) — line 219-228
7. CZK preview — line 232-238
8. Celkem gramů (input) — line 243-250
9. Celkem kusů (input) — line 251-257
10. Váha kusu (conditional, shows when pieces > 0) — line 258-267
11. Čárový kód (input) — line 273-278
12. Vygenerovat kód (button) — line 280-286
13. Kód šarže (input) — line 291-295
14. Datum naskladnění (date input) — line 296-301
15. Poznámka (textarea) — line 309-314

**User complaints:**
- "dost debilní naskladnění" — too complex
- "co znamena kurz 10000" — confusing for CZK
- "Kód šarže je co?" — unnecessary
- "počet gramu a pak počet kusu to je co?" — too many fields
- "moc picovin tam máš" — simplify

---

## Implementation Plan

### Target simplified form layout:
```
Produkt:  [Panenské vlasy (Virgin) ▾]
Varianta: [40 cm — barva 10        ▾]
Dodavatel:[Supplier name            ▾]
Nákupní cena: [___] CZK/g    Měna: [CZK ▾]
  (Kurz: [___] — ONLY visible when non-CZK)
  (Přepočet: X.XX CZK/g — ONLY when non-CZK)
Celkem gramů: [___]
Datum: [2026-06-28]
Poznámka: [_______________]
[Naskladnit]  [Zrušit]
```

---

### FIX 1: Product dropdown — show category

**File: `src/app/(app)/inventory/stock-in/page.tsx`**

Add `category` to the product query and pass it to the form:

```diff
  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
+   category: p.category,
    variants: p.variants.map((v) => ({
```

**File: `src/components/inventory/StockInForm.tsx`**

Update `ProductOption` interface:
```diff
  interface ProductOption {
    id: string;
    name: string;
+   category: string;
    texture?: string | null;
    variants: { id: string; lengthCm: number; color: string }[];
  }
```

Update product dropdown (line 128-132):
```diff
- <option key={p.id} value={p.id}>
-   {p.name}
- </option>
+ <option key={p.id} value={p.id}>
+   {p.name} ({tCategory(p.category.toLowerCase() as "virgin")})
+ </option>
```

Add `tCategory` translation:
```diff
  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
+ const tCategory = useTranslations("category");
```

### FIX 2: Variant dropdown — show color NAMES instead of codes

**Problem:** Dropdown shows `"30 cm / 10"` where "10" is a color code. User has no idea what color "10" is.

**Solution:** Use `getHairColor()` + `useTranslations("public.colors")` to show real color names like `"30 cm — Černá"`.

**File: `src/components/inventory/StockInForm.tsx`**

Add imports and translation hook:
```diff
+ import { getHairColor } from "@/lib/hair-colors";

  const t = useTranslations("stock");
  const tCommon = useTranslations("common");
+ const tColors = useTranslations("public.colors");
+
+ const colorName = (code: string) => {
+   const { nameKey } = getHairColor(code);
+   try { return tColors(nameKey as "c1"); } catch { return code; }
+ };
```

Update variant dropdown (line 157-159):
```diff
- <option key={v.id} value={v.id}>
-   {v.lengthCm} cm / {v.color}
- </option>
+ <option key={v.id} value={v.id}>
+   {v.lengthCm} cm — {colorName(v.color)}
+ </option>
```

This shows: `"30 cm — Černá"`, `"40 cm — Tmavě hnědá"`, `"50 cm — Platinová blond"` etc.

### FIX 3: Hide Kurz field when CZK

**File: `src/components/inventory/StockInForm.tsx`**

Replace the 3-column grid (lines 187-229) with conditional rendering:

```tsx
{/* Purchase price + currency */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input
    label={t("purchasePrice")}
    type="number"
    value={purchasePrice}
    onChange={(e) => setPurchasePrice(e.target.value)}
    required
    min={1}
    placeholder="e.g. 500"
  />
  <div>
    <label className="block text-sm font-medium text-espresso mb-1">
      {t("currency")}
    </label>
    <select
      className="block w-full rounded-lg border border-line px-3 py-2 text-sm"
      value={currency}
      onChange={(e) => {
        const c = e.target.value as (typeof CURRENCIES)[number];
        setCurrency(c);
        if (c === "CZK") setExchangeRate("10000");
      }}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>
</div>

{/* Exchange rate — ONLY when non-CZK */}
{currency !== "CZK" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input
      label={t("exchangeRate")}
      type="number"
      value={exchangeRate}
      onChange={(e) => setExchangeRate(e.target.value)}
      required
      min={1}
      placeholder="e.g. 254350"
    />
    {calculatedCZK !== null && (
      <div className="flex items-end pb-2">
        <span className="text-sm text-muted">
          {t("calculatedCZK")}: <span className="font-semibold text-ink">{(calculatedCZK / 100).toFixed(2)} CZK/{t("grams")}</span>
        </span>
      </div>
    )}
  </div>
)}
```

### FIX 4: Hide pieces/pieceWeight fields

**File: `src/components/inventory/StockInForm.tsx`**

Replace the 3-column quantities grid (lines 241-268) with just grams:

```tsx
{/* Total grams */}
<Input
  label={t("totalGrams")}
  type="number"
  value={totalGrams}
  onChange={(e) => setTotalGrams(e.target.value)}
  required
  min={1}
/>
```

Update the submit body to always send `totalPieces: 0` (line 84):
```diff
  const body = {
    variantId,
    supplierId,
    purchasePricePerGramRaw: parseInt(purchasePrice),
    currency,
    exchangeRate: parseInt(exchangeRate),
    totalGrams: parseInt(totalGrams),
-   totalPieces: pieces,
-   ...(pieces > 0 ? { pieceWeightGrams: parseInt(pieceWeight) } : {}),
+   totalPieces: 0,
```

Remove state variables (lines 42-43):
```diff
- const [totalPieces, setTotalPieces] = useState("0");
- const [pieceWeight, setPieceWeight] = useState("");
```

### FIX 5: Hide barcode field + generate button

**File: `src/components/inventory/StockInForm.tsx`**

DELETE lines 270-287 (barcode section) entirely.

Remove state variable (line 44):
```diff
- const [barcode, setBarcode] = useState("");
```

Remove from submit body (line 86):
```diff
- ...(barcode ? { barcode } : {}),
```

Remove the `handleGenerateBarcode` function (lines 64-68).

### FIX 6: Hide batchCode field

**File: `src/components/inventory/StockInForm.tsx`**

Remove batchCode from the grid (lines 289-302). Keep only the date field:

```tsx
{/* Date */}
<Input
  label={t("stockedAt")}
  type="date"
  value={stockedAt}
  onChange={(e) => setStockedAt(e.target.value)}
/>
```

Remove state variable (line 45):
```diff
- const [batchCode, setBatchCode] = useState("");
```

Remove from submit body (line 87):
```diff
- ...(batchCode ? { batchCode } : {}),
```

### FIX 7: Fix gray text color

**File: `src/components/inventory/StockInForm.tsx` line 233**

```diff
- <div className="text-sm text-gray-600">
+ <div className="text-sm text-muted">
```

---

## Validation Schema — NO CHANGES NEEDED

`src/lib/validations/delivery.ts` already has all hidden fields as optional:
- `barcode: z.string().max(100).optional()`
- `batchCode: z.string().max(100).optional()`
- `totalPieces: z.number().int().min(0)` — we send 0
- `pieceWeightGrams: z.number().int().positive().optional()`

The refine rules also pass:
- `totalPieces === 0` → no pieceWeightGrams required ✓
- `currency === "CZK"` → exchangeRate === 10000 ✓

---

## Resulting Simplified Form

**BEFORE** (15 fields/buttons):
Produkt, Varianta, Dodavatel, Cena, Měna, Kurz, CZK preview, Gramy, Kusy, Váha kusu, Čárový kód, Generovat kód, Kód šarže, Datum, Poznámka

**AFTER** (7-9 fields depending on currency):
Produkt (s kategorií), Varianta (čitelná), Dodavatel, Cena, Měna, [Kurz + CZK preview jen pro non-CZK], Gramy, Datum, Poznámka

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/inventory/StockInForm.tsx` | Remove 6 fields, fix dropdowns, conditional kurz |
| `src/app/(app)/inventory/stock-in/page.tsx` | Add `category` to product options |

**NO new files. NO DB migration. NO API changes.**
