# QA Report — Task #47: Pricing fields + color grid (commit 16bf084)

**Datum:** 2026-07-15  
**Výsledek: PASS**

---

## 1. Selling mode toggle BY_GRAM/BY_PIECE — PASS ✅

```tsx
onClick={() => { setSellingMode("BY_GRAM"); setRetailManual(false); setCostPrice(""); setRetailPrice(""); }}
onClick={() => { setSellingMode("BY_PIECE"); setRetailManual(false); setCostPrice(""); setRetailPrice(""); }}
```
State reset při přepnutí: `retailManual`, `costPrice`, `retailPrice` → všechny na výchozí. ✅

---

## 2. Auto 2x markup — PASS ✅

```tsx
onChange={(e) => {
  setCostPrice(e.target.value);
  if (!retailManual) {
    const cost = parseFloat(e.target.value);
    setRetailPrice(cost > 0 ? (cost * 2).toString() : "");
  }
}}
```
Pokud `retailManual === false`: retail = cost × 2 automaticky. Po manuální editaci retail fieldu: `setRetailManual(true)` → auto přestane přepisovat. ✅

---

## 3. Margin preview barvy — PASS ✅

```tsx
marginPreview > 30 ? "text-emerald-600" : marginPreview > 0 ? "text-amber-600" : "text-red-600"
```
- > 30%: zelená (emerald-600) ✅
- 0-30%: oranžová (amber-600) ✅
- ≤ 0%: červená (red-600) ✅

Vzorec: `Math.round(((retailPreview - costPreview) / retailPreview) * 100)` — standardní margin calc. ✅

---

## 4. Color grid — 10 koleček — PASS ✅

`COLOR_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]` — 10 kódů.

Každé kolečko renderuje:
```tsx
{COLOR_CODES.map((code) => (
  <button key={code} ... style={{ backgroundColor: hc.hex }} title={colorLabel(code)} />
))}
```
✅ — grid s `flex flex-wrap gap-1.5`, všechny kódy iterovány.

---

## 5. handleSubmit — správná cenová data — PASS ✅

`retailHalere = Math.round(parseFloat(retailPrice) * 100)` — správná konverze Kč → haléře.
`costHalere = costPrice ? Math.round(parseFloat(costPrice) * 100) : 0`

**BY_GRAM:**
```ts
{ lengthCm, color, costPricePerGram: costHalere, wholesalePricePerGram: retailHalere,
  retailPricePerGram: retailHalere, sellingMode: "BY_GRAM" }
```

**BY_PIECE:**
```ts
{ lengthCm, color, costPricePerGram: costHalere, wholesalePricePerGram: 0,
  retailPricePerGram: 0, sellingMode: "BY_PIECE",
  pricePerPiece: retailHalere, retailPricePerPiece: retailHalere }
```
✅

---

## 6. Validace blokuje submit retail = 0 — PASS ✅

```ts
const retailHalere = Math.round(parseFloat(retailPrice) * 100);
if (!retailHalere || retailHalere <= 0) {
  setError(t("variant.enterValidPrice"));
  return;
}
```
Submit zablokován před `setLoading(true)`. ✅

---

## 7. createVariantsSchema shoda — PASS ✅

Schema (`product.ts`):
- `lengthCm`: `z.number().int().positive().max(150)` — form posílá `parseInt(v.lengthCm)` ✅
- `wholesalePricePerGram`: `z.number().int().min(0)` — posílá retailHalere (BY_GRAM) nebo 0 (BY_PIECE) ✅
- `costPricePerGram`: optional int ≥ 0 — posílá costHalere ✅
- `sellingMode`: optional enum — posílá "BY_GRAM"/"BY_PIECE" ✅
- `pricePerPiece`: optional int, positive — posílá retailHalere (validace zaručí > 0) ✅
- `retailPricePerPiece`: optional int, positive — posílá retailHalere ✅

Všechna odesílaná data odpovídají schématu. ✅

---

## TypeScript: 0 chyb ✅

---

## Závěr

Task #47: PASS. Selling mode toggle, auto-markup 2×, margin preview, color grid, handleSubmit data, validace — vše správně implementováno a konzistentní se schématem.
