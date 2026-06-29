# TASK #18 — PREDELAT: Offer stranka — produkty misto variant

**Datum:** 2026-06-28
**Agent:** planovac
**Priorita:** KRITICKE

---

## SOUCASNY STAV

### Offer stranka (ProductsShowcase.tsx)

Aktualne **flattenuje** produkty na individualni varianty (r.162-172):
```tsx
products.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
```

Vysledek: Pokud produkt ma 5 delek x 3 barvy = **15 karet** pro JEDEN produkt. Uzivatel vidi 15 "ruznych" karet ktere jsou ve skutecnosti stejny produkt s ruznou delkou/barvou.

### Homepage (HeroProductSlider.tsx)

Pouziva STEJNY variant-based pristup — flattenuje a bere top 4.

### ProductCard.tsx

Aktualni interface ocekava **1 variant** (`ProductCardVariant` s `lengthCm`, `color`, `retailPricePerGram`, `availableGrams`).

---

## POZADOVANY STAV

### 1 karta = 1 PRODUKT

Karta zobrazuje:
- Fotka produktu
- Category badge (VIRGIN/PREMIUM/STANDARD/SALE)
- Origin badge + Texture badge + ColorTone badge
- Nazev produktu (lokalizovany)
- **VSECHNY delky** jako chipy (napr. "30 cm | 40 cm | 50 cm | 60 cm")
- **VSECHNY barvy** jako male swatch krouzky
- **Cenovy rozsah** (napr. "35–52 Kc/g") nebo min cena ("od 35 Kc/g")
- **Celkovy stock** (soucet vsech variant) nebo "Skladem" / "Vyprodano"
- Cela karta je `<Link>` na `/offer/{slug}`

---

## ARCHITEKTURA ZMENY

### Varianta A: NOVY komponent `ProductGridCard.tsx` (DOPORUCENO)

Vytvorit NOVY komponent pro product-level kartu. Stary `ProductCard.tsx` (variant-level) ZACHOVAT pro pripadne jine pouziti (salon portal, admin).

**Duvod:** Interfacy jsou fundamentalne odlisne. Variant karta ma `variant: { lengthCm, color, retailPricePerGram }`. Produktova karta ma `product: { variants: [...] }` a zobrazuje AGREGATY.

### Varianta B: Refaktor `ProductCard.tsx` na dual-mode

Pridat `mode: "variant" | "product"` prop. NEDOPORUCENO — prilis slozity, dva uplne jine renderovaci logiky v jednom komponentu.

---

## IMPLEMENTACNI PLAN

### Krok 1: Vytvorit `src/components/public/ProductGridCard.tsx`

**Props:**
```tsx
interface ProductGridCardProps {
  product: {
    id: string;
    slug: string | null;
    name: string;
    nameUk: string | null;
    nameRu: string | null;
    category: string;
    origin: string | null;
    texture: string | null;
    colorTone: string | null;
    photos: string[];
    variants: {
      lengthCm: number;
      color: string;
      retailPricePerGram: number;
      wholesalePricePerGram?: number;
      availableGrams: number;
    }[];
  };
  userRole?: string | null;
  discountPct?: number;
  // Filter callbacks (pro offer stranku)
  onCategoryClick?: (category: string) => void;
  onOriginClick?: (origin: string) => void;
  onTextureClick?: (texture: string) => void;
  onColorToneClick?: (colorTone: string) => void;
  activeOriginFilter?: string;
  activeTextureFilter?: string;
  activeColorToneFilter?: string;
}
```

**Render logika:**

```
+----------------------------------+
|  [FOTKA produktu]                |
|  [CATEGORY BADGE]  (top-left)    |
+----------------------------------+
|  [Origin] [Texture] [ColorTone]  |  <- badges
|                                  |
|  Nazev produktu                  |  <- lokalizovany, line-clamp-2
|                                  |
|  30cm  40cm  50cm  60cm          |  <- delky jako chipy
|                                  |
|  (o)(o)(o)(o)(o)                 |  <- barvy jako male swatch krouzky
|                                  |
|  od 35 Kc/g          420 g      |  <- min cena + celkovy stock
+----------------------------------+
```

**Agregace z variant:**
```tsx
const uniqueLengths = [...new Set(product.variants.map(v => v.lengthCm))].sort((a, b) => a - b);
const uniqueColors = [...new Set(product.variants.map(v => v.color))].sort((a, b) => parseInt(a) - parseInt(b));
const minPrice = Math.min(...product.variants.filter(v => v.retailPricePerGram > 0).map(v => v.retailPricePerGram));
const maxPrice = Math.max(...product.variants.filter(v => v.retailPricePerGram > 0).map(v => v.retailPricePerGram));
const totalStock = product.variants.reduce((sum, v) => sum + v.availableGrams, 0);
```

**Cenovy display:**
```tsx
// Retail
const minDisplay = (minPrice / 100).toFixed(0);
const maxDisplay = (maxPrice / 100).toFixed(0);
const priceText = minPrice === maxPrice ? `${minDisplay} Kč/g` : `${minDisplay}–${maxDisplay} Kč/g`;

// B2B (salon/hairdresser) — pouzit min wholesale cenu
```

**Link:**
```tsx
const href = `/offer/${product.slug ?? product.id}`;
// BEZ ?color= a ?length= protoze nezobrazujeme konkretni variantu
```

**Interaktivita (stejny vzor jako ProductCard):**
```tsx
const isInteractive = !!onCategoryClick;
// Non-interactive: cela karta = <Link>
// Interactive: badges = <button>, foto+nazev = <Link>
```

### Krok 2: Upravit `ProductsShowcase.tsx`

**Zmeny:**
1. Import `ProductGridCard` misto `ProductCard`
2. ODSTRANIT variant flattening (r.162-172)
3. Renderovat `products` primo (1 karta = 1 produkt)
4. Razeni: podle celkoveho stocku (soucet variant) sestupne

```tsx
// PRED (variant-based):
const variantCards = products.flatMap((p) => p.variants.map((v) => ...));

// PO (product-based):
const sortedProducts = useMemo(() => {
  return [...products].sort((a, b) => {
    const stockA = a.variants.reduce((s, v) => s + v.availableGrams, 0);
    const stockB = b.variants.reduce((s, v) => s + v.availableGrams, 0);
    return stockB - stockA;
  });
}, [products]);
```

4. Grid: zachovat `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`
5. Pocet produktu: `t("offer.productCount", { count: sortedProducts.length })`

**Filtrovani:** Zachovat vse — API uz filtruje na urovni produktu. Filtr `color` a `lengthCm` filtruje pres `variants.some(...)` (uz implementovano v API r.36-44).

### Krok 3: Upravit `HeroProductSlider.tsx`

**Zmeny:**
1. Import `ProductGridCard` misto `ProductCard`
2. ODSTRANIT variant flattening (r.38-47)
3. Zobrazit top 4 PRODUKTY (podle celkoveho stocku)

```tsx
// PRED:
const cards = products.flatMap((p) => p.variants.filter(...).map(...)).slice(0, 4);

// PO:
const topProducts = useMemo(() => {
  return products
    .filter((p) => p.variants.some((v) => v.retailPricePerGram > 0 && v.availableGrams > 0))
    .sort((a, b) => {
      const stockA = a.variants.reduce((s, v) => s + v.availableGrams, 0);
      const stockB = b.variants.reduce((s, v) => s + v.availableGrams, 0);
      return stockB - stockA;
    })
    .slice(0, 4);
}, [products]);
```

4. Renderovat `<ProductGridCard product={p} />` BEZ `onCategoryClick` (staticke)

### Krok 4: Stary `ProductCard.tsx` — ZACHOVAT

Stary variant-based `ProductCard.tsx` NEZMAZAT. Muze byt pouzivan:
- V salon portalu (kde se objednava konkretni varianta)
- V admin panelu
- V budoucnosti pro jiny ucel

Pokud se nikde nepouziva, muze se smazat POZDEJI po overeni.

---

## DESIGN — DELKY A BARVY NA KARTE

### Delky jako chipy

```tsx
<div className="flex flex-wrap gap-1 mb-1">
  {uniqueLengths.map((cm) => (
    <span key={cm} className="px-1.5 py-0.5 rounded bg-nude-100 text-[10px] font-medium text-espresso">
      {cm} cm
    </span>
  ))}
</div>
```

### Barvy jako male swatche

```tsx
<div className="flex flex-wrap gap-1 mb-1.5">
  {uniqueColors.slice(0, 6).map((code) => (
    <span key={code} className="w-4 h-4 rounded-full border border-line overflow-hidden flex-shrink-0">
      <img src={`/swatches/color-${code}.png`} alt="" className="w-full h-full object-cover" />
    </span>
  ))}
  {uniqueColors.length > 6 && (
    <span className="text-[10px] text-muted self-center">+{uniqueColors.length - 6}</span>
  )}
</div>
```

Max 6 swatch krouzku + "+N" pro vice barev. Jinak by karta byla preplnena.

---

## SOUBORY K UPRAVE

| Soubor | Akce |
|--------|------|
| `src/components/public/ProductGridCard.tsx` | **NOVY** — product-level karta |
| `src/app/(public)/offer/ProductsShowcase.tsx` | UPRAVIT — pouzit ProductGridCard, odstranit flattening |
| `src/components/public/HeroProductSlider.tsx` | UPRAVIT — pouzit ProductGridCard, odstranit flattening |
| `src/components/public/ProductCard.tsx` | ZACHOVAT beze zmeny (variant-level, pro jine ucely) |
| API `/api/public/products/route.ts` | BEZ ZMENY — uz vraci produkty s variantami |

---

## DOPAD NA FILTROVANI

Vsechny filtry na /offer zustanou FUNKCNI:
- **Category:** API filtruje `where.category` — bez zmeny
- **Origin:** API filtruje `where.origin` — bez zmeny
- **Texture:** API filtruje `where.texture` — bez zmeny
- **ColorTone:** API filtruje `where.colorTone` — bez zmeny
- **Color:** API filtruje `variants.some({ color })` — vrati produkty ktere MAJI danou barvu
- **Length:** API filtruje `variants.some({ lengthCm })` — vrati produkty ktere MAJI danou delku
- **Search:** API filtruje `name/origin/description` — bez zmeny

Jedina zmena: vysledek neni flat seznam variant ale seznam PRODUKTU.

---

## DOPAD NA BUG #17 (homepage karty nejdou rozkliknout)

Tato zmena RESI bug #17 automaticky:
- `ProductGridCard` v non-interactive mode bude cela zabalena v `<Link href="/offer/{slug}">` 
- Kazda karta = 1 produkt = 1 link na detail

---

## CASOVA NAROCNOST

- `ProductGridCard.tsx`: ~100 radku — novy komponent (~30 min)
- `ProductsShowcase.tsx`: ~20 radku zmeny (~10 min)
- `HeroProductSlider.tsx`: ~15 radku zmeny (~5 min)
- Testovani: ~15 min

**Celkem: ~1 hodina**

---

## RIZIKA

1. **Salon portal** — pokud pouziva `ProductCard.tsx`, NEMENIME (zachovame stary komponent)
2. **Cart/inquiry** — uzivatel na detailu vybira konkretni variantu — BEZ ZMENY
3. **SEO** — URL se meni z `/offer/{slug}?color=X&length=Y` na `/offer/{slug}` — LEPSÍ pro SEO (canonical URL)
