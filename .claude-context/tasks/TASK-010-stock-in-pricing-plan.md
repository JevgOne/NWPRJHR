# TASK-010: Naskladnění — nákupní cena za 100g v USD/EUR, prodej v CZK

**Status:** HOTOVO (plán)
**Autor:** Plánovač
**Datum:** 2026-07-14

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

### Princip: Změna na 100g jednotku + volba měny

Uživatel zadá:
1. **Měnu**: USD / EUR / CZK (dropdown, default USD)
2. **Nákupní cenu za 100g** v dané měně (celé číslo nebo 2 des. místa)
3. **Kurz** (auto-fetch z ČNB + možnost ručního override)

Systém automaticky:
- Přepočítá na cenu za 1g
- Přepočítá na CZK
- Nastaví `costPricePerGram`, `wholesalePricePerGram`
- Vypočítá `retailPricePerGram` z PriceSettings markupu

### Změny po souborech

---

#### 1. `src/components/inventory/StockInForm.tsx` — HLAVNÍ ZMĚNA

**Nové state proměnné:**
```typescript
const [currency, setCurrency] = useState<"USD" | "EUR" | "CZK">("USD");
const [purchasePricePer100g, setPurchasePricePer100g] = useState("");
const [exchangeRateInput, setExchangeRateInput] = useState("");
const [autoRate, setAutoRate] = useState<number | null>(null);
const [rateLoading, setRateLoading] = useState(false);
```

**Odstranit:**
- `purchasePrice` (nahrazeno `purchasePricePer100g`)
- `purchasePricePerPieceCzk` → přejmenovat na `purchasePricePerPiece` (bez Czk suffix)

**Nový blok v sekci "Details" (section-details):**

Nahradit stávající `purchasePrice` input za:

```
┌─────────────────────────────────────────────────┐
│ Nákupní cena                                     │
│                                                   │
│ Měna: [USD ▼]  [EUR]  [CZK]                     │
│                                                   │
│ Cena za 100g: [_____] USD                        │
│                                                   │
│ Kurz USD/CZK: [23.50__] (auto z ČNB)   🔄       │
│                                                   │
│ ── Přepočet ──────────────────────────────       │
│ Cena za 1g: 0.XX USD = X.XX Kč                  │
│ Prodejní cena: XX.XX Kč/g (marže 100%)           │
│ Za 100g retail: X XXX Kč                         │
└─────────────────────────────────────────────────┘
```

**Přepočet v handleSubmit:**

```typescript
// BY_GRAM mode:
// User enters price per 100g in foreign currency
const pricePer100gInCents = Math.round(parseFloat(purchasePricePer100g) * 100);
const pricePerGramRaw = Math.round(pricePer100gInCents / 100); // halere per gram

// Exchange rate: user enters decimal (e.g. 23.50), convert to int * 10000
const rateDecimal = parseFloat(exchangeRateInput);
const exchangeRateInt = Math.round(rateDecimal * 10000);

// Body to send:
const body = {
  ...otherFields,
  purchasePricePerGramRaw: pricePerGramRaw,
  currency: currency,
  exchangeRate: currency === "CZK" ? 10000 : exchangeRateInt,
};
```

**BY_PIECE mode:**
- Stejný princip: nákupní cena za kus v orig. měně + kurz
- Přepočet na CZK × kurz

**Auto-fetch kurzu z ČNB:**
- Volat nový API endpoint `/api/exchange-rates` při změně měny
- Zobrazit auto-fetched rate jako default, uživatel může přepsat

**Live preview přepočtu:**
- Pod cenou zobrazit: "Cena za 1g: X.XX USD = Y.YY Kč"
- "Prodejní cena: Z.ZZ Kč/g (marže {markupPercent}%)"
- "Za 100g retail: XXXX Kč"

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

#### 4. `src/components/inventory/StockInForm.tsx` — BY_PIECE mode

Pro BY_PIECE (culíky) mode:

- Nákupní cena za kus se zadává v **originální měně** (ne Kč)
- Přidat stejný currency selector + exchange rate
- Preview: "Nákup: X USD/ks = Y Kč/ks → Prodej: Z Kč/ks"

Současné:
```
purchasePricePerPieceCzk → rename to purchasePricePerPiece
pricePerPieceCzk → rename to pricePerPiece (toto je velkoobchodní/wholesale)
retailPricePerPieceCzk → rename to retailPricePerPiece
```

Tyto state proměnné drží cenu v **originální měně**, přepočet na CZK se dělá v handleSubmit přes kurz.

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
    "purchasePricePerPiece": "Nákupní cena za kus",
    "exchangeRate": "Kurz",
    "exchangeRateAuto": "auto z ČNB",
    "exchangeRateManual": "ruční kurz",
    "rateRefresh": "Obnovit kurz",
    "rateLoading": "Načítání kurzu...",
    "pricePreview": "Přepočet",
    "pricePerGramOrig": "Cena za 1g",
    "pricePerGramCzk": "Cena za 1g v CZK",
    "retailPreview": "Prodejní cena",
    "retailPer100g": "Za 100g retail",
    "margin": "Marže"
  }
}
```

Ekvivalentní klíče do uk.json a ru.json.

---

## Soubory k úpravě (souhrn)

| # | Soubor | Typ změny |
|---|--------|-----------|
| 1 | `src/components/inventory/StockInForm.tsx` | VELKÁ — currency selector, price per 100g, exchange rate, preview |
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
- Přidat exchange rate input s auto-fetch
- Přidat live preview přepočtu
- Upravit handleSubmit: přepočet z 100g→1g, správný currency+exchangeRate

### Krok 5: StockInForm — BY_PIECE mode (20 min)
- Nákupní cena za kus v orig. měně
- Stejný currency + exchange rate (sdílený state)
- Preview přepočtu na CZK

### Krok 6: Test (15 min)
- Stock-in v USD BY_GRAM → ověřit Delivery má správný currency, exchangeRate, purchasePricePerGramCZK
- Stock-in v EUR BY_PIECE → ověřit přepočet
- Stock-in v CZK → ověřit exchangeRate = 10000 (backward compatible)
- Delivery detail page zobrazuje raw cenu + currency

---

## Přepočtové vzorce

### BY_GRAM: Uživatel zadá "500 USD za 100g"

```
input: 500 USD / 100g
kurz: 23.50 CZK/USD

1. Cena za 100g v haléřích orig. měny:
   500 * 100 = 50000 haléřů/cent

2. Cena za 1g v haléřích:
   50000 / 100 = 500 haléřů/cent za gram (= 5.00 USD/g)

3. purchasePricePerGramRaw = 500 (int, haléře orig. měny)
4. exchangeRate = 23.50 * 10000 = 235000
5. purchasePricePerGramCZK = 500 * 235000 / 10000 = 11750 haléřů = 117.50 Kč/g

6. costPricePerGram = 11750
7. wholesalePricePerGram = 11750
8. retailPricePerGram = 11750 * (1 + 100/100) = 23500 = 235 Kč/g
9. Za 100g retail = 23 500 Kč
```

### BY_PIECE: Uživatel zadá "30 EUR za kus"

```
input: 30 EUR / kus, váha kusu 100g
kurz: 25.20 CZK/EUR

1. Cena za kus v haléřích:
   30 * 100 = 3000 eurocentů

2. purchasePricePerPiece (sent to API) = 3000
3. Cena za 1g v haléřích:
   3000 / 100g = 30 eurocentů/g

4. purchasePricePerGramRaw = 30
5. exchangeRate = 25.20 * 10000 = 252000
6. purchasePricePerGramCZK = 30 * 252000 / 10000 = 756 haléřů = 7.56 Kč/g

7. pricePerPiece (wholesale CZK) = 756 * 100g = 75600 haléřů = 756 Kč/ks
8. retailPricePerPiece = 75600 * 2 = 151200 = 1512 Kč/ks
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

### Exchange rate field

```
Kurz USD/CZK: [23.50  ] ← editable, pre-filled z ČNB
              └ auto z ČNB (14.7.2026)  🔄
```

- Pro CZK: exchange rate field se **skryje** (rate je vždy 1:1)
- Pro USD/EUR: zobrazí se s auto-fetched hodnotou
- Tlačítko 🔄 pro refresh
- Uživatel může přepsat (pro případ jiného kurzu)

### Price preview box

```
┌────────────────────────────────────────┐
│ Přepočet                               │
│ Nákup: 5.00 USD/g = 117.50 Kč/g       │
│ Prodej: 235.00 Kč/g (marže 100%)      │
│ Za 100g retail: 23 500 Kč             │
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
| Uživatel zapomene změnit kurz | Auto-fetch + poslední použitý kurz jako default |

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

Už je v plánu výše (viz "Price preview box"):
```
┌────────────────────────────────────────┐
│ Přepočet                               │
│ Nákup: 5.00 USD/g = 117.50 Kč/g       │
│ Velkoobchod (B2B): 117.50 Kč/g        │
│ Prodej: 235.00 Kč/g (marže 100%)      │
│ Za 100g retail: 23 500 Kč             │
│                                        │
│ B2B ceny:                              │
│ Kadeřnice (-20%): 211.50 Kč/g         │
│ Salon (-36%): 150.40 Kč/g             │
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
