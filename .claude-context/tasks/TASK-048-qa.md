# TASK-048: QA — Stock-in Form Redesign (Task #43)

**Datum:** 2026-06-28
**Build:** `npm run build` — **PASS, 0 errors, 0 warnings**

---

## VÝSLEDEK: PASS ✅

Všechny body redesignu správně implementovány, kód čistý.

---

## CHECKLIST

### ✅ Build projde
`npm run build` — Compiled successfully, 123/123 stránek. Žádné TypeScript chyby.

### ✅ Kód je čistý — žádné unused imports/variables
Importy:
- `useState`, `useMemo` — oba použity
- `useRouter` — použit pro redirect po submit + cancel
- `useTranslations` — použit (t, tCommon, tCat, tColors)
- `getHairColor` — použit v `colorName()`
- `Card`, `Button`, `Input` — všechny použity v JSX

Žádné nevyužité proměnné. State proměnné:
- `productId`, `selectedColor`, `selectedLength`, `supplierId`, `purchasePrice`, `totalGrams`, `stockedAt`, `note`, `submitting`, `error` — všechny v JSX nebo submit handleru

**Odstraněné pole (potvrzeno nepřítomny):**
- ❌ čárový kód — není
- ❌ šarže — není
- ❌ kusy — není (totalPieces hardcoded na 0)
- ❌ váha kusu — není
- ❌ kurz — není
- ❌ měna dropdown — není

### ✅ Produkt dropdown s kategorií
```tsx
{p.name} ({tCat(p.category.toLowerCase() as "virgin" | "premium" | "standard" | "sale")})
```
Zobrazí např. "Panenské vlasy (Panenské)" — lokalizovaný název kategorie. OK.

### ✅ Barva — klikací swatch tlačítka s obrázkem + názvem
- `getHairColor(code).nameKey` → `tColors(nameKey)` → česky "Platinová", "Světlá blond" atd.
- Swatch `/swatches/color-{code}.png` + text název barvy
- Vybraná barva: `border-rose bg-rose/10 ring-1 ring-rose`
- Reset délky při změně barvy: `setSelectedLength("")` ✅

### ✅ Délka — klikací tlačítka filtrované podle vybrané barvy
```tsx
const availableLengths = useMemo(() => {
  if (!selectedColor) return [];
  return variants
    .filter((v) => v.color === selectedColor)
    .map((v) => v.lengthCm)
    .sort((a, b) => a - b);
}, [variants, selectedColor]);
```
Délky jsou správně filtrovány podle `selectedColor`. Pokud barva není vybrána, zobrazí "Nejdříve vyberte barvu". ✅

### ✅ Měna odstraněna — hardcoded CZK
Submit body: `currency: "CZK"`, `exchangeRate: 10000` — hardcoded, žádný dropdown. ✅

### ✅ variantId se správně resolví z color + length
```tsx
const variantId = useMemo(() => {
  if (!selectedColor || !selectedLength) return "";
  return variants.find((v) =>
    v.color === selectedColor && v.lengthCm === parseInt(selectedLength)
  )?.id ?? "";
}, [variants, selectedColor, selectedLength]);
```
- `parseInt(selectedLength)` správně konvertuje string state na číslo pro porovnání s `v.lengthCm: number`
- Pokud kombinace neexistuje, vrátí `""` a submit je blokován (`if (!variantId) setError(...)`)
- `<input type="hidden" name="variantId" value={variantId} required />` — přidaný pro HTML5 form validation ✅

### ✅ Submit body má správná data
```ts
const body = {
  variantId,           // resolved z color + length
  supplierId,
  purchasePricePerGramRaw: parseInt(purchasePrice),
  currency: "CZK",     // hardcoded ✅
  exchangeRate: 10000, // hardcoded ✅
  totalGrams: parseInt(totalGrams),
  totalPieces: 0,      // hardcoded ✅
  stockedAt: new Date(stockedAt).toISOString(),
  ...(note ? { note } : {}),
};
```
Všechna pole odpovídají zadání. ✅

---

## DROBNÉ POZNÁMKY (neblokující)

1. **Placeholder "haléře za gram"** — hardcoded česky, nelze lokalizovat přes i18n. Neblokující — formulář je admin only.

2. **`<input type="hidden" required>`** — HTML5 `required` na hidden inputu nemá efekt v prohlížeči (browser validation ignoruje hidden fields). Validace je ale provedena v JS (`if (!variantId) setError(...)`), takže submit je správně blokován. Funkčně OK.

3. **Swatch fallback** — `/swatches/color-{code}.png` nemá fallback pro chybějící soubor (broken img). Stejný pattern jako v CatalogClient — neblokující.

---

## ZÁVĚR

Stock-in formulář je čistě redesignován podle zadání. Build prochází, kód bez unused importů/proměnných, variantId se správně resolví, submit body má správná hardcoded pole (CZK, exchangeRate: 10000, totalPieces: 0). **Doporučuji schválit.**
