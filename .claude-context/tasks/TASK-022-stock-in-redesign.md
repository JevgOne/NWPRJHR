# TASK #22 — REDESIGN: Stock-in formulář — naskladnění vytváří produkt

**Datum:** 2026-06-28
**Agent:** planovac

---

## 1. SOUČASNÝ STOCK-IN FLOW — ANALÝZA

### Soubory:

| Soubor | Účel |
|--------|------|
| `src/app/(app)/inventory/stock-in/page.tsx` | Server component — načte products+suppliers z DB |
| `src/components/inventory/StockInForm.tsx` | Client form — 393 řádků |
| `src/app/api/deliveries/route.ts` | POST handler — validace + stockIn() |
| `src/lib/stock-in.ts` | Business logika — vytváří Delivery + StockMovement |
| `src/lib/validations/delivery.ts` | Zod schema — `stockInSchema` |

### Současný flow:

```
1. Vyber PRODUKT (dropdown) → 4 produkty: Virgin/Premium/Standard/Sale
   ↓ origin, texture, colorTone jsou FIXNÍ na produktu
2. Vyber BARVU (swatch buttons) → z variant vybraného produktu
3. Vyber DÉLKU (cm buttons) → z variant filtrovaných podle barvy
   ↓ resolve variantId z [productId + color + lengthCm]
4. Vyplň: dodavatel, nákupní cena (Kč/g), gramáž, datum, poznámka
5. Submit → POST /api/deliveries → stockIn({ variantId, ... })
   ↓ vytvoří Delivery + StockMovement, Telegram notifikace
6. Úspěch → QR kód s odkazem na /offer/{slug}
```

### PROBLÉMY současného designu:

1. **4 "produkty" jsou ve skutečnosti KATEGORIE** — Virgin, Premium, Standard, Sale
2. **Origin je fixní** — Virgin = vždy Ukrajina, Premium = vždy Bělorusko, atd.
3. **Nelze mít Virgin vlasy z Kazachstánu** — origin je na Productu, ne na naskladnění
4. **Texture a colorTone jsou fixní na produktu** — nelze je měnit při naskladnění
5. **Variant musí existovat předem** — pokud neexistuje kombinace [color + length], nelze naskladnit

### Data flow:

```
stock-in/page.tsx
  → prisma.product.findMany({ archived: false, include: variants })
  → StockInForm({ products, suppliers })
    → user vybere product → color → length → resolve variantId
    → POST /api/deliveries { variantId, supplierId, purchasePricePerGramRaw, ... }
      → stockInSchema.safeParse(body)
      → stockIn({ variantId, ... }, userId)
        → tx.delivery.create({ variantId, ... })
        → tx.stockMovement.create({ variantId, type: "RECEIPT", ... })
      → variant.product.slug → response { productId, productName, productSlug }
```

---

## 2. NOVÝ FLOW — NÁVRH

### Princip: Stock-in = FIND-OR-CREATE produkt + naskladnit

```
1. Vyber KATEGORII → [VIRGIN, PREMIUM, STANDARD, SALE] (4 tlačítka)
2. Vyber PŮVOD → [Ukrajina, Bělorusko, Rusko, Kazachstán, ...] (15 tlačítek s vlajkami)
3. Vyber TEXTURU → [Rovné, Mírně vlnité, Vlnité, Kudrnaté] (4 tlačítka s ikonami)
4. Vyber BARVU → [1-10 swatch buttons] (10 tlačítek)
5. Vyber DÉLKU → [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70 cm] (buttons)
   ↓ Nyní máme 5 atributů: category + origin + texture + color + length
6. Systém zkontroluje: existuje Product s touto kombinací?
   → ANO: použij existující productId
   → NE: vytvoř nový Product + 1 Variant automaticky
7. Vyplň: dodavatel, nákupní cena, gramáž, datum, poznámka
8. Submit → naskladni
```

### Klíčový mechanismus: FIND-OR-CREATE

**Lookup klíč:** `{ category, origin, texture, color, lengthCm }`

Ale POZOR: V současném modelu jsou `color` a `lengthCm` na **Variant**, ne na **Product**. Takže lookup musí být:

**Varianta A (se zachováním Variant — DOPORUČENO):**
```
1. Najdi Product WHERE { category, origin, texture }
   → Pokud neexistuje: vytvoř Product + 1 Variant
   → Pokud existuje: najdi Variant WHERE { productId, color, lengthCm }
     → Pokud neexistuje: vytvoř Variant
     → Pokud existuje: použij variantId
2. stockIn({ variantId, ... })
```

**Varianta B (s lengthCm+color na Product — po Task #18 migraci):**
```
1. Najdi Product WHERE { category, origin, texture, color, lengthCm }
   → Pokud neexistuje: vytvoř Product
   → Pokud existuje: použij productId
2. stockIn({ productId, ... })
```

### Auto-generování dat pro nový Product:

Při vytvoření nového Productu z stock-in formuláře:

```typescript
{
  // Auto-generováno:
  name: `${categoryLabel} ${originLabel} ${textureLabel}`,
  // Příklad: "Virgin Ukrajina Rovné"
  nameUk: `${categoryLabelUk} ${originLabelUk} ${textureLabelUk}`,
  nameRu: `${categoryLabelRu} ${originLabelRu} ${textureLabelRu}`,
  
  category: selectedCategory,      // VIRGIN
  processingType: "OTHER",          // default — surové vlasy
  origin: selectedOrigin,           // "Ukrajina"
  texture: selectedTexture,         // "Rovné"
  colorTone: autoFromColor(color),  // mapování color code → colorTone
  
  slug: slugify(`${category}-${origin}-${texture}-${lengthCm}cm-${colorName}`),
  // Příklad: "virgin-ukrajina-rovne-40cm-blond"
  
  photos: "[]",                     // prázdné — přidá se později v admin
  archived: false,
}
```

### Color → ColorTone automatické mapování:

```typescript
function autoColorTone(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "Blond",     // Platinum
    "2": "Blond",     // Light Blonde
    "3": "Blond",     // Golden Blonde
    "4": "Blond",     // Honey
    "5": "Hnědá",     // Caramel
    "6": "Hnědá",     // Light Brown
    "7": "Hnědá",     // Medium Brown
    "8": "Tmavě hnědá", // Dark Brown
    "9": "Tmavě hnědá", // Dark
    "10": "Tmavě hnědá", // Black
  };
  return map[colorCode] ?? "Hnědá";
}
```

---

## 3. UI NÁVRH — KROKOVÝ FORMULÁŘ

### Step 1: Kategorie (4 velké tlačítka)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  VIRGIN  │ │ PREMIUM  │ │ STANDARD │ │   SALE   │
│  ✦ ✦ ✦  │ │  ✦ ✦    │ │    ✦     │ │   %      │
│ Panenské │ │ Prémiové │ │Standardní│ │  Výprodej│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Step 2: Původ (tlačítka s vlajkami, grid 3-5 sloupců)

```
🇺🇦 Ukrajina  🇧🇾 Bělorusko  🇷🇺 Rusko  🇰🇿 Kazachstán
🇺🇿 Uzbekistán 🇹🇷 Turecko  🇮🇷 Írán   🇮🇳 Indie
🇻🇳 Vietnam   🇸🇾 Sýrie    🇨🇳 Čína   🇲🇳 Mongolsko
🇬🇪 Gruzie    🇲🇩 Moldavsko 🌍 Mix
```

### Step 3: Textura (4 tlačítka s SVG ikonami)

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  ─── ───   │ │  ~~~ ~~~   │ │  〰〰〰    │ │  ∿∿∿∿∿    │
│   Rovné    │ │Mírně vlnité│ │   Vlnité   │ │  Kudrnaté  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Step 4: Barva (10 swatch tlačítek — stejné jako nyní)

```
○ ○ ○ ○ ○ ○ ○ ○ ○ ●
1 2 3 4 5 6 7 8 9 10
```

### Step 5: Délka (button chips)

```
[20cm] [25cm] [30cm] [35cm] [40cm] [45cm] [50cm] [55cm] [60cm] [65cm] [70cm]
```

Nabídnout i custom délku (input pro nestandardní délky).

### Step 6: Zásobování (supplier, cena, gramáž, datum)

Stejné jako nyní — supplier dropdown, purchase price, totalGrams, stockedAt, note.

### Vizuální souhrn nad formulářem:

Po každém kroku zobrazit vybrané atributy jako badge řadu:

```
[VIRGIN ✕] [🇺🇦 Ukrajina ✕] [Rovné ✕] [Blond ✕] [40 cm ✕]
```

Kliknutí na ✕ vrátí na daný krok.

---

## 4. VLIV NA PRODUCT-LEVEL KARTY (ProductGridCard)

### Současný stav ProductGridCard:

ProductGridCard zobrazuje Product s AGREGOVANÝMI daty z variant:
- `uniqueLengths` — deduplikované délky ze skladových variant
- `uniqueColors` — deduplikované barvy
- `minRetailPrice / maxRetailPrice` — rozsah cen
- `totalStock` — součet gramů

### Po redesignu:

Pokud 1 Product = 1 kategorie+origin+texture (a length+color na Variant):
- **Nic se nemění** — ProductGridCard už funguje správně
- Každý Product bude mít méně variant (jen ty co se naskladnily)
- Ale stále může mít víc variant (různé délky × barvy)

Pokud 1 Product = 1 konkrétní položka (i length+color na Product):
- ProductGridCard nepotřebuje `variants[]` — vše je na Product
- Zjednoduší se na: 1 délka, 1 barva, 1 cena, 1 stock
- **ALE:** Task #18 Strategie A (plné zrušení Variant) má vysoké riziko

### DOPORUČENÍ pro ProductGridCard:

Zachovat současný model. Nový stock-in bude:
1. Find-or-create Product (category + origin + texture)
2. Find-or-create Variant (productId + color + lengthCm)
3. ProductGridCard zůstane stejný

---

## 5. CO SE STANE S EXISTUJÍCÍMI 4 PRODUKTY A JEJICH VARIANTAMI

### Současný stav (předpoklad):

```
Product "Virgin vlasy" (origin: Ukrajina, texture: Rovné)
  ├── Variant: 30cm, color 1 (blond)
  ├── Variant: 40cm, color 1 (blond)
  ├── Variant: 30cm, color 5 (hnědá)
  └── ... (N variant)

Product "Premium vlasy" (origin: Bělorusko, texture: ?)
Product "Standard vlasy" (origin: Írán, texture: ?)
Product "Sale vlasy" (origin: Vietnam, texture: ?)
```

### Po redesignu:

Existující produkty a varianty **ZŮSTANOU** — žádná destruktivní migrace.

**Co se změní:**
1. Nový stock-in vytvoří nové Product+Variant pokud neexistují
2. Staré produkty zůstanou funkční — mají deliveries, sales history
3. Postupně se vytvoří nové produkty s přesnějšími atributy

**Příklad nového stavu:**
```
Product "Virgin vlasy" (old — origin: Ukrajina, texture: Rovné)
  ├── Variant: 30cm, color 1 — stávající stock
  └── ...

Product "Virgin Ukrajina Rovné" (new — origin: Ukrajina, texture: Rovné)
  ├── Variant: 40cm, color 3 — nový stock-in
  └── ...

Product "Virgin Kazachstán Vlnité" (new — origin: Kazachstán, texture: Vlnité)
  ├── Variant: 50cm, color 7 — nový stock-in
  └── ...
```

### Migrace starých produktů (VOLITELNÁ):

Pokud uživatel chce, staré produkty lze "rozdělit" — ale to je separate task. Stock-in redesign to NEVYŽADUJE.

---

## 6. IMPLEMENTAČNÍ PLÁN

### Krok 1: Nový stock-in formulář (StockInForm.tsx)

**Přepsat** celý formulář na krokový wizard:

```
State:
  step: 1-6
  category: string
  origin: string
  texture: string
  color: string
  lengthCm: number
  supplierId: string
  purchasePrice: number
  totalGrams: number
  stockedAt: string
  note: string
```

Odhadovaná velikost: ~400 řádků (podobně jako nyní, ale jiná struktura).

### Krok 2: Nový API endpoint nebo rozšíření POST /api/deliveries

Dvě možnosti:

**A) Rozšířit POST /api/deliveries (DOPORUČENO):**

```typescript
// Nový body format:
{
  // Místo variantId:
  category: "VIRGIN",
  origin: "Ukrajina",
  texture: "Rovné",
  color: "3",
  lengthCm: 40,
  
  // Stejné jako dříve:
  supplierId: "...",
  purchasePricePerGramRaw: 5000,
  currency: "CZK",
  exchangeRate: 10000,
  totalGrams: 200,
  ...
}
```

API endpoint pak:
1. Find Product WHERE { category, origin, texture, archived: false }
2. Pokud neexistuje → vytvoř Product + Variant
3. Pokud existuje → find Variant WHERE { productId, color, lengthCm }
4. Pokud Variant neexistuje → vytvoř Variant s wholesalePricePerGram z PriceSettings
5. stockIn({ variantId, ... })

**B) Nový endpoint POST /api/inventory/stock-in:**

Dedicat endpoint jen pro stock-in s find-or-create logikou. Stávající /api/deliveries zůstane pro přímé dodávky s variantId.

### Krok 3: Validace (delivery.ts)

Nové Zod schema pro stock-in:

```typescript
export const newStockInSchema = z.object({
  category: z.enum(["VIRGIN", "PREMIUM", "STANDARD", "SALE"]),
  origin: z.string().min(1),
  texture: z.string().min(1),
  color: z.string().min(1),
  lengthCm: z.number().int().positive().max(150),
  wholesalePricePerGram: z.number().int().positive().optional(),
  // ... rest same as stockInSchema
  supplierId: z.string().min(1),
  purchasePricePerGramRaw: z.number().int().positive(),
  currency: z.enum(["CZK", "USD", "EUR", "UAH"]),
  exchangeRate: z.number().int().positive(),
  totalGrams: z.number().int().positive(),
  totalPieces: z.number().int().min(0),
  stockedAt: z.string().datetime().optional(),
  note: z.string().max(1000).optional(),
});
```

### Krok 4: stock-in/page.tsx

Zjednodušit — nepotřebuje předem načítat products+variants. Stačí suppliers.

```typescript
// Staré:
const products = await prisma.product.findMany({ include: variants });
// Nové:
const suppliers = await prisma.supplier.findMany({ where: { archived: false } });
```

Products se hledají/vytvářejí na backendu při submit.

### Krok 5: Auto-slug generování

```typescript
function generateStockInSlug(category: string, origin: string, texture: string, lengthCm: number, color: string): string {
  const colorName = getHairColor(color).nameKey; // "c3" → potřeba mapování na text
  return slugify(`${category}-${origin}-${texture}-${lengthCm}cm`);
  // Příklad: "virgin-ukrajina-rovne-40cm"
}
```

---

## SOUBORY K ÚPRAVĚ

| Soubor | Akce | Rozsah |
|--------|------|--------|
| `src/components/inventory/StockInForm.tsx` | **PŘEPSAT** — krokový wizard | ~400 řádků |
| `src/app/(app)/inventory/stock-in/page.tsx` | **UPRAVIT** — zjednodušit query | ~20 řádků |
| `src/app/api/deliveries/route.ts` | **UPRAVIT** — přidat find-or-create logiku do POST | ~50 řádků navíc |
| `src/lib/validations/delivery.ts` | **PŘIDAT** — nový `newStockInSchema` | ~20 řádků |
| `src/lib/stock-in.ts` | **BEZ ZMĚNY** — stále přijímá variantId | 0 |

**Celkem: 4 soubory k úpravě, ~490 řádků, ŽÁDNÁ DB migrace, ŽÁDNÁ změna schématu.**

---

## RIZIKO

| Faktor | Úroveň | Popis |
|--------|--------|-------|
| DB migrace | **ŽÁDNÉ** | Žádné ALTER TABLE, žádné schema changes |
| Stávající data | **BEZPEČNÉ** | Staré produkty/varianty zůstanou |
| FIFO/Stock logika | **BEZ ZMĚNY** | stock-in.ts stále dostane variantId |
| Rollback | **SNADNÝ** | Revert 4 souborů |

**CELKOVÉ RIZIKO: NÍZKÉ**

---

## SHRNUTÍ

Redesign stock-in formuláře je **bezpečná, izolovaná změna** v 4 souborech bez DB migrace. Nový formulář:
- Krokový wizard: Kategorie → Původ → Textura → Barva → Délka → Zásobování
- Automaticky vytváří Product+Variant pokud neexistují
- Zachovává celý FIFO/stock/sales backend beze změny
- Staré produkty zůstanou funkční

---
