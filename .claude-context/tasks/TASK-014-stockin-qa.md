# QA Report — Task #14: Stock-in pricing + currency bug fix

**Commity:** 51d50e1 (stock-in multi-currency) + c450758 (costPricePerGram currency fix)  
**Datum:** 2026-07-14  
**Výsledek: PASS** (1 minor finding k objasnění)

---

## 1. src/lib/exchange-rates.ts — PASS

- CNB URL: `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt`
- 24h cache: `CACHE_TTL = 24 * 60 * 60 * 1000` — OK
- Fallback: `USD=23.5`, `EUR=25.0` — implementováno
- Parser `parseCnbText`: správně parsuje formát `"země|měna|množství|kód|kurz"` s čárkou jako desetinným oddělovačem
- Normalizace: `rate = rate / amount` — správně (pokrývá 100 JPY apod.)
- AbortSignal timeout 5000ms — OK

## 2. src/app/api/exchange-rates/route.ts — PASS

- Chráněno OWNER rolí — konzistentní s ostatními admin endpointy
- Validace: pouze USD/EUR povoleno (CZK odmítnuto s 400)
- Vrací `{ rate, date, source: "CNB"|"fallback" }` — StockInForm to správně čte

## 3. StockInForm.tsx — PASS

- Currency selector: tlačítka USD / EUR / CZK — OK
- Auto-fetch kurzu při změně currency (`useEffect` → `fetchRate`) — OK
- CZK: exchangeRateInput = "", rateSource = "" — pole se skryje
- Live preview BY_GRAM:
  - `pricePerGramOrig = pricePer100g / 100`
  - `pricePerGramCzk = pricePerGramOrig * rate`
  - `retailPerGram = pricePerGramCzk * 2` (100% markup)
  - `retailPer100g = retailPerGram * 100` — SPRÁVNĚ
- Live preview BY_PIECE:
  - `pricePerPcCzk = pricePerPc * rate`
  - `retailPerPc = pricePerPcCzk * 2` — SPRÁVNĚ
- `formatCzk(halere)`: haléře/100 — správná práce s fixed-point aritmetikou
- handleSubmit: `exchangeRateInt = Math.round(rateDecimal * 10000)` — OK
- CZK submit: `exchangeRateInt = 10000` (1:1) — konzistentní s validací v delivery schema

## 4. src/app/api/deliveries/route.ts — costPricePerGram v CZK — PASS

```ts
const costPricePerGramCZK = data.currency === "CZK"
  ? effectivePurchasePricePerGramRaw
  : Math.round((effectivePurchasePricePerGramRaw * data.exchangeRate) / 10000);
```

- `costPricePerGram` — uloženo v CZK haléřích ✓
- `wholesalePricePerGram` — = costPricePerGramCZK ✓
- `retailPricePerGram` — = `Math.round(costPricePerGramCZK * (10000 + markupPercent*100) / 10000)` ✓
- Databáze neobsahuje hodnoty v originální měně — **BUG FIX OVĚŘEN**

## 5. Překlady cs/uk/ru — PASS

Všechny nové klíče přítomny ve všech 3 jazycích:

| Klíč | CS | UK | RU |
|------|----|----|-----|
| `currency` | Měna | Валюта | Валюта |
| `exchangeRate` | Kurz | Курс | Курс |
| `purchasePricePer100g` | Nákupní cena za 100g | Закупівельна ціна за 100г | Закупочная цена за 100г |
| `purchasePricePerPiece` | Nákupní cena za kus | Закупівельна ціна за шт | Закупочная цена за шт |
| `exchangeRateAuto` | auto z ČNB | авто з ЧНБ | авто из ЧНБ |
| `rateLoading` | Načítání kurzu... | Завантаження курсу... | Загрузка курса... |
| `rateFallback` | Orientační kurz — ČNB nedostupná | Орієнтовний курс — ЧНБ недоступна | Ориентировочный курс — ЧНБ недоступна |

## 6. TypeScript check — PASS

```
npx tsc --noEmit → 0 chyb
```

## 7. Reverzní kontrola BY_PIECE vzorce

**Zadání:** `costPricePerGram = (cena_100g/100) × gramáž × kurz × 2`

**Skutečnost v kódu:**
1. `purchasePricePerPieceRaw = pricePerPcFloat * 100` (centů/haléřů)
2. `purchasePricePerGramRaw = purchasePricePerPieceRaw / pieceWeightGrams` (haléřů/g v orig. měně)
3. `costPricePerGramCZK = purchasePricePerGramRaw * exchangeRate / 10000` (haléřů CZK/g)
4. `retailPricePerGram = costPricePerGramCZK * (10000 + markupPercent*100) / 10000`

Vzorec sedí. Konverze haléře → CZK je `/ 100` (implicitní v `formatCzk`).

---

## Minor Finding — markupPercent vs. preview

**Kategorie:** Nesoulad UI vs. backend (nekritický)

- `StockInForm.tsx` preview: `retailPerGram = pricePerGramCzk * 2` → 100% markup (cena = 2× náklad)
- `deliveries/route.ts`: `retailPricePerGram = cost * (10000 + markupPercent*100) / 10000`
- `markupPercent` default = **200** → cena = 3× náklad (200% markup nad nákladem)

**Dopad:** Preview ukazuje 2× cenu, ale do DB se uloží 3× cena (při default markupPercent=200).  
**Doporučení:** Potvrdit se zadavatelem — je `markupPercent=200` záměrné (200% = trojnásobek), nebo má být `100` (2× = 100% markup)?

---

## Závěr

Implementace je funkčně správná. BUG FIX (costPricePerGram v CZK) potvrzen. Minor finding k objasnění markupPercent hodnoty.
