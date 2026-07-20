# TASK-016: Zjednodušení admin cenové politiky (Pricing + B2B)

**Status:** HOTOVO (plán)
**Autor:** Plánovač
**Datum:** 2026-07-14

---

## Shrnutí problému

Uživatel (admin/OWNER) říká: "cenová politika se musí pro mě jako admina zjednodušit."

Současný stav:
- **Settings → Pricing** (`/settings/pricing`): 4 řádky tabulky (VIRGIN, LUXE, STANDARD, SALE) × input markup % × Save button na každý řádek. Abstraktní číslo bez kontextu.
- **Settings → B2B** (`/settings/b2b`): Dvě pole (kadeřnice, salon) s hodnotami v "basis points" dělených 100 (zobrazeno jako `20.00`). Preview tabulka s umělým příkladem 500 CZK/g.
- Tyto dvě stránky spolu úzce souvisí ale jsou oddělené.
- Chybí živý přehled: "co se stane s cenou".

---

## Analýza současného kódu

### 1. PricingSettingsClient.tsx (129 řádků)

**Soubor:** `src/app/(app)/settings/pricing/PricingSettingsClient.tsx`

**Problémy:**
- 4 nezávislé řádky v tabulce, každý se svým Save tlačítkem (řádky 87-123)
- Input `type="number"` min 0, max 1000, šířka w-24 (řádky 95-104)
- Každý save volá `PUT /api/price-settings` s `{ category, markupPercent }` (řádky 42-63)
- API po uložení **přepočítá všechny varianty** dané kategorie kde `retailManualOverride === false` (API route řádky 41-58)
- Žádný live preview — uživatel nevidí dopad na cenu
- Label "Přirážka — Nastavení" je nejasný

**State:**
```typescript
settings: PriceSetting[]           // from API
values: Record<string, string>     // { VIRGIN: "100", LUXE: "100", ... }
saving: string | null              // which category is saving
loading: boolean
```

### 2. B2BSettingsClient.tsx (169 řádků)

**Soubor:** `src/app/(app)/settings/b2b/B2BSettingsClient.tsx`

**Problémy:**
- Interně `hairdresserDiscountPct` a `salonDiscountPct` jsou v **basis points** (2000 = 20%)
- UI konvertuje `/ 100` pro zobrazení → `20.00` s `step={0.01}` (řádky 52-53, 67-80)
- Zpětná konverze `* 100` s `Math.round` při onChange (řádky 76-79, 101-105)
- Preview tabulka s hardcoded "500 CZK/g" jako příklad (řádky 129-165)
- Help text říká "Slevy se počítají z marže" — matoucí
- Jedno Save tlačítko pro obě hodnoty (OK)

**State:**
```typescript
settings: { hairdresserDiscountPct: number, salonDiscountPct: number }  // basis points
saving: boolean
saved: boolean
```

### 3. API: PUT /api/price-settings

**Soubor:** `src/app/api/price-settings/route.ts`

- Přijímá `{ category, markupPercent }` — jeden záznam najednou
- Upsert do `PriceSettings`
- **Důležité:** Přepočítá `retailPricePerGram` pro VŠECHNY varianty dané kategorie (kde `retailManualOverride === false`)
- Používá `calculateRetailPrice(wholesalePricePerGram, markupPercent)` z `src/lib/pricing.ts`
- `calculateRetailPrice`: `wholesalePrice * (1 + markupPercent / 100)`, rounded up

### 4. API: PUT /api/b2b-settings

**Soubor:** `src/app/api/b2b-settings/route.ts`

- Přijímá `{ hairdresserDiscountPct, salonDiscountPct }` (obě int, 0-10000)
- Upsert do `B2BSettings` (id = "default")
- Volá `invalidateB2BCache()` z `src/lib/b2b-pricing.ts`

### 5. Prisma modely

```prisma
model PriceSettings {
  id            String          @id @default(cuid())
  category      ProductCategory @unique    // VIRGIN, LUXE, STANDARD, SALE
  markupPercent Int
  updatedAt     DateTime        @updatedAt
}

model B2BSettings {
  id                      String   @id @default(cuid())
  hairdresserDiscountPct  Int      @default(2000)   // basis points: 2000 = 20%
  salonDiscountPct        Int      @default(3600)    // basis points: 3600 = 36%
  updatedAt               DateTime @updatedAt
}
```

### 6. Navigace

**Soubor:** `src/components/AppShell.tsx` řádky 116-117

```typescript
{ href: "/settings/b2b", label: t("b2b"), roles: ["OWNER"] },
{ href: "/settings/pricing", label: t("pricing"), roles: ["OWNER"] },
```

### 7. B2B pricing logika

**Soubor:** `src/lib/sale-pricing.ts`

B2B sleva se počítá z retailPricePerGram:
```typescript
pricePerGram = retailPricePerGram - (retailPricePerGram * discountPct) / 20000
```
Tzn. sleva se aplikuje na **polovinu** retail ceny (marži), ne na celou cenu.
Při 100% markup a 20% slevě z marže: `retail - retail * 2000 / 20000 = retail * 0.90` (10% z celkové ceny).

---

## Navrhované řešení

### Princip: Sloučit obě stránky + přidat kontext

Sloučit Pricing a B2B do **jedné stránky** `/settings/pricing` se dvěma sekcemi a živým příkladem.

### Nová stránka: `/settings/pricing`

```
┌──────────────────────────────────────────────────────┐
│ Cenová politika                                       │
│                                                        │
│ ═══ Marže (nákup → prodej) ═══════════════════════   │
│                                                        │
│ Marže:  [100] %                                       │
│ Prodejní cena = nákupní × 2                           │
│                                                        │
│ [x] Stejná marže pro všechny kategorie                │
│                                                        │
│   (collapsed when checked:)                           │
│   VIRGIN [100] %   LUXE [100] %                      │
│   STANDARD [100] %   SALE [50] %                     │
│                                                        │
│ ═══ B2B slevy ════════════════════════════════════    │
│                                                        │
│ Sleva pro kadeřnice:  [20] %                          │
│ Sleva pro salony:     [36] %                          │
│                                                        │
│ ═══ Příklad cen ═════════════════════════════════    │
│                                                        │
│ Při nákupní ceně 27.60 Kč/g:                         │
│                                                        │
│ Zákazník (retail):  55.20 Kč/g                       │
│ Kadeřnice (-20%):  49.68 Kč/g                        │
│ Salon (-36%):      45.27 Kč/g                        │
│                                                        │
│ [Uložit vše]                                          │
└──────────────────────────────────────────────────────┘
```

---

## Změny po souborech

### 1. `src/app/(app)/settings/pricing/PricingSettingsClient.tsx` — PŘEPSAT

**Úplný rewrite.** Sloučit pricing + B2B do jedné komponenty.

**Nový state:**
```typescript
// Pricing
const [markupPercent, setMarkupPercent] = useState("100");
const [sameForAll, setSameForAll] = useState(true);
const [categoryMarkups, setCategoryMarkups] = useState<Record<string, string>>({
  VIRGIN: "100", LUXE: "100", STANDARD: "100", SALE: "100"
});

// B2B
const [hairdresserDiscount, setHairdresserDiscount] = useState("20");  // plain %
const [salonDiscount, setSalonDiscount] = useState("36");              // plain %

// UI
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);

// Live preview
const exampleCostPerGram = 2760; // 27.60 Kč/g — example or fetched from latest delivery
```

**Init (useEffect):**
- Fetch `/api/price-settings` → array of 4 settings
- Pokud všechny mají stejný markupPercent → `sameForAll = true`, `markupPercent = that value`
- Pokud se liší → `sameForAll = false`, naplnit `categoryMarkups`
- Fetch `/api/b2b-settings` → konvertovat basis points na plain %:
  - `hairdresserDiscount = (hairdresserDiscountPct / 100).toString()` → "20"
  - `salonDiscount = (salonDiscountPct / 100).toString()` → "36"

**Checkbox "Stejná marže pro všechny":**
- Když zapne (true): `markupPercent` se aplikuje na všechny 4 kategorie
- Když vypne (false): zobrazí 4 inputy (VIRGIN, LUXE, STANDARD, SALE) s individuálními hodnotami
- Default: zapnuto (většina use-cases)
- Při přepnutí z off→on: nastaví všechny na aktuální `markupPercent`

**Live preview (useMemo):**
```typescript
const activeMarkup = parseInt(markupPercent) || 0;
const exampleRetail = Math.round(exampleCostPerGram * (1 + activeMarkup / 100));
const hairDiscPct = parseInt(hairdresserDiscount) || 0;
const salonDiscPct = parseInt(salonDiscount) || 0;

// B2B discount is from margin, formula from sale-pricing.ts:
// price = retail - (retail * discountBasisPts / 20000)
const exampleHairdresser = Math.round(
  exampleRetail - (exampleRetail * hairDiscPct * 100) / 20000
);
const exampleSalon = Math.round(
  exampleRetail - (exampleRetail * salonDiscPct * 100) / 20000
);
```

Zobrazit v haléřích → Kč:
```
Zákazník:  {(exampleRetail / 100).toFixed(2)} Kč/g
Kadeřnice: {(exampleHairdresser / 100).toFixed(2)} Kč/g
Salon:     {(exampleSalon / 100).toFixed(2)} Kč/g
```

**Popis slovně pod inputem marže:**
- "Prodejní cena = nákupní × {1 + markup/100}" — dynamicky
- Např. markup 100 → "Prodejní = nákupní × 2"
- Např. markup 200 → "Prodejní = nákupní × 3"

**handleSave:**
```typescript
async function handleSave() {
  setSaving(true);
  
  // 1. Save pricing (markup) for each category
  const markups = sameForAll
    ? Object.fromEntries(CATEGORIES.map(c => [c, parseInt(markupPercent)]))
    : Object.fromEntries(CATEGORIES.map(c => [c, parseInt(categoryMarkups[c])]));
  
  // Call PUT /api/price-settings for each category
  await Promise.all(
    CATEGORIES.map(cat =>
      fetch("/api/price-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, markupPercent: markups[cat] }),
      })
    )
  );
  
  // 2. Save B2B settings (convert plain % back to basis points)
  await fetch("/api/b2b-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hairdresserDiscountPct: Math.round(parseFloat(hairdresserDiscount) * 100),
      salonDiscountPct: Math.round(parseFloat(salonDiscount) * 100),
    }),
  });
  
  setSaving(false);
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
}
```

**Jedno tlačítko "Uložit vše"** místo 4+1 save buttonů.

### 2. `src/app/(app)/settings/b2b/` — PŘESMĚROVAT

**page.tsx:** Změnit na redirect:
```typescript
import { redirect } from "next/navigation";
export default function B2BSettingsPage() {
  redirect("/settings/pricing");
}
```

**B2BSettingsClient.tsx:** Ponechat (pro zpětnou kompatibilitu), ale nebude se přímo používat.

Alternativa: Smazat oba soubory úplně. Ale redirect je bezpečnější pro případ bookmarkovaných URL.

### 3. `src/components/AppShell.tsx` — NAVIGACE

**Řádky 116-117:** Sloučit B2B a Pricing do jednoho odkazu.

Změnit z:
```typescript
{ href: "/settings/b2b", label: t("b2b"), roles: ["OWNER"] },
{ href: "/settings/pricing", label: t("pricing"), roles: ["OWNER"] },
```

Na:
```typescript
{ href: "/settings/pricing", label: t("pricing"), roles: ["OWNER"] },
```

Odebrat B2B odkaz — vše je na jedné stránce.

### 4. Překlady — `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Nové/změněné klíče v `pricingSettings` namespace:

```json
{
  "pricingSettings": {
    "title": "Cenová politika",
    "markupSection": "Marže (nákup → prodej)",
    "markup": "Marže",
    "markupDescription": "Prodejní = nákupní × {multiplier}",
    "sameForAll": "Stejná marže pro všechny kategorie",
    "b2bSection": "B2B slevy",
    "hairdresserDiscount": "Sleva pro kadeřnice",
    "salonDiscount": "Sleva pro salony",
    "previewSection": "Příklad cen",
    "previewNote": "Při nákupní ceně {cost} Kč/g:",
    "tierCustomer": "Zákazník (retail)",
    "tierHairdresser": "Kadeřnice (-{pct}%)",
    "tierSalon": "Salon (-{pct}%)",
    "saveAll": "Uložit vše",
    "recalculated": "Přepočteno {count} variant"
  }
}
```

Stávající `b2bSettings.*` klíče ponechat (redirect page je nezíská, ale pro jistotu).

### 5. API endpointy — BEZ ZMĚNY

- `PUT /api/price-settings` — funguje, přijímá `{ category, markupPercent }`, přepočítá varianty
- `PUT /api/b2b-settings` — funguje, přijímá `{ hairdresserDiscountPct, salonDiscountPct }` v basis points
- `GET /api/price-settings` — vrací array PriceSettings
- `GET /api/b2b-settings` — OWNER vidí vše

Frontend bude konvertovat:
- Marže: int → int (beze změny, markup % = markup %)
- B2B: plain % (UI) → basis points (API): `20` → `2000`, `36` → `3600`

---

## Soubory k úpravě (souhrn)

| # | Soubor | Typ změny |
|---|--------|-----------|
| 1 | `src/app/(app)/settings/pricing/PricingSettingsClient.tsx` | PŘEPSAT — sloučit pricing + B2B, checkbox, live preview |
| 2 | `src/app/(app)/settings/b2b/page.tsx` | PŘEPSAT na redirect → `/settings/pricing` |
| 3 | `src/components/AppShell.tsx` řádek 116 | ODSTRANIT B2B odkaz z navigace |
| 4 | `messages/cs.json` | Přidat `pricingSettings.*` klíče |
| 5 | `messages/uk.json` | Přidat `pricingSettings.*` klíče |
| 6 | `messages/ru.json` | Přidat `pricingSettings.*` klíče |

**Soubory které se NEMĚNÍ:**
- `src/app/api/price-settings/route.ts` — API funguje, volá se 4× (jednou per kategorie)
- `src/app/api/b2b-settings/route.ts` — API funguje
- `src/lib/pricing.ts` — `calculateRetailPrice` funguje
- `src/lib/b2b-pricing.ts` — cache invalidace funguje
- `src/lib/sale-pricing.ts` — B2B cenová logika funguje
- `prisma/schema.prisma` — modely jsou OK
- `src/lib/validations/product.ts` — validace `updatePriceSettingsSchema` funguje

---

## Implementační pořadí

### Krok 1: Překlady (5 min)
- Přidat `pricingSettings.*` klíče do `cs.json`, `uk.json`, `ru.json`

### Krok 2: PricingSettingsClient.tsx — přepsat (40 min)
- Sloučit oba formuláře do jedné komponenty
- Přidat checkbox "stejná marže pro všechny"
- Přidat B2B slevy sekci s plain % inputy
- Přidat live preview s reálnými čísly
- Jedno Save tlačítko

### Krok 3: Navigace + redirect (5 min)
- AppShell: odebrat B2B odkaz
- B2B page.tsx: redirect na `/settings/pricing`

### Krok 4: Test (10 min)
- Změnit marži pro všechny → ověřit že se přepočítají varianty
- Změnit marži per-kategorie → ověřit individuální přepočet
- Změnit B2B slevy → ověřit B2B cenová logika
- Ověřit redirect z `/settings/b2b` → `/settings/pricing`
- Ověřit live preview s reálnými čísly

---

## Detail: Logika "Stejná marže pro všechny"

### Při načtení:
```typescript
const allSame = settings.every(s => s.markupPercent === settings[0]?.markupPercent);
setSameForAll(allSame);
if (allSame) {
  setMarkupPercent((settings[0]?.markupPercent ?? 100).toString());
} else {
  // Naplnit per-category hodnoty
}
```

### Při uložení:
- `sameForAll = true`: volá PUT 4× se stejným markupPercent
- `sameForAll = false`: volá PUT 4× s individuálními hodnotami

### Proč paralelní PUT místo batch:
- API endpoint umí jen jeden záznam (`{ category, markupPercent }`)
- Vytvořit nový batch endpoint = zbytečná práce pro 4 requesty
- `Promise.all([...4 requests])` je dostatečně rychlé

---

## Detail: B2B konverze

**UI → API:**
- Uživatel zadá `20` (celé procento)
- Odešle se `20 * 100 = 2000` (basis points)

**API → UI:**
- API vrátí `2000` (basis points)
- Zobrazí se `2000 / 100 = 20` (celé procento)

**Proč neměnit API na plain %:**
- `sale-pricing.ts` pracuje s basis points (`discountPct / 20000`)
- `b2b-pricing.ts` cache vrací basis points
- Změna by vyžadovala úpravu více souborů + DB migraci
- Konverze na frontendu je jednodušší a bezpečnější

---

## Detail: Live preview

### Odkud vzít "příkladovou nákupní cenu"?

**Možnost A (jednoduchá):** Hardcoded `27.60 Kč/g` — realistická cena z posledního příkladu.
**Možnost B (dynamická):** Fetch průměrný `costPricePerGram` ze všech variant.
**Možnost C (uživatelská):** Uživatel zadá příkladovou cenu do inputu.

**Doporučení:** Možnost A — hardcoded `2760` haléřů (27.60 Kč/g). Jednoduché, realistické, bez dalšího API callu. Pokud chce uživatel vidět reálné ceny, jde na produkt.

Alternativně: malý input "Příklad nákupní ceny: [27.60] Kč/g" — uživatel může změnit.

### Výpočet preview:

```typescript
const markup = parseInt(sameForAll ? markupPercent : categoryMarkups.VIRGIN) || 0;
const retail = Math.round(exampleCost * (1 + markup / 100));
const hairDiscBp = Math.round(parseFloat(hairdresserDiscount) * 100); // basis points
const salonDiscBp = Math.round(parseFloat(salonDiscount) * 100);

// sale-pricing.ts formula: retail - (retail * discountPct / 20000)
const hairPrice = Math.round(retail - (retail * hairDiscBp) / 20000);
const salonPrice = Math.round(retail - (retail * salonDiscBp) / 20000);
```

---

## Rizika a mitigace

| Riziko | Mitigace |
|--------|----------|
| Race condition: 4 paralelní PUT pro pricing | Každý PUT je nezávislý (jiná kategorie). `Promise.all` je OK. |
| B2B stránka bookmarkovaná | Redirect z `/settings/b2b` → `/settings/pricing` |
| Zaokrouhlení basis points | `Math.round(parseFloat(val) * 100)` — stejně jako v aktuálním B2B UI |
| Uživatel nezná pojem "marže" | Slovní popis "Prodejní = nákupní × 2" je jasný |
| Preview s hardcoded cenou | Cena 27.60 Kč/g je realistická. Alternativně přidat editovatelný input. |

---

## Celkový odhad: ~1 hodina
