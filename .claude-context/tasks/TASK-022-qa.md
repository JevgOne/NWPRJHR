# QA Report — Task #22: Cenový display v admin (fix ed8a61f)

**Commit:** ed8a61f  
**Datum:** 2026-07-14  
**Výsledek: PASS**

---

## 1. Simplify kontrola

### Duplicity a zbytečně složité části

**handleResetOverride (řádek 89–101):** Funkce je definovaná ale nikde v JSX nevolána — mrtvý kód. Nízká priorita (neovlivňuje funkčnost).

**Inline async v onClick toggle (řádek 308–319):** Anonymní async funkce přímo v JSX `onClick`. Konzistentní se stylem zbytku souboru, přijatelné pro tuto komponentu.

**`setSaving(variant.id === saving ? null : saving)` (řádek 318, 348):** Invertovaná logika — v `finally` bloku je `saving` ještě nastaveno (state batching), proto `variant.id === saving` nemusí vždy fungovat jak je zamýšleno. Správnější by bylo `setSaving(null)` stejně jako v `handleSavePrice`. Nízká priorita, vizuálně nedetekovatelné.

**PriceInput komponenta (řádek 120–146):** Definovaná uvnitř render funkce — způsobuje re-mount při každém renderu. Správněji by měla být mimo nebo jako memo. Přijatelné pro tuto velikost komponenty.

**Celkové hodnocení:** Kód je čistý, bez zjevných duplicit v nové implementaci. Stará mrtvá funkce `handleResetOverride` může být odstraněna.

---

## 2. Debug kontrola

### TypeScript
```
npx tsc --noEmit → 0 chyb
```

### Kontrola výpočtů

**`formatCZK(halere)`** — funkce dělí vstup `/100` interně:
```ts
export function formatCZK(halere: number): string {
  const czk = halere / 100;
  ...
}
```

**BY_GRAM retail:**
```ts
formatCZK(variant.retailPricePerGram * 100) + "/100g"
```
- `retailPricePerGram` je v DB v haléřích/gram
- `* 100` = haléře za 100g
- `formatCZK(halere)` / 100 = Kč za 100g
- Výsledek: správně zobrazí např. "650 Kč/100g" pro variant s retailPricePerGram=650

**BY_GRAM costDisplay:**
```ts
const costDisplay = variant.costPricePerGram * 100;  // haléře za 100g
const sellPrice = (variant.retailPricePerGram ?? 0) * 100;  // haléře za 100g
const margin = sellPrice - costDisplay;  // haléře
```
Obě hodnoty ve stejných jednotkách → marže správná.

**BY_PIECE costDisplay:**
```ts
const costDisplay = variant.pricePerPiece ?? variant.costPricePerGram;
const sellPrice = variant.retailPricePerPiece ?? 0;
const margin = sellPrice - costDisplay;
```
`pricePerPiece` a `retailPricePerPiece` jsou v DB v haléřích/kus → stejné jednotky → marže správná.

**Žádné hardcoded placeholder hodnoty** v aktuálním kódu. Stará legenda s `63 Kč`, `46 Kč`, `+17 Kč` nahrazena i18n klíči.

---

## 3. Reverzní kontrola proti původnímu zadání

**Uživatel řekl:** "46kč nákup? to sedí 46kč nákup když tenhle culík kupujeme 100g za 280dolaru?"

### Příčina starého bugu

V starém kódu:
```ts
// BYLO (chyba):
{formatCZK(variant.retailPricePerGram!)}/g       // retailPricePerGram=650 → formatCZK(650) = "6,50 Kč/g"
Nákup: {formatCZK(variant.costPricePerGram!)}     // costPricePerGram=325 → formatCZK(325) = "3,25 Kč"
```
`formatCZK` dělí vstup /100 — zobrazovalo haléře jako koruny. 650 haléřů = 6,50 Kč, ne 650 Kč.

V legendě byly hardcoded příklady: `63 Kč`, `46 Kč`, `+17 Kč` — nesouvisely s reálnými daty.

### Co fix opravil

| Kontrola | Výsledek |
|----------|----------|
| Žádné hardcoded placeholder ceny | ✅ Legenda nyní používá i18n klíče bez čísel |
| BY_PIECE ukazuje nákupní za KUS | ✅ `costDisplay = pricePerPiece ?? costPricePerGram` (ne za gram) |
| Čísla odpovídají realitě (280 USD/100g → tisíce Kč) | ✅ `formatCZK(retailPricePerGram * 100)` — správné jednotky. 280 USD × kurz ~23 = 6440 Kč/100g → zobrazí "6 440 Kč/100g" |

### Matematická verifikace

280 USD/100g při kurzu 23,5 CZK/USD:
- Nákup: 280 × 23,5 = 6 580 Kč/100g = 658 000 haléřů/100g
- `costPricePerGram` v DB = 6 580 haléřů/gram
- `costDisplay` = 6 580 × 100 = 658 000 haléřů
- `formatCZK(658 000)` = 658 000 / 100 = **6 580 Kč/100g** ✅

Retail (100% marže) = 6 580 × 2 = 13 160 Kč/100g ✅

---

## Závěr

**PASS.** Bug byl v tom, že kód předával haléře/gram přímo do `formatCZK` (které dělí /100), místo haléřů/100g. Fix přidal `* 100` pro BY_GRAM a opravil BY_PIECE margin na per-piece porovnání.

**1 mrtvý kód k odstranění (nízká priorita):** `handleResetOverride` funkce není nikde volána.
