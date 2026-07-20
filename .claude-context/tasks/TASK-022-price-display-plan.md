# TASK-022: Cenový display v admin — špatné čísla pro BY_PIECE

**Status:** HOTOVO (analýza + plán)
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Shrnutí problému

Na admin product detail page se dole ukazuje:
- "63 Kč = prodejní, Nákup: 46 Kč = nákupní, +17 Kč = marže"

Uživatel si myslí, že to jsou reálné ceny jeho produktu (nákup 280 USD/100g). Ale prodejní cena varianty ukazuje "10 016 Kč/ks" (správně), zatímco "Nákup: 60 Kč" (špatně).

---

## Nalezené problémy

### Bug 1: HARDCODED LEGENDA (hlavní zdroj zmätku)

**Soubor:** `src/components/products/VariantTable.tsx` řádky 370-373

```typescript
{/* Legend */}
{isOwner && (
  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-line/50 text-[10px] text-muted">
    <span><strong className="text-ink">63 Kč</strong> = prodejní</span>
    <span>Nákup: 46 Kč = nákupní</span>
    <span className="text-emerald-600">+17 Kč = marže</span>
    <span>Klikni na cenu pro úpravu</span>
  </div>
)}
```

**Problém:** Text "63 Kč", "46 Kč", "+17 Kč" jsou **staticky hardcoded** příklady v legendě. Nemají žádný vztah k reálným cenám produktu. Uživatel je ale vidí pod tabulkou variant a myslí si, že to jsou skutečné ceny.

**Fix:** Nahradit hardcoded čísla za popis bez konkrétních částek, nebo legendu úplně odstranit (UI je self-explanatory — tučná cena = prodejní, malý text "Nákup:" = nákupní, zelené číslo = marže).

```typescript
{isOwner && (
  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-line/50 text-[10px] text-muted">
    <span><strong className="text-ink">Tučně</strong> = prodejní cena</span>
    <span>Nákup: = nákupní cena</span>
    <span className="text-emerald-600">+XX = marže</span>
    <span>Klikni na cenu pro úpravu</span>
  </div>
)}
```

### Bug 2: CHYBNÁ MARŽE PRO BY_PIECE — srovnání per-piece vs per-gram

**Soubor:** `src/components/products/VariantTable.tsx` řádky 244-276

```typescript
const sellPrice = isByPiece
  ? (variant.retailPricePerPiece ?? 0)    // PER PIECE v haléřích (např. 1001600)
  : (variant.retailPricePerGram ?? 0);     // PER GRAM v haléřích
const margin = sellPrice - variant.costPricePerGram;  // costPricePerGram je PER GRAM!
```

**Problém:** Pro BY_PIECE produkty:
- `sellPrice` = `retailPricePerPiece` (cena za **kus**, např. 1001600 haléřů = 10 016 Kč/ks)
- `variant.costPricePerGram` = nákupní cena za **gram** (např. 6080 haléřů = 60.80 Kč/g)
- `margin = 1001600 - 6080 = 995520` — nesmyslné číslo (porovnává kusy s gramy!)

**Ale:** Zobrazení nákupní ceny na řádku 266 je `formatCZK(variant.costPricePerGram!)` = "61 Kč". To je správná nákupní cena **za gram** (60.80 Kč/g → zaokrouhleno na 61 Kč). Ale uživatel vidí vedle prodejní ceny za KUS (10 016 Kč/ks) nákupní cenu za GRAM (61 Kč) — to je matoucí.

**Root cause:** Variant model nemá `costPricePerPiece`. Má jen `costPricePerGram`. Pro BY_PIECE produkty je potřeba buď:
a) Zobrazit nákupní cenu per piece: `costPricePerGram × pieceWeightGrams`
b) Zobrazit obě: per-gram i per-piece

**Problém:** `pieceWeightGrams` je na **Delivery** modelu, ne na **Variant**! Variant nemá informaci o váze kusu.

### Datový model — co kde je

```
Variant model:
  costPricePerGram      Int     — nákupní cena za GRAM (CZK haléře)
  wholesalePricePerGram Int     — velkoobchodní za GRAM
  retailPricePerGram    Int     — prodejní za GRAM
  sellingMode           String  — "BY_GRAM" | "BY_PIECE"
  pricePerPiece         Int?    — wholesale za KUS (CZK haléře)
  retailPricePerPiece   Int?    — prodejní za KUS (CZK haléře)
  -- CHYBÍ: costPricePerPiece, pieceWeightGrams

Delivery model:
  pieceWeightGrams      Int?    — váha kusu v gramech
  purchasePricePerGramRaw Int   — nákup za gram v orig. měně
  purchasePricePerGramCZK Int   — nákup za gram v CZK haléřích
```

### Příklad s reálnými čísly

```
Naskladnění: $280/100g, culík 80g, kurz 23 CZK/USD

costPricePerGram = (280/100) × 23 × 100 = 6440 haléřů = 64.40 Kč/g
retailPricePerGram = 6440 × 2 = 12880 haléřů = 128.80 Kč/g

pricePerPiece (wholesale) = costPricePerGram × 80 = 6440 × 80 = 515200 haléřů = 5152 Kč/ks
retailPricePerPiece = pricePerPiece × 2 = 1030400 haléřů = 10304 Kč/ks

Co uživatel vidí na admin page:
  Prodejní: 10 304 Kč/ks  ← SPRÁVNĚ (retailPricePerPiece)
  Nákup: 64 Kč            ← ŠPATNĚ zobrazeno (costPricePerGram = per gram, ne per piece)
  Marže: +10 240 Kč       ← ŠPATNĚ (10304 - 64.40 = 10239.60, srovnání kus vs gram)
```

Co by uživatel MĚL vidět:
```
  Prodejní: 10 304 Kč/ks
  Nákup: 5 152 Kč/ks      ← per piece nákupní
  Marže: +5 152 Kč/ks     ← správná marže
```

---

## Navrhované řešení

### Fix 1: Odstranit hardcoded legendu (2 min)

Řádky 370-373 — nahradit za popis bez konkrétních částek:

```typescript
{isOwner && (
  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-line/50 text-[10px] text-muted">
    <span><strong className="text-ink">Tučně</strong> = prodejní</span>
    <span>Nákup = nákupní</span>
    <span className="text-emerald-600">+marže</span>
    <span>Klikni na cenu pro úpravu</span>
  </div>
)}
```

### Fix 2: BY_PIECE — zobrazit nákup a marži per piece (10 min)

Řádky 244-276 — opravit kalkulaci pro BY_PIECE:

**Současný kód:**
```typescript
const sellPrice = isByPiece
  ? (variant.retailPricePerPiece ?? 0)
  : (variant.retailPricePerGram ?? 0);
const margin = sellPrice - variant.costPricePerGram;  // BUG: per-piece vs per-gram
```

**Opravený kód:**
```typescript
const costDisplay = isByPiece
  ? (variant.pricePerPiece ?? variant.costPricePerGram)  // wholesale per piece (or fallback to per gram)
  : variant.costPricePerGram;
const sellPrice = isByPiece
  ? (variant.retailPricePerPiece ?? 0)
  : (variant.retailPricePerGram ?? 0);
const margin = sellPrice - costDisplay;
```

A zobrazení na řádku 266:
```typescript
// Před:
Nákup: {formatCZK(variant.costPricePerGram!)}

// Po:
Nákup: {formatCZK(costDisplay)}
```

**Proč `variant.pricePerPiece`?**
- Při vytvoření varianty v `deliveries/route.ts` řádek 151: `pricePerPiece: isByPiece ? data.pricePerPiece : undefined`
- `data.pricePerPiece` = `costPerPieceCzk` = wholesale cena za kus v CZK haléřích
- To je efektivně "nákupní cena za kus" (= costPricePerGram × pieceWeight)
- Pro BY_PIECE toto je správná nákupní cena za kus

**Fallback:** Pokud `pricePerPiece` je null (starší varianty), použít `costPricePerGram` (per gram). Není ideální, ale lepší než nic.

### Fix 3: Jednotky v zobrazení (5 min)

Přidat "/ks" suffix k nákupní ceně pro BY_PIECE:

```typescript
// Řádek 266:
Nákup: {formatCZK(costDisplay)}{isByPiece ? "/ks" : "/g"}
```

A k marži:
```typescript
// Řádek 272:
+{formatCZK(margin)}{isByPiece ? "/ks" : "/g"}
```

### Fix 4: PriceInput pro cost BY_PIECE (nice-to-have)

Editace nákupní ceny (`cost-${cellKey}`) by pro BY_PIECE měla ukládat do `pricePerPiece` místo `costPricePerGram`. Ale to je složitější — vyžaduje přidat logiku do handleSavePrice. Doporučuji nechat na později.

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/components/products/VariantTable.tsx` řádky 370-373 | Odstranit hardcoded legendu s čísly |
| 2 | `src/components/products/VariantTable.tsx` řádky 244-276 | Fix BY_PIECE: nákupní cena + marže per piece místo per gram |

**Žádné API/DB změny** — vše je frontend-only.

---

## Odhad: ~20 minut
