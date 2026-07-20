# TASK-010: Naskladnění — nákupní cena za 100g v USD/EUR, prodej v CZK

**Status:** HOTOVO (plán) — AKTUALIZOVÁNO s potvrzenými vzorci
**Autor:** Plánovač
**Datum:** 2026-07-14 (update: 2026-07-14)

---

## Shrnutí problému

Uživatel zadává nákupní cenu vlasů v **USD nebo EUR** (nakupuje ze zahraničí), ale prodává v **CZK**. Současný stock-in wizard:
- Má pole "Nákupní cena" v Kč/gram — to je špatná jednotka i měna
- Backend `Delivery` model **už podporuje** multi-currency (pole `currency`, `exchangeRate`, `purchasePricePerGramRaw`) a přepočet na CZK
- Frontend `StockInForm.tsx` ale hardcoduje `currency: "CZK"` a `exchangeRate: 10000`
- Cena se zadává za 1 gram — uživatel chce za **100g** (přirozenější jednotka pro hair business)

## Analýza současného stavu

### Co už funguje (backend)

| Soubor | Co dělá |
|--------|---------|
| `prisma/schema.prisma:229` | `enum Currency { CZK USD EUR UAH }` — 4 měny |
| `prisma/schema.prisma:274-315` | `Delivery` model — má `purchasePricePerGramRaw`, `currency`, `exchangeRate`, `purchasePricePerGramCZK` |
| `src/lib/stock-in.ts:33-38` | Přepočet: `purchasePricePerGramCZK = raw * exchangeRate / 10000` |
| `src/lib/validations/delivery.ts:8` | `currency: z.enum(["CZK", "USD", "EUR", "UAH"])` — validace OK |
| `src/lib/validations/delivery.ts:9` | `exchangeRate: z.number().int().positive()` — validace OK |
| `src/lib/validations/delivery.ts:26-30` | Refine: pro CZK musí být rate 10000 |
| `src/app/api/deliveries/route.ts` | POST handler přijímá currency + exchangeRate |
| `src/app/(app)/inventory/deliveries/[id]/DeliveryDetailClient.tsx:152-166` | Zobrazuje raw cenu + currency pokud != CZK |

### Co je rozbité (frontend StockInForm)

| Řádek | Problém |
|-------|---------|
| `StockInForm.tsx:50` | `purchasePricePerPieceCzk` — název napovídá CZK only |
| `StockInForm.tsx:163-165` | `purchasePricePerGramRaw` vždy posílá `parseFloat(purchasePrice) * 100` — předpokládá CZK |
| `StockInForm.tsx:166` | Hardcoded `currency: "CZK" as const` |
| `StockInForm.tsx:167` | Hardcoded `exchangeRate: 10000` |
| `StockInForm.tsx:631` | Label: `"Kč/gram"` — špatná měna i jednotka |

### Cenový řetězec (tok dat)

```
Nákup (USD/EUR za 100g)
  ↓ ÷ 100 = cena za 1g v orig. měně (halere)
  ↓ × exchangeRate / 10000 = purchasePricePerGramCZK
  ↓
Variant.costPricePerGram = purchasePricePerGramCZK
Variant.wholesalePricePerGram = costPricePerGram (B2B velkoobchod)
Variant.retailPricePerGram = wholesalePricePerGram × (1 + markupPercent/100)
  ↓
SalePrice: retail (100%) nebo B2B se slevou z marže
```

### Jednotky a zaokrouhlování

- **Všechny ceny v DB jsou v haléřích** (Int, 1 CZK = 100 haléřů)
- `purchasePricePerGramRaw` = cena za 1g v haléřích originální měny
- `exchangeRate` = kurz × 10000 (pro přesnost bez float), tzn. 1 USD = 23.50 CZK → exchangeRate = 235000
- `purchasePricePerGramCZK` = raw × exchangeRate / 10000

## Navrhované řešení

### Princip: Cena za 100g + automatický kurz + marže 100%

**POTVRZENÝ VZOREC (uživatelem schváleno 2026-07-14):**

#### BY_GRAM (metráž — raw vlasy na gramy):
Uživatel zadá: **nákupní cenu za 100g v USD/EUR**
```
Prodejní cena za gram CZK = (cena_100g / 100) × kurz_CZK × 2
```

#### BY_PIECE (culíky — hotové kusy):
Uživatel zadá: **nákupní cenu za 100g v USD/EUR** + **gramáž culíku** (80g, 150g, libovolná)
```
Prodejní cena za kus CZK = (cena_100g / 100) × gramáž_culíku × kurz_CZK × 2
```

#### Kurz:
- **Automaticky z ČNB API** — BEZ manuálního zadání
- Uživatel kurz nevidí ani needituje, systém ho stahuje sám

#### Kde je marže:
- Faktor `× 2` = marže 100% (prodejní = 2× nákupní v CZK)
- Marže se bere z `PriceSettings.markupPercent` (100 = ×2, 200 = ×3 atd.)
- Ve vzorci výše zjednodušeno jako `× 2` protože aktuální marže je 100%

#### Ověřovací příklad (potvrzený uživatelem):
```
Vstup: $120 / 100g, culík 80g, kurz 23 CZK/USD

BY_GRAM:
  (120 / 100) × 23 × 2 = 1.20 × 23 × 2 = 55.20 Kč/g retail

BY_PIECE:
  Nákup kusu: (120 / 100) × 80 = $96
  V CZK: $96 × 23 = 2 208 Kč (nákupní)
  Retail: 2 208 × 2 = 4 416 Kč/kus

  Nebo jedním vzorcem:
  (120 / 100) × 80 × 23 × 2 = 4 416 Kč/kus
```

Uživatel zadá:
1. **Měnu**: USD / EUR / CZK (dropdown, default USD)
2. **Nákupní cenu za 100g** v dané měně (celé číslo nebo 2 des. místa)
3. **Gramáž kusu** (jen pro BY_PIECE mode) — v gramech (80, 100, 150...)

Systém automaticky:
- Stáhne aktuální kurz z ČNB
- Přepočítá na cenu za 1g v CZK
- Nastaví `costPricePerGram`, `wholesalePricePerGram` (= nákupní v CZK haléřích)
- Vypočítá `retailPricePerGram` z PriceSettings markupu (×2 při 100%)
- Pro BY_PIECE: `retailPricePerPiece = retailPricePerGram × gramáž`

### Změny po souborech

---

#### 1. `src/components/inventory/StockInForm.tsx` — HLAVNÍ ZMĚNA

**Nové state proměnné:**
```typescript
const [currency, setCurrency] = useState<"USD" | "EUR" | "CZK">("USD");
const [purchasePricePer100g, setPurchasePricePer100g] = useState("");
const [pieceWeightGrams, setPieceWeightGrams] = useState(""); // jen BY_PIECE
const [autoRate, setAutoRate] = useState<number | null>(null);
const [rateLoading, setRateLoading] = useState(false);
```

**Odstranit:**
- `purchasePrice` (nahrazeno `purchasePricePer100g`)
- `purchasePricePerPieceCzk` — ODSTRANĚNO, BY_PIECE nyní počítá z ceny za 100g × gramáž
- `exchangeRateInput` — NENÍ POTŘEBA, kurz je jen automatický (bez manuálního override)

**Nový blok v sekci "Details" (section-details):**

Nahradit stávající `purchasePrice` input za:

**BY_GRAM mode:**
```
┌─────────────────────────────────────────────────┐
│ Nákupní cena                                     │
│                                                   │
│ Měna: [USD ▼]  [EUR]  [CZK]                     │
│                                                   │
│ Cena za 100g: [_____] USD                        │
│                                                   │
│ ── Přepočet (kurz: 23.00 CZK/USD z ČNB) ────   │
│ Nákup: 1.20 USD/g = 27.60 Kč/g                  │
│ Prodejní cena: 55.20 Kč/g (marže 100%)          │
│ Za 100g retail: 5 520 Kč                         │
└─────────────────────────────────────────────────┘
```

**BY_PIECE mode:**
```
┌─────────────────────────────────────────────────┐
│ Nákupní cena                                     │
│                                                   │
│ Měna: [USD ▼]  [EUR]  [CZK]                     │
│                                                   │
│ Cena za 100g: [_____] USD                        │
│ Gramáž kusu:  [_____] g                          │
│                                                   │
│ ── Přepočet (kurz: 23.00 CZK/USD z ČNB) ────   │
│ Nákup kusu (80g): $96.00 = 2 208 Kč             │
│ Prodejní cena: 4 416 Kč/kus (marže 100%)        │
└─────────────────────────────────────────────────┘
```

**POZN:** Kurz se zobrazuje jen jako info text (ne jako editovatelné pole).
Automaticky se stahuje z ČNB při změně měny. Uživatel ho nemůže přepsat.

**Přepočet v handleSubmit:**

```typescript
// Kurz z ČNB (auto-fetched, uložený ve state)
const rateDecimal = autoRate!; // např. 23.00
const exchangeRateInt = Math.round(rateDecimal * 10000); // 230000

// Cena za 100g → cena za 1g v haléřích originální měny
const pricePer100gInCents = Math.round(parseFloat(purchasePricePer100g) * 100);
const pricePerGramRaw = Math.round(pricePer100gInCents / 100); // haléře/centy za gram

if (sellingMode === "BY_GRAM") {
  // Body to send:
  const body = {
    ...otherFields,
    purchasePricePerGramRaw: pricePerGramRaw,
    currency: currency,
    exchangeRate: currency === "CZK" ? 10000 : exchangeRateInt,
  };
}

if (sellingMode === "BY_PIECE") {
  // Nákup kusu = (cena_100g / 100) × gramáž v orig. měně
  const weightG = parseInt(pieceWeightGrams);
  const purchasePricePerPieceRaw = Math.round(pricePer100gInCents / 100 * weightG);
  // → purchasePricePerPieceRaw v haléřích/centech orig. měny
  
  const body = {
    ...otherFields,
    purchasePricePerGramRaw: pricePerGramRaw, // stále za gram (pro Delivery model)
    purchasePricePerPiece: purchasePricePerPieceRaw, // za kus v orig. měně
    pieceWeightGrams: weightG,
    currency: currency,
    exchangeRate: currency === "CZK" ? 10000 : exchangeRateInt,
  };
}
```

**Auto-fetch kurzu z ČNB:**
- Volat nový API endpoint `/api/exchange-rates` při změně měny
- Kurz se stahuje **automaticky** — uživatel ho **nemůže přepsat**
- Zobrazit kurz jen jako informační text: "kurz: 23.00 CZK/USD z ČNB"

**Live preview přepočtu:**
- BY_GRAM: "Nákup: X.XX USD/g = Y.YY Kč/g → Prodej: Z.ZZ Kč/g (marže 100%)"
- BY_PIECE: "Nákup kusu (80g): $96 = 2 208 Kč → Prodej: 4 416 Kč/kus"

---

#### 2. Nový soubor: `src/app/api/exchange-rates/route.ts`

API endpoint pro auto-fetch kurzu z ČNB (Česká národní banka).

```typescript
// GET /api/exchange-rates?currency=USD
// Returns: { rate: 23.45, date: "2026-07-14", source: "CNB" }

// ČNB API: https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt
// Format: country|currency|amount|code|rate
// Např: USA|dolar|1|USD|23,456

// Fallback: hardcoded approximate rates pokud ČNB API selže
```

**Caching:** In-memory cache, 24h TTL (kurzy se mění 1× denně).

**Auth:** Requires OWNER role (sensitive financial data).

---

#### 3. `src/lib/exchange-rates.ts` — nový helper

```typescript
interface ExchangeRate {
  code: string;     // "USD", "EUR"
  rate: number;     // 23.456 (CZK per 1 unit)
  amount: number;   // 1 (always 1 for USD/EUR)
  date: string;     // "2026-07-14"
}

// In-memory cache
let cachedRates: Map<string, ExchangeRate> | null = null;
let cachedAt: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export async function getExchangeRate(currency: "USD" | "EUR"): Promise<ExchangeRate | null>
export async function fetchCnbRates(): Promise<Map<string, ExchangeRate>>
```

---

#### 4. `src/components/inventory/StockInForm.tsx` — BY_PIECE mode (AKTUALIZOVÁNO)

**ZMĚNA:** Pro BY_PIECE uživatel **NEZADÁVÁ cenu za kus**. Zadává:
1. **Cenu za 100g** (stejný input jako BY_GRAM — sdílený)
2. **Gramáž kusu** (nový input, jen pro BY_PIECE) — např. 80g, 150g

Systém automaticky spočítá cenu kusu:
```
nákup_kusu = (cena_100g / 100) × gramáž
nákup_kusu_CZK = nákup_kusu × kurz_CZK
prodej_kusu = nákup_kusu_CZK × 2
```

**State proměnné:**
```
purchasePricePer100g — SDÍLENÁ s BY_GRAM (cena za 100g v orig. měně)
pieceWeightGrams — NOVÁ (jen pro BY_PIECE, gramáž kusu)
```

**Odstranit:**
- `purchasePricePerPieceCzk` — nepotřeba, počítá se automaticky
- Uživatel nikdy nezadává cenu za kus — vždy zadává za 100g + gramáž

**Preview:**
```
Cena za 100g: $120 USD
Gramáž kusu: 80g
───────────────────
Nákup kusu: $96.00 = 2 208 Kč
Prodej kusu: 4 416 Kč (marže 100%)
```

---

#### 5. `src/components/products/VariantBatchCreate.tsx` — NEMĚNIT

Tento formulář slouží k ručnímu vytvoření variant s cenami v CZK. Nákupní cenu tam uživatel zadává už přepočítanou. **Není potřeba měnit** — stock-in wizard je hlavní vstupní bod.

---

#### 6. Překlady — `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Nové klíče v namespace `stock`:

```json
{
  "stock": {
    "currency": "Měna",
    "selectCurrency": "Vyberte měnu",
    "purchasePricePer100g": "Nákupní cena za 100g",
    "pieceWeight": "Gramáž kusu",
    "pieceWeightPlaceholder": "např. 80",
    "exchangeRateInfo": "Kurz: {rate} CZK/{currency} (ČNB, {date})",
    "exchangeRateUnavailable": "Kurz nedostupný — zkuste to později",
    "rateLoading": "Načítání kurzu...",
    "pricePreview": "Přepočet",
    "purchasePerGram": "Nákup: {priceOrig} {currency}/g = {priceCzk} Kč/g",
    "purchasePerPiece": "Nákup kusu ({weight}g): {priceOrig} = {priceCzk} Kč",
    "retailPreview": "Prodej: {price} Kč/{unit} (marže {margin}%)",
    "retailPer100g": "Za 100g retail: {price} Kč",
    "margin": "Marže"
  }
}
```

Ekvivalentní klíče do uk.json a ru.json.

---

## Soubory k úpravě (souhrn)

| # | Soubor | Typ změny |
|---|--------|-----------|
| 1 | `src/components/inventory/StockInForm.tsx` | VELKÁ — currency selector, price per 100g, auto ČNB rate (read-only), gramáž kusu (BY_PIECE), live preview |
| 2 | `src/app/api/exchange-rates/route.ts` | NOVÝ — ČNB API proxy |
| 3 | `src/lib/exchange-rates.ts` | NOVÝ — rate fetching + caching |
| 4 | `messages/cs.json` | Nové klíče v `stock` namespace |
| 5 | `messages/uk.json` | Nové klíče v `stock` namespace |
| 6 | `messages/ru.json` | Nové klíče v `stock` namespace |

**Soubory které se NEMĚNÍ** (backend je hotový):
- `prisma/schema.prisma` — `Currency` enum, `Delivery` model už podporují multi-currency
- `src/lib/stock-in.ts` — přepočet `purchasePricePerGramRaw * exchangeRate / 10000` funguje
- `src/lib/validations/delivery.ts` — validace currency + exchangeRate funguje
- `src/app/api/deliveries/route.ts` — POST handler přijímá currency + exchangeRate
- `src/lib/pricing.ts` — retail kalkulace z wholesale nezávisí na měně
- `src/lib/sale-pricing.ts` — prodejní ceny jsou vždy v CZK

---

## Implementační pořadí

### Krok 1: Exchange rate helper (30 min)
- Vytvořit `src/lib/exchange-rates.ts`
- Implementovat ČNB API fetch + in-memory cache (24h TTL)
- Fallback rates pro offline

### Krok 2: Exchange rate API endpoint (15 min)
- Vytvořit `src/app/api/exchange-rates/route.ts`
- GET `?currency=USD` → `{ rate: 23.45, date: "..." }`
- Auth: OWNER only

### Krok 3: Překlady (10 min)
- Přidat nové klíče do `messages/cs.json`, `uk.json`, `ru.json`

### Krok 4: StockInForm — BY_GRAM mode (45 min)
- Přidat currency selector (USD/EUR/CZK toggle buttons, styl jako selling mode)
- Změnit purchase price input: label "Cena za 100g" + suffix s měnou
- Zobrazit kurz jako info text (ne jako input!) — auto z ČNB
- Přidat live preview přepočtu s potvrzenými vzorci
- Upravit handleSubmit: přepočet z 100g→1g, správný currency+exchangeRate

### Krok 5: StockInForm — BY_PIECE mode (20 min)
- Sdílený input "Cena za 100g" s BY_GRAM (stejný state)
- Nový input "Gramáž kusu" (v gramech) — jen pro BY_PIECE
- Odstranit starý `purchasePricePerPieceCzk` input
- Preview: "Nákup kusu (80g): $96 = 2 208 Kč → Prodej: 4 416 Kč/kus"

### Krok 6: Test (15 min)
- Stock-in v USD BY_GRAM → ověřit Delivery má správný currency, exchangeRate, purchasePricePerGramCZK
- Stock-in v EUR BY_PIECE → ověřit přepočet
- Stock-in v CZK → ověřit exchangeRate = 10000 (backward compatible)
- Delivery detail page zobrazuje raw cenu + currency

---

## Přepočtové vzorce (POTVRZENÉ UŽIVATELEM)

### BY_GRAM: Uživatel zadá "$120 za 100g" (potvrzený příklad)

```
input: $120 / 100g
kurz: 23.00 CZK/USD (auto z ČNB)

VZOREC: (cena_100g / 100) × kurz_CZK × 2

1. Cena za 1g v orig. měně:
   $120 / 100 = $1.20/g

2. V haléřích/centech:
   1.20 * 100 = 120 centů/g
   → purchasePricePerGramRaw = 120

3. exchangeRate = 23.00 * 10000 = 230000

4. purchasePricePerGramCZK = 120 * 230000 / 10000 = 2760 haléřů = 27.60 Kč/g

5. costPricePerGram = 2760
6. wholesalePricePerGram = 2760
7. retailPricePerGram = 2760 * 2 = 5520 haléřů = 55.20 Kč/g

Ověření vzorcem: (120 / 100) × 23 × 2 = 55.20 Kč/g ✓
```

### BY_PIECE: Uživatel zadá "$120 za 100g, culík 80g" (potvrzený příklad)

```
input: $120 / 100g, gramáž kusu = 80g
kurz: 23.00 CZK/USD (auto z ČNB)

VZOREC: (cena_100g / 100) × gramáž_culíku × kurz_CZK × 2

1. Cena za 1g v orig. měně:
   $120 / 100 = $1.20/g

2. Nákup kusu v orig. měně:
   $1.20 × 80g = $96.00

3. Nákup kusu v CZK:
   $96.00 × 23.00 = 2 208 Kč

4. Prodej kusu (marže 100%):
   2 208 × 2 = 4 416 Kč/kus

Ověření vzorcem: (120 / 100) × 80 × 23 × 2 = 4 416 Kč/kus ✓

Interní hodnoty:
   purchasePricePerGramRaw = 120 centů/g
   exchangeRate = 230000
   purchasePricePerGramCZK = 2760 haléřů/g
   costPricePerGram = 2760
   wholesalePricePerGram = 2760
   retailPricePerGram = 5520 haléřů/g (= 55.20 Kč/g)
   retailPricePerPiece = 5520 × 80 = 441600 haléřů = 4 416 Kč/kus
```

---

## UX design

### Currency selector (3 tlačítka, styl = selling mode)

```
[  $  USD  ]  [  €  EUR  ]  [  Kč  CZK  ]
   ↑ default
```

- USD default (většina nákupů je z Asie/Ukrajiny)
- Po kliknutí na jinou měnu: auto-fetch kurzu

### Exchange rate — jen informační (AKTUALIZOVÁNO)

```
Kurz: 23.00 CZK/USD (ČNB, 14.7.2026)
```

- Pro CZK: kurz se **nezobrazuje** (rate je vždy 1:1)
- Pro USD/EUR: zobrazí se jako **plain text** (ne jako input!)
- **Není editovatelný** — uživatel nemůže přepsat
- Auto-fetch při změně měny z `/api/exchange-rates`
- Pokud ČNB API selže → fallback rate + warning "kurz neaktuální"

### Price preview box (AKTUALIZOVÁNO)

**BY_GRAM preview:**
```
┌────────────────────────────────────────┐
│ Přepočet (kurz: 23.00 CZK/USD z ČNB) │
│ Nákup: 1.20 USD/g = 27.60 Kč/g       │
│ Prodej: 55.20 Kč/g (marže 100%)      │
│ Za 100g retail: 5 520 Kč             │
└────────────────────────────────────────┘
```

**BY_PIECE preview:**
```
┌────────────────────────────────────────┐
│ Přepočet (kurz: 23.00 CZK/USD z ČNB) │
│ Nákup kusu (80g): $96 = 2 208 Kč     │
│ Prodej: 4 416 Kč/kus (marže 100%)    │
└────────────────────────────────────────┘
```

- Zobrazuje se live při psaní
- Barva marže: zelená > 40%, žlutá 20-40%, červená < 20%

---

## Rizika a mitigace

| Riziko | Mitigace |
|--------|----------|
| ČNB API nedostupné | Fallback: hardcoded rates (USD ~23.50, EUR ~25.00) + warning "kurz neaktuální" |
| Zaokrouhlovací chyby | Vše v haléřích (int), zaokrouhlení Math.round() po každém kroku |
| Zpětná kompatibilita | CZK mode = stávající chování (exchangeRate 10000). Žádná migrace DB |
| Kurz se změní mezi zadáním a odesláním | Kurz se fetchne 1× při výběru měny, uloží se do state, použije se při submit. Akceptovatelné — kurz se mění max 1× denně |

---

## NENÍ potřeba migrovat DB

Backend `Delivery` model **už má** `currency`, `exchangeRate`, `purchasePricePerGramRaw`, `purchasePricePerGramCZK`. Celá změna je čistě na frontendu (StockInForm) + nový exchange rate API.

Stávající deliveries mají `currency: "CZK"` a `exchangeRate: 10000` — to je korektní, zpětně kompatibilní.

---

## DOPLNĚNÍ: Zjednodušení cenové politiky pro admina

**Zadání:** "cenová politika se musí pro mě jako admina zjednodušit"

### Současný stav — 3 oddělené stránky pro ceny

| Stránka | Co tam je | Problém |
|---------|-----------|---------|
| Settings → Pricing (`/settings/pricing`) | Tabulka 4 kategorií × markupPercent (%) × tlačítko Save na každý řádek | Abstraktní číslo "marže %", nemá kontext — uživatel nevidí co to udělá s reálnou cenou |
| Settings → B2B (`/settings/b2b`) | Sleva pro kadeřnice (basis points!) a salony | Hodnoty v "basis points" (2000 = 20%) — matoucí. Preview tabulka ukazuje 500 CZK/g — umělý příklad |
| Product detail → VariantTable | Editace retailPricePerGram, costPricePerGram per variant | Roztříštěné — musí kliknout na každou variantu zvlášť |
| Stock-in wizard | Nákupní cena za gram v CZK (hardcoded) | Špatná jednotka (1g), špatná měna (CZK) |

### Co je zbytečně složité

1. **Markup je abstraktní** — uživatel nastaví 200% markup ale nevidí výslednou cenu. Musí si sám počítat: "nákup 5 Kč/g × 3 = 15 Kč/g prodejní? Ne, 200% markup = nákup × (1 + 200/100) = 15 Kč... nebo ne?"
   - FAKT: Kód na řádku 135 deliveries route: `retailPrice = raw * (10000 + markupPercent * 100) / 10000` — takže 200% markup = × 3 (ne × 2!)
   - ALE: uživatel chce 100% marži (prodejní = 2× nákupní), což odpovídá markup = 100%
   - **Terminologie je matoucí** — "markup" vs "marže" — uživatel říká "marže 100%" ale kód pracuje s "markupPercent"

2. **B2B slevy jsou v basis points** — interně 2000 = 20%, ale UI to konvertuje na % s 2 des. místy. Zbytečná složitost.

3. **Každá kategorie má svůj markup** — uživatel musí nastavit zvlášť pro VIRGIN, LUXE, STANDARD, SALE. V praxi chce pravděpodobně **stejnou marži pro všechny** (100%).

4. **Chybí propojení** — nastavím nákupní cenu v USD v stock-in, ale nevidím jak se z toho stane prodejní cena. Musím jít do Settings → Pricing, tam nastavit markup, pak zpátky do produktu kde vidím výsledek.

### Navrhované zjednodušení

#### Princip: "Zadám nákup → vidím prodej"

Celý cenový řetězec musí být viditelný **na jednom místě** — v stock-in wizardu.

#### A) Stock-in wizard — live kalkulačka (HLAVNÍ ZMĚNA, součást multi-currency)

Už je v plánu výše (viz "Price preview box"). Příklad s potvrzenými čísly:
```
BY_GRAM příklad ($120/100g, kurz 23):
┌────────────────────────────────────────┐
│ Přepočet (kurz: 23.00 CZK/USD z ČNB) │
│ Nákup: 1.20 USD/g = 27.60 Kč/g       │
│ Prodej: 55.20 Kč/g (marže 100%)      │
│ Za 100g retail: 5 520 Kč             │
│                                        │
│ B2B ceny:                              │
│ Kadeřnice (-20%): 44.16 Kč/g         │
│ Salon (-36%): 35.33 Kč/g             │
└────────────────────────────────────────┘
```

Doplnit B2B preview — uživatel okamžitě vidí kolik zaplatí kadeřnice a salon.

#### B) Settings → Pricing — zjednodušit UI (15 min)

Současná tabulka (4 řádky × input × save button) nahradit za:

```
┌────────────────────────────────────────────────┐
│ Cenová politika                                 │
│                                                  │
│ Marže (nákup → prodej):  [100] %                │
│ ← Prodejní = nákupní × 2                       │
│                                                  │
│ [x] Stejná marže pro všechny kategorie          │
│     nebo:                                        │
│     Panenské [100] %   Luxe [100] %             │
│     Standard [100] %   Výprodej [50] %          │
│                                                  │
│ Příklad: Nákup 5 Kč/g → Prodej 10 Kč/g         │
│                                                  │
│ [Uložit]                                         │
└────────────────────────────────────────────────┘
```

Změny:
- **Checkbox "stejná marže pro všechny"** — default ON, jeden input místo 4
- **Live příklad** s reálným číslem (ne abstraktní %)
- **Popis slovně**: "Prodejní = nákupní × 2" místo "markup 100%"
- Jeden Save tlačítko místo 4

#### C) Settings → B2B — zobrazit v normálních % (5 min)

Současně: input s hodnotou `20.00` (basis points / 100) — matoucí.

Návrh: zobrazit jako jednoduché celé procento:
```
Sleva pro kadeřnice: [20] %
Sleva pro salony:    [36] %
```

Interně stále basis points, ale UI konvertuje tam a zpět.

#### D) Sloučit Pricing a B2B do jedné stránky (volitelné, nice-to-have)

Pricing a B2B settings spolu úzce souvisí. Sloučit do jedné stránky `/settings/pricing`:
- Sekce 1: Marže (nákup → prodej)
- Sekce 2: B2B slevy (z prodejní ceny)
- Preview tabulka s reálnými čísly

### Kritický bug v deliveries route (nalezený při analýze)

**`src/app/api/deliveries/route.ts` řádky 148-149:**

```typescript
costPricePerGram: effectivePurchasePricePerGramRaw,
wholesalePricePerGram: effectivePurchasePricePerGramRaw,
```

`effectivePurchasePricePerGramRaw` je cena v **originální měně** (haléře/centy). Ale `costPricePerGram` a `wholesalePricePerGram` v Variant modelu by měly být v **CZK haléřích**.

Aktuálně funguje protože form hardcoduje `currency: "CZK"` (raw = CZK). Ale po přidání multi-currency **musí být opraveno**:

```typescript
// SPRÁVNĚ: přepočítat na CZK
const purchasePricePerGramCZK = data.currency === "CZK"
  ? effectivePurchasePricePerGramRaw
  : Math.round((effectivePurchasePricePerGramRaw * data.exchangeRate) / 10000);

costPricePerGram: purchasePricePerGramCZK,
wholesalePricePerGram: purchasePricePerGramCZK,
retailPricePerGram: Math.round(purchasePricePerGramCZK * (10000 + markupPercent * 100) / 10000),
```

Toto je **nutný fix** při implementaci multi-currency — jinak by se variant prices uložily v USD/EUR haléřích místo CZK haléřích.

### Soubory k úpravě (doplnění)

| # | Soubor | Typ změny |
|---|--------|-----------|
| 7 | `src/app/(app)/settings/pricing/PricingSettingsClient.tsx` | Zjednodušit UI — checkbox "stejná marže", live preview |
| 8 | `src/app/(app)/settings/b2b/B2BSettingsClient.tsx` | Zobrazit % místo basis points v UI |
| 9 | `src/app/api/deliveries/route.ts` řádky 148-150 | BUG FIX: přepočítat na CZK před uložením do variant |

---

## Celkový odhad: ~3.5 hodiny (původní 2.5h + admin simplifikace 1h)
