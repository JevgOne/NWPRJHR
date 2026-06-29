# TASK #22 — PLÁN: Redesign stock-in formuláře

**Datum:** 2026-06-28
**Agent:** planovac
**Verze:** 5 (doplněny přesné hodnoty dropdownů — délky 40-100cm)

---

## ZADÁNÍ UŽIVATELE

> "PRVNE NAZEV TECH VLASU, PAK PUVOD TEN MUSI BEJT K VYBERU, PAK BARVU, DELKU A STRUKTURU"
> "PANENSKE VLASY JSOU VSUDE NE JEN NA UKRAJINE"

**OPRAVA:** "Název vlasů" = výběr ze 4 kategorií (Panenské Vlasy / Premium Vlasy / Standard Vlasy / Výprodej), NE volný text. Vždy CELÉ NÁZVY, žádné zkratky — v dropdownech i na kartách.

**Požadované pořadí:** KATEGORIE → PŮVOD → BARVA → DÉLKA → STRUKTURA → zásobování

**Klíčový koncept:** Každé naskladnění = find-or-create produkt. Produkt = konkrétní položka s auto-generovaným názvem z kategorie+původ+struktura. Žádné matice variant.

---

## SOUČASNÝ STAV — CO JE ŠPATNĚ

### Soubory:

| Soubor | Řádků | Problém |
|--------|-------|---------|
| `src/components/inventory/StockInForm.tsx` | 393 | Vybírá existující produkt → barvu → délku z variant |
| `src/app/(app)/inventory/stock-in/page.tsx` | 54 | Načítá products+variants z DB |
| `src/app/api/deliveries/route.ts` | 89 | POST přijímá `variantId` |
| `src/lib/stock-in.ts` | 94 | `stockIn({ variantId, ... })` |
| `src/lib/validations/delivery.ts` | 47 | `stockInSchema` vyžaduje `variantId` |

### Současný flow:

```
1. Dropdown: vyber 1 ze 4 produktů (Virgin/Premium/Standard/Sale)
   → origin, texture, colorTone FIXNÍ na produktu
2. Swatch buttons: vyber barvu z existujících variant
3. Chip buttons: vyber délku z variant filtrovaných podle barvy
   → resolve variantId z [productId + color + lengthCm]
4. Vyplň: dodavatel, cena, gramáž, datum
5. Submit → POST /api/deliveries { variantId, ... }
```

**Problémy:**
- Origin fixní — Virgin = vždy Ukrajina, ale panenské vlasy jsou VŠUDE
- Varianta musí existovat předem — nelze naskladnit novou kombinaci
- 4 "produkty" jsou kategorie, ne produkty
- Nelze zadat vlastní název

---

## NOVÝ FLOW — KROKOVÝ FORMULÁŘ

### Pořadí kroků (přesně podle uživatele):

```
Step 1: KATEGORIE (4 velká tlačítka)
        [Panenské Vlasy] [Premium Vlasy] [Standard Vlasy] [Výprodej]
        Mapování: Panenské=VIRGIN, Premium=PREMIUM, Standard=STANDARD, Výprodej=SALE
        Lokalizované názvy: tCategory("virgin") atd.

Step 2: PŮVOD (grid tlačítek s vlajkami — VŠECHNY z ORIGIN_OPTIONS)
        Zdroj: ORIGIN_OPTIONS z src/lib/origin-flags.ts (15 položek)
        Přesný seznam:
        🇺🇦 Ukrajina  🇧🇾 Bělorusko  🇲🇩 Moldavsko  🇷🇺 Rusko
        🇰🇿 Kazachstán 🇺🇿 Uzbekistán 🇹🇷 Turecko   🇮🇷 Írán
        🇮🇳 Indie      🇻🇳 Vietnam    🇸🇾 Sýrie     🇨🇳 Čína
        🇲🇳 Mongolsko  🇬🇪 Gruzie     🌍 Mix
        ŽÁDNÝ custom input — pouze tyto předdefinované hodnoty.

Step 3: BARVA (10 swatch buttons)
        Zdroj: COLOR_CODES + HAIR_COLORS z src/lib/hair-colors.ts
        Přesný seznam (kód → název):
        1=Platinová, 2=Světle blond, 3=Zlatavě blond, 4=Medová,
        5=Karamelová, 6=Světle hnědá, 7=Středně hnědá, 8=Tmavě hnědá,
        9=Tmavá, 10=Černá

Step 4: DÉLKA (chip buttons — fixní seznam)
        Přesný seznam: [40] [45] [50] [55] [60] [65] [70] [75] [80] [85] [90] [95] [100] cm
        13 hodnot, žádný custom input.

Step 5: STRUKTURA (4 tlačítka s SVG ikonami)
        Zdroj: TEXTURE_OPTIONS z src/lib/hair-textures.ts
        Přesný seznam:
        [─── Rovné] [~~~ Mírně vlnité] [〰 Vlnité] [∿ Kudrnaté]
        Používá <TextureSwatch> komponentu pro ikony.

Step 6: ZÁSOBOVÁNÍ (stávající pole)
        - Dodavatel (dropdown z suppliers)
        - Nákupní cena (Kč/g)
        - Velkoobchodní cena (Kč/g) — NOVÉ, pro Variant
        - Celkem gramů
        - Datum naskladnění
        - Poznámka
```

### Auto-generovaný název produktu:

Název se NEVYPLŇUJE ručně — generuje se automaticky z vybraných atributů:

```typescript
// Příklady:
"Panenské Vlasy Ukrajina Rovné"     // VIRGIN + Ukrajina + Rovné
"Premium Vlasy Kazachstán Vlnité"   // PREMIUM + Kazachstán + Vlnité
"Standard Vlasy Vietnam Kudrnaté"   // STANDARD + Vietnam + Kudrnaté

// Generování:
const categoryNames = { VIRGIN: "Panenské Vlasy", PREMIUM: "Premium Vlasy", STANDARD: "Standard Vlasy", SALE: "Výprodej" };
const name = `${categoryNames[category]} ${origin} ${texture}`;
```

### Vizuální souhrn — badge řada nad formulářem:

Po každém kroku zobrazit vybrané atributy:

```
[Panenské Vlasy ✕] [🇺🇦 Ukrajina ✕] [●Blond ✕] [40 cm ✕] [─── Rovné ✕]
```

Kliknutí na ✕ vrátí na daný krok.

---

## BACKEND LOGIKA — CO SE STANE PŘI SUBMIT

### Nový POST /api/deliveries flow:

```
1. Přijmi body: { category, origin, color, lengthCm, texture,
                   supplierId, purchasePricePerGramRaw, wholesalePricePerGram,
                   totalGrams, stockedAt, note }

2. AUTO-GENERUJ NÁZEV:
   categoryNames = { VIRGIN: "Panenské Vlasy", PREMIUM: "Premium Vlasy", ... }
   name = `${categoryNames[category]} ${origin} ${texture}`
   // Příklad: "Panenské Vlasy Ukrajina Rovné"

3. FIND-OR-CREATE PRODUCT:
   Hledej: prisma.product.findFirst({ where: { category, origin, texture, archived: false } })
   Pokud neexistuje:
   prisma.product.create({
     name: name,  // auto-generovaný
     category: body.category,
     processingType: "OTHER",  // default — surové vlasy
     origin: body.origin,
     texture: body.texture,
     colorTone: autoColorTone(body.color),  // auto z barvy
     slug: await generateUniqueSlug(name, origin, lengthCm),
     photos: "[]",
   })

3. VYTVOŘ 1 VARIANT pro tento produkt:
   prisma.variant.create({
     productId: newProduct.id,
     lengthCm: body.lengthCm,
     color: body.color,
     wholesalePricePerGram: body.wholesalePricePerGram,
     retailPricePerGram: calculateRetailPrice(wholesalePrice, markupPercent),
     costPricePerGram: body.purchasePricePerGramRaw,
   })

4. NASKLADNI (stávající logika):
   stockIn({
     variantId: newVariant.id,
     supplierId: body.supplierId,
     purchasePricePerGramRaw: body.purchasePricePerGramRaw,
     currency: "CZK",
     exchangeRate: 10000,
     totalGrams: body.totalGrams,
     ...
   })

5. Vrať response s productId, productName, productSlug, barcode
```

### Alternativa: FIND-OR-CREATE (doporučení plánovače)

Uživatel říká "každé naskladnění = nový produkt". Ale co když naskladní stejné vlasy dvakrát? 2 identické produkty v nabídce je špatně.

**DOPORUČUJI přidat check:**
```
Před vytvořením nového produktu:
→ Existuje Product WHERE { name, origin, texture, category, archived: false }
  A Variant WHERE { productId, color, lengthCm }?
→ ANO: použij existující variantId, NEVYTVÁŘEJ nový produkt
→ NE: vytvoř nový Product + Variant
```

Toto je TRANSPARENTNÍ pro uživatele — formulář je stejný, ale systém nevytváří duplikáty.

**Zobrazit uživateli po submit:**
- "Naskladněno do existujícího produktu: Panenské Vlasy rovné blond (40cm, Ukrajina)" 
- nebo "Vytvořen nový produkt: Panenské Vlasy rovné blond (40cm, Ukrajina)"

---

## SCHEMA OTÁZKY

### Product.category je POVINNÝ enum

```prisma
category ProductCategory  // NOT optional — no default
```

Uživatel v zadání nezmiňuje kategorii. Řešení:
1. **Přidat jako krok 6** (4 tlačítka) — DOPORUČENO
2. Nebo default `VIRGIN` a možnost změnit v admin

### Product.processingType je POVINNÝ enum

```prisma
processingType ProcessingType  // NOT optional — no default
```

Hairland prodává surové vlasy → default `OTHER`. Uživatel nemusí vybírat.

### Variant potřebuje wholesalePricePerGram

Variant vyžaduje `wholesalePricePerGram Int` (ne nullable). Stock-in formulář musí mít pole pro velkoobchodní cenu. Retail se pak dopočítá z PriceSettings markup.

### Slug musí být unikátní

```prisma
slug String? @unique
```

Generování: `slugify(name)` + deduplikace (přidat `-2`, `-3` pokud existuje).

---

## IMPLEMENTAČNÍ PLÁN — KROK ZA KROKEM

### Krok 1: Nový StockInForm.tsx (~450 řádků)

**Přepsat celý soubor.** Nová struktura:

```typescript
// State
interface StockInState {
  step: number;           // 1-6
  category: string;       // VIRGIN/PREMIUM/STANDARD/SALE
  origin: string;         // z ORIGIN_OPTIONS (15 zemí, žádný custom)
  color: string;          // "1"-"10" z COLOR_CODES
  lengthCm: number;       // 40-100 (fixní seznam: 40,45,50,...,100)
  texture: string;        // z TEXTURE_OPTIONS
  supplierId: string;
  purchasePrice: string;  // nákupní Kč/g
  wholesalePrice: string; // velkoobchodní Kč/g
  totalGrams: string;
  stockedAt: string;
  note: string;
}
// Název se NEGENERUJE v state — auto-generuje se na backendu z category+origin+texture
```

**Props — ZJEDNODUŠIT:**

```typescript
// Staré:
interface Props { products: ProductOption[]; suppliers: SupplierOption[]; }

// Nové — nepotřebuje products (vytváří se na backendu):
interface Props { suppliers: SupplierOption[]; }
```

**UI pattern — krokový formulář:**

```
┌────────────────────────────────────────────┐
│ Naskladnění                                │
│                                            │
│ Souhrn: [badge] [badge] [badge] ...        │
│ ─────────────────────────────────          │
│                                            │
│ Step X: [aktuální krok]                    │
│                                            │
│ [content — input / buttons]                │
│                                            │
│ [← Zpět]              [Další →]           │
└────────────────────────────────────────────┘
```

**Každý krok zobrazuje HEADER s číslem a popisem, CONTENT, a NAVIGACI.**

Step 1 (Kategorie): 4 velká tlačítka [Panenské Vlasy, Premium Vlasy, Standard Vlasy, Výprodej]
Step 2 (Původ): Grid 15 tlačítek s vlajkami z `ORIGIN_OPTIONS` (žádný custom input)
Step 3 (Barva): 10 swatch buttons z `COLOR_CODES` + `HAIR_COLORS`
Step 4 (Délka): 13 chip buttons [40,45,50,55,60,65,70,75,80,85,90,95,100] cm (žádný custom)
Step 5 (Textura): 4 tlačítka z `TEXTURE_OPTIONS` s `<TextureSwatch>` ikonami
Step 6 (Zásobování): Supplier dropdown, purchase price, wholesale price, grams, date, note

**Importy:**
```typescript
import { ORIGIN_OPTIONS, getOriginFlag } from "@/lib/origin-flags";
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { HAIR_COLORS, COLOR_CODES, getHairColor } from "@/lib/hair-colors";
import { TextureSwatch } from "@/components/TextureSwatch";

// Délky — nová konstanta (neexistuje v kódu, přidat do StockInForm nebo nový soubor):
const LENGTH_OPTIONS = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

// Kategorie — mapování na české názvy:
const CATEGORIES = [
  { value: "VIRGIN", label: "Panenské Vlasy" },
  { value: "PREMIUM", label: "Premium Vlasy" },
  { value: "STANDARD", label: "Standard Vlasy" },
  { value: "SALE", label: "Výprodej" },
] as const;
// NOTE: label by měl být lokalizovaný přes tCategory("virgin") atd.
```

### Krok 2: Zjednodušit stock-in/page.tsx

```typescript
// PŘED (54 řádků):
const [products, suppliers] = await Promise.all([
  prisma.product.findMany({ include: variants }),
  prisma.supplier.findMany(...)
]);
<StockInForm products={productOptions} suppliers={supplierOptions} />

// PO (~30 řádků):
const suppliers = await prisma.supplier.findMany({
  where: { archived: false },
  orderBy: { name: "asc" },
});
<StockInForm suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))} />
```

Nepotřebuje products query — produkt se vytváří na backendu.

### Krok 3: Rozšířit POST /api/deliveries/route.ts

Přidat druhou cestu pro nový stock-in format:

```typescript
export async function POST(request: NextRequest) {
  // ... auth check ...
  const body = await request.json();
  
  // DETECT FORMAT: nový (má name+origin) vs starý (má variantId)
  if (body.variantId) {
    // STARÝ FORMAT — zachovat pro kompatibilitu
    return handleLegacyStockIn(body, session);
  }
  
  // NOVÝ FORMAT — create product + variant + stock-in
  const parsed = newStockInSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  
  const data = parsed.data;
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Find-or-create Product
    let product = await tx.product.findFirst({
      where: {
        name: data.name,
        origin: data.origin,
        texture: data.texture,
        category: data.category,
        archived: false,
      },
      include: { variants: { where: { color: data.color, lengthCm: data.lengthCm } } },
    });
    
    let variant;
    
    if (product && product.variants.length > 0) {
      // Existující produkt + varianta
      variant = product.variants[0];
    } else if (product) {
      // Existující produkt, nová varianta (jiná barva/délka)
      const priceSetting = await tx.priceSettings.findUnique({ where: { category: data.category } });
      const markupPercent = priceSetting?.markupPercent ?? 0;
      variant = await tx.variant.create({
        data: {
          productId: product.id,
          lengthCm: data.lengthCm,
          color: data.color,
          wholesalePricePerGram: data.wholesalePricePerGram,
          retailPricePerGram: calculateRetailPrice(data.wholesalePricePerGram, markupPercent),
          costPricePerGram: data.purchasePricePerGramRaw,
        },
      });
    } else {
      // Nový produkt + nová varianta
      const slug = await generateUniqueSlug(data.name, data.origin, data.lengthCm, tx);
      product = await tx.product.create({
        data: {
          name: data.name,
          category: data.category as ProductCategory,
          processingType: "OTHER",
          origin: data.origin,
          texture: data.texture,
          colorTone: autoColorTone(data.color),
          slug,
          photos: "[]",
        },
      });
      const priceSetting = await tx.priceSettings.findUnique({ where: { category: data.category } });
      const markupPercent = priceSetting?.markupPercent ?? 0;
      variant = await tx.variant.create({
        data: {
          productId: product.id,
          lengthCm: data.lengthCm,
          color: data.color,
          wholesalePricePerGram: data.wholesalePricePerGram,
          retailPricePerGram: calculateRetailPrice(data.wholesalePricePerGram, markupPercent),
          costPricePerGram: data.purchasePricePerGramRaw,
        },
      });
    }
    
    return { product, variant };
  });
  
  // 2. Stock-in (existing function)
  const delivery = await stockIn({
    variantId: result.variant.id,
    supplierId: data.supplierId,
    purchasePricePerGramRaw: data.purchasePricePerGramRaw,
    currency: "CZK",
    exchangeRate: 10000,
    totalGrams: data.totalGrams,
    totalPieces: 0,
    barcode: generateBarcode(),
    stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
    note: data.note,
  }, session.user.id);
  
  return NextResponse.json({
    ...delivery,
    productId: result.product.id,
    productName: result.product.name,
    productSlug: result.product.slug,
    isNewProduct: !existedBefore,
  }, { status: 201 });
}
```

### Krok 4: Nový Zod schema (validations/delivery.ts)

```typescript
export const newStockInSchema = z.object({
  // Produktové atributy (název se auto-generuje na backendu)
  category: z.enum(["VIRGIN", "PREMIUM", "STANDARD", "SALE"]),
  origin: z.string().min(1).max(200),
  color: z.string().min(1).max(100),
  lengthCm: z.number().int().positive().max(150),
  texture: z.string().min(1).max(200),
  
  // Cenové
  wholesalePricePerGram: z.number().int().positive(),
  
  // Zásobovací (stejné jako stávající)
  supplierId: z.string().min(1),
  purchasePricePerGramRaw: z.number().int().positive(),
  totalGrams: z.number().int().positive(),
  stockedAt: z.string().datetime().optional(),
  note: z.string().max(1000).optional(),
});
```

### Krok 5: Helper funkce

**autoColorTone** — mapování color code → colorTone:

```typescript
// Přidat do src/lib/hair-colors.ts nebo nový soubor
function autoColorTone(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "Blond", "2": "Blond", "3": "Blond", "4": "Blond",
    "5": "Hnědá", "6": "Hnědá", "7": "Hnědá",
    "8": "Tmavě hnědá", "9": "Tmavě hnědá", "10": "Tmavě hnědá",
  };
  return map[colorCode] ?? "Hnědá";
}
```

**generateUniqueSlug** — slug s deduplikací:

```typescript
async function generateUniqueSlug(name: string, origin: string, lengthCm: number, tx: TransactionClient): Promise<string> {
  const base = slugify(`${name}-${origin}-${lengthCm}cm`);
  let slug = base;
  let counter = 1;
  while (await tx.product.findUnique({ where: { slug } })) {
    slug = `${base}-${++counter}`;
  }
  return slug;
}
```

---

## CO SE STANE S EXISTUJÍCÍMI DATY

### Existující 4 produkty + varianty:
- **ZŮSTANOU** beze změny — žádná destruktivní migrace
- Mají deliveries, sales, orders — FK integrita zachována
- Zobrazí se v nabídce vedle nových produktů
- Uživatel je může ručně archivovat v admin (archived: true)

### Seed varianty (10 délek × 10 barev = 100 per product):
- Varianty bez deliveries nemají stock → `availableGrams = 0`
- Na offer stránce se zobrazí jako "Vyprodáno" nebo se skryjí (záleží na filtru)
- Neškodí — jsou jen v DB, nezobrazují se pokud nemají stock

---

## SOUBORY K ÚPRAVĚ — PŘEHLED

| Soubor | Akce | Řádky změny |
|--------|------|-------------|
| `src/components/inventory/StockInForm.tsx` | **PŘEPSAT** — krokový wizard | ~450 (celý soubor) |
| `src/app/(app)/inventory/stock-in/page.tsx` | **ZJEDNODUŠIT** — jen suppliers | ~30 → ~25 |
| `src/app/api/deliveries/route.ts` | **ROZŠÍŘIT** — nový format + find-or-create | +~60 řádků |
| `src/lib/validations/delivery.ts` | **PŘIDAT** — `newStockInSchema` | +~15 řádků |
| `src/lib/hair-colors.ts` | **PŘIDAT** — `autoColorTone()` | +~10 řádků |

**Celkem: 5 souborů, ~560 řádků změn**

### CO SE NEMĚNÍ:
- `src/lib/stock-in.ts` — stále přijímá `variantId` ✓
- `src/lib/fifo.ts` — beze změny ✓
- `src/lib/stock.ts` — beze změny ✓
- `prisma/schema.prisma` — beze změny ✓
- Žádná DB migrace, žádný ALTER TABLE ✓

---

## RIZIKO

| Faktor | Úroveň |
|--------|--------|
| DB migrace | **ŽÁDNÉ** |
| Stávající data | **BEZPEČNÉ** — staré produkty zůstanou |
| FIFO/Stock/Sales | **BEZ ZMĚNY** — stock-in.ts stále dostane variantId |
| Rollback | **SNADNÝ** — revert 5 souborů |
| Kompatibilita | **ZACHOVÁNA** — starý variantId format stále funguje |

**CELKOVÉ RIZIKO: NÍZKÉ**

---

## OTEVŘENÉ OTÁZKY PRO UŽIVATELE

1. ~~**Kategorie:** Vyřešeno — je to Step 1 (výběr ze 4 možností).~~
2. **Velkoobchodní cena:** Variant vyžaduje `wholesalePricePerGram`. Přidat pole do formuláře, nebo dopočítat z nákupní ceny + markup z PriceSettings?
3. **Fotky:** Nový produkt bude bez fotek. Přidat upload do stock-in formuláře, nebo později v admin?
4. **Překlady (nameUk, nameRu):** Auto-generovaný název bude jen v CZ. Přidat auto-překlad, nebo ručně v admin?

---
