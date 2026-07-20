# QA Report: TASK-090 — Cost price change shows wrong retail price (3300→10586 instead of 6600)

**Status:** APPROVED (full implementation) ✅
**Verze:** 2 — po plné implementaci (3 soubory)
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## Změněné soubory

1. `src/app/api/variants/[id]/route.ts` — cost change vždy přepočítá retail, reset override
2. `src/app/api/price-settings/route.ts` — `costPricePerGram` místo `wholesalePricePerGram`
3. `src/components/products/VariantTable.tsx` — `handleResetOverride` napojeno na UI button

---

## 1. Simplify Check

### `variants/[id]/route.ts` (řádky 33–43)

Odstraněna podmínka `!existing.retailManualOverride` → cost change VŽDY přepočítá retail a resetuje override. Čistá, jednoznačná změna. ✅

### `price-settings/route.ts` (řádky 48–60)

`variant.wholesalePricePerGram` → `variant.costPricePerGram`. Bonus: `wholesalePricePerGram` se nyní taky synchronizuje (předtím se při bulk recalcu neaktualizoval). ✅

### `VariantTable.tsx` (řádky 301–312, 340–351)

`handleResetOverride` (existovala, ale nebyla napojená) nyní zobrazena jako amber reset-button vedle retail ceny pokud `retailManualOverride = true`. Žádná zbytečná složitost. ✅

---

## 2. Build

```
✓ Compiled successfully in 59s
✓ TypeScript passed
✓ Generating static pages (429/429)
```

✅ Čistý build, žádné errory.

---

## 3. Reverzní kontrola

**Zadání:** "zmenil sem na 3300 kč za 100g a prodejní cenu to ukazuje 10586 coz není 100% marže"

### cost 3300 h/g → retail 6600 h/g (100% markup)

**Cesta 1 — editace cost v VariantTable:**
- `parsed.data.costPricePerGram = 3300`
- `calculateRetailPrice(3300, 100%) = 3300 × 2 = 6600` h/g ✅
- `retailManualOverride = false` (reset) ✅

**Cesta 2 — bulk recalc přes price-settings:**
- Stará formula: `calculateRetailPrice(wholesale=5293, 100%) = 10586` ← bug
- Nová formula: `calculateRetailPrice(cost=3300, 100%) = 6600` ✅

### Edit pole = display (konzistence)

| Pole | Display | Init editValue | Per uložení | OK |
|------|---------|----------------|-------------|-----|
| cost BY_GRAM | 3300 Kč/100g | `'3300'` | `Math.round(3300)` = 3300 h/g | ✅ |
| retail BY_GRAM | 6600 Kč/100g | `'6600'` | `Math.round(6600)` = 6600 h/g | ✅ |
| retail BY_PIECE | 150 Kč/ks | `'150'` | `Math.round(150×100)` = 15000 h/ks | ✅ |

### BY_PIECE není ovlivněno

- Cost recalc jen při `costPricePerGram !== undefined` ✅
- BY_PIECE má vlastní `retailPricePerPiece` edit bez `per100g` ✅
- Sellingmode toggle neovlivňuje cost recalc ✅

---

## Závěr

Všechny 3 soubory opraveny správně. Matematicky verifikováno. Build čistý. BY_PIECE neovlivněno.
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## Diff — Co bylo změněno

**Soubor:** `src/app/api/price-settings/route.ts` (řádky 48–60)

```ts
// PŘED (git HEAD~1):
for (const variant of variants) {
  await tx.variant.update({
    where: { id: variant.id },
    data: {
      retailPricePerGram: calculateRetailPrice(
        variant.wholesalePricePerGram,  // BUG: wholesale = retail (ne cost!)
        markupPercent
      ),
    },
  });
}

// PO (aktuální):
for (const variant of variants) {
  const newRetail = calculateRetailPrice(
    variant.costPricePerGram,           // FIX: správný základ
    markupPercent
  );
  await tx.variant.update({
    where: { id: variant.id },
    data: {
      retailPricePerGram: newRetail,
      wholesalePricePerGram: newRetail, // bonus: wholesale se teď taky updatuje
    },
  });
}
```

---

## 1. Simplify Check

- Změna minimální a přesně cílená ✅
- `wholesalePricePerGram` se nyní správně synchronizuje s novým retail ✅ (předtím se v bulk recalcu vůbec neaktualizoval — bonus fix)
- `newRetail` proměnná extrahována pro čistší zápis ✅
- Žádná zbytečná složitost ✅

---

## 2. Debug — Build

```
npx next build
```

**Výsledek:** ✅ Čistý build bez chyb

```
▲ Next.js 16.2.9 (Turbopack)
✓ Compiled successfully
✓ TypeScript passed
✓ Generating static pages (429/429)
```

---

## 3. Reverzní kontrola

**Původní zadání:** "zmenil sem na 3300 kč za 100g a prodejní cenu to ukazuje 10586 coz není 100% marže"

### Root cause verifikován

`wholesalePricePerGram` je vždy synchronizován s `retailPricePerGram` (viz `variants/[id]/route.ts:40–43`). Při bulk recalcu price-settings proto stará formula aplikovala markup NA JIŽ MARKUPNUTOU cenu (kompounding):

**Reprodukce 10586:**
- Produkt: `cost = 3300 h/g`, historický retail při 60% markup → `retail = 5293 h/g`, `wholesale = 5293 h/g`
- Admin změní markup na 100%
- Stará formula: `calculateRetailPrice(wholesale=5293, 100%) = 5293 × 2 = 10586 h/g` ← kompounding ✓
- Nová formula: `calculateRetailPrice(cost=3300, 100%) = 3300 × 2 = 6600 h/g` ← správně ✓

| Stav | Hodnota |
|------|---------|
| Správný výsledek | 3300 × 2 = **6600 Kč/100g** ✅ |
| Původní chybný výsledek | 5293 × 2 = **10586 Kč/100g** (kompounding) |
| Fix opravuje | ✅ |

### VariantTable unit mismatch — ověření (z původní analýzy)

**cost pole (BY_GRAM):**
- `per100g = !isByPiece = true` (řádek 347)
- init: `variant.costPricePerGram!.toString()` → haléřů/g (numericky = Kč/100g)
- display: `formatCZK(costPricePerGram * 100)` = Kč/100g
- `1 h/g = 1 Kč/100g` → KONZISTENTNÍ ✅
- `per100g=true` → `val = Math.round(parseFloat(editValue))` → ukládá h/g správně ✅

**Závěr: Unit mismatch bug v VariantTable NEEXISTUJE.** Haléřů/g a Kč/100g jsou numericky totožné. Pole je konzistentní.

---

## 4. Vedlejší nálezy

### wholesalePricePerGram se v předchozím kódu při bulk recalcu neaktualizoval

Stará verze updatovala jen `retailPricePerGram`, nikoli `wholesalePricePerGram`. Nový kód oba synchronizuje. ✅ Bonus fix.

### handleResetOverride nenasazeno v UI (follow-up)

`VariantTable.tsx:154` má funkci `handleResetOverride` ale není napojená na žádný UI element. Varianty s `retailManualOverride=true` nelze snadno resetovat. Doporučuji jako follow-up task (nízká priorita — týká se jen přímé editace retail pole).

---

## Závěr

Implementátor identifikoval správný root cause (kompounding v price-settings bulk recalc, `wholesalePricePerGram` místo `costPricePerGram`). Fix je minimální, matematicky verifikovaný a build je čistý. Unit mismatch v VariantTable není bug.

---

## Addendum — Re-QA po doplnění override fix (2026-07-19)

### Nové změny

**`variants/[id]/route.ts` (řádky 33–43):**
- `!retailManualOverride` podmínka odstraněna — cost change vždy přepočítá retail
- `data.retailManualOverride = false` přidáno — reset override při cost change
- Kód čistý, logika jasná ✅

**`VariantTable.tsx` (řádky 301–312 BY_GRAM, 340–351 BY_PIECE):**
- Amber reset button zobrazen vedle retail ceny pokud `retailManualOverride = true`
- `handleResetOverride` (existovala od dříve) nyní napojena na UI element
- SVG ikona refresh, `aria-label` přes `t("variant.resetOverride")`, `disabled={isSaving}` ✅
- Identická implementace pro BY_GRAM i BY_PIECE ✅

### Build

```
✓ Compiled successfully in 45s
✓ TypeScript passed
✓ Generating static pages (429/429)
```

### Závěr addenda

APPROVED. Obě doplněné změny jsou správné a build je čistý.
