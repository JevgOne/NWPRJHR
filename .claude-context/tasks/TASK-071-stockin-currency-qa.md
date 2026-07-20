# QA Report — Stock-in multi-currency + currency bug fix

**Commity:** 51d50e1 (stock-in multi-currency) + c450758 (costPricePerGram currency fix)
**Datum QA:** 2026-07-14
**QA provedl:** Kontrolor

---

## ✅ Co je hotové a odpovídá zadání

### 1. exchange-rates.ts — ČNB API fetch, 24h cache, fallback

- `fetchCnbRates()` fetchuje ČNB denní kurzy z `www.cnb.cz/...denni_kurz.txt` ✅
- Parser správně čte formát `země|měna|množství|kód|kurz` s čárkou jako desetinnou oddělovačem ✅
- Normalizace kurzu: `rate = rate / amount` (pro měny jako HUF s amount=100) ✅
- 24h in-memory cache (`CACHE_TTL = 24 * 60 * 60 * 1000`) ✅
- Fallback hodnoty při selhání ČNB: USD=23.5, EUR=25.0 ✅
- Timeout 5s na fetch (`AbortSignal.timeout(5000)`) ✅

**API endpoint `/api/exchange-rates`:**
- Autorizace: pouze OWNER role ✅
- Validace currency: pouze USD/EUR ✅
- `source: "fallback"` nebo `"CNB"` v odpovědi ✅

### 2. StockInForm.tsx — currency selector, live preview, přepočet

- `CurrencyCode` typ: `"USD" | "EUR" | "CZK"` ✅
- Currency selector se 3 tlačítky (USD/$, EUR/€, CZK/Kč) ✅
- Exchange rate field skryt pro CZK ✅
- Auto-fetch kurzu při změně měny (via `/api/exchange-rates`) ✅
- Refresh tlačítko s loading animací ✅
- Zobrazení zdroje kurzu (CNB / fallback) ✅
- `PricePreview` kalkulace pro BY_GRAM: `pricePerGramCzk = (pricePer100g / 100) × rate` ✅
- `PricePreview` kalkulace pro BY_PIECE: `pricePerPcCzk = pricePerPc × rate` ✅

### 3. deliveries/route.ts — costPricePerGram v CZK (currency bug fix)

**Commit c450758 — klíčový fix:**
```
const costPricePerGramCZK = data.currency === "CZK"
  ? effectivePurchasePricePerGramRaw
  : Math.round((effectivePurchasePricePerGramRaw * data.exchangeRate) / 10000);
```
- Pro CZK: přímé použití raw hodnoty ✅
- Pro USD/EUR: `rawHalere × exchangeRate / 10000` → CZK halere ✅
- `costPricePerGram`, `wholesalePricePerGram`, `retailPricePerGram` všechny v CZK ✅
- exchangeRate uložen jako integer × 10000 (např. 23.5 → 235000) ✅

### 4. TypeScript

- `npx tsc --noEmit` → 0 chyb ✅

---

## ❌ Co chybí nebo neodpovídá

Nic fatálního chybí.

---

## ⚠️ Co potřebuje pozornost

### Nesoulad UI preview vs. backend retail výpočet

**UI preview (StockInForm.tsx:149):**
```js
const retailPerGram = pricePerGramCzk * 2;  // hardcoded ×2 = 100% markup
```

**Backend (deliveries/route.ts:139-140):**
```js
const markupPercent = priceSetting?.markupPercent ?? 200;  // default 200%
const retailPrice = Math.round(costPricePerGramCZK * (10000 + markupPercent * 100) / 10000);
// default: costPrice × 3 (200% přirážka = trojnásobek nákupní ceny)
```

**Problém:** Pokud markupPercent=200 (default), backend ukládá retail = cost×3, ale UI preview ukazuje cost×2. Uživatel vidí špatnou preview cenu. Pokud je v PriceSettings nastaven markupPercent=100 (100% přirážka = ×2), pak se shodují.

**Riziko:** Střední — závisí na hodnotě v PriceSettings. Nutno ověřit jaká hodnota je nastavena v produkci.

### BY_PIECE: pricePerPiece odesílán ve frontend jako CZK halere

Výpočet v handleSubmit (StockInForm:266-268):
```js
const costPerPieceCzk = Math.round((purchasePricePerPieceRaw * exchangeRateInt) / 10000);
```
Backend přijímá `pricePerPiece` jako CZK hodnotu — konzistentní ✅. Ale retail per piece (StockInForm:269: `costPerPieceCzk * 2`) také hardcoded ×2 vs. backend dynamický markup — stejný nesoulad jako výše.

---

## Verdikt

**Implementace SCHVÁLENA s výhradou** ✅⚠️

Core funkce jsou správně implementovány: ČNB fetch, 24h cache, fallback, currency konverze v backendu (costPricePerGram v CZK). Security OK (pouze OWNER přistupuje k exchange-rates API).

**Výhrada:** UI preview ukazuje retail s ×2 markup, backend ukládá dle PriceSettings (default ×3). Doporučuji sjednotit — buď UI preview načítat markupPercent z API, nebo hardcoded 100% markup nastavit i v PriceSettings pro konzistenci.
