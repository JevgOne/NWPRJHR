# TASK: Dynamický veřejný ceník — public stránka s cenami od-do

## Kontext

**Projekt:** `/Users/zen/NWPRJHR`

**Požadavek:** Nová veřejná stránka "Ceník" na `/cenik` (route `/[locale]/(public)/cenik/page.tsx`), která dynamicky generuje cenové rozsahy z aktuálního skladu a variant.

**Pravidla cenotvorby (z kódu):**
- `retailPricePerGram` = prodejní cena za gram (v haléřích), uložená na variantě
- `retailPricePerPiece` = prodejní cena za kus (BY_PIECE varianty)
- Marže: prodejní = nákupní x 2 (markup 100%), per-kategorie v `PriceSettings`
- B2B slevy 15-30% z prodejní — ceník je PUBLIC = plné retail ceny

**Existující data:**
- `getCachedAllProducts()` v `src/lib/cached-products.ts` — vrací všechny produkty s variantami + stock info, cached 60s
- Každá varianta má: `retailPricePerGram`, `retailPricePerPiece`, `sellingMode` (BY_GRAM | BY_PIECE), `lengthCm`, `color`, `availableGrams`, `availablePieces`
- Kategorie (enum `ProductCategory`): `VIRGIN`, `LUXE`, `STANDARD`, `SALE`, `ACCESSORY`
- Barvy: "1"-"10" (platinum blonde -> black)
- Délky: různé per varianta

**Existující ceník (jiný):** Stránka `/vykup` má "Orientační ceník" pro výkup vlasů — to je JINÁ věc (nákup vlasů od zákazníků). Nový ceník je pro PRODEJ vlasů zákazníkům.

**Reference stránka:** `/offer/page.tsx` — používá `getCachedAllProducts()`, `Breadcrumbs`, `getAlternates`, `getTranslations("public")`, `getLocale()`.

---

## Plán implementace

### KROK 1: Nová stránka `/cenik`

**Nový soubor:** `src/app/[locale]/(public)/cenik/page.tsx`

**Server component** — SSR/ISR s revalidací (využít `getCachedAllProducts()`):

```
Logika:
1. Fetch všechny produkty přes getCachedAllProducts()
2. Odfiltrovat ACCESSORY kategorii (příslušenství nemá cenu za gram)
3. Seskupit BY_GRAM varianty podle KATEGORIE (VIRGIN/LUXE/STANDARD/SALE)
4. V každé kategorii seskupit podle DÉLKY
5. Pro každou délku spočítat MIN a MAX retailPricePerGram (ze všech barev)
6. Zobrazit tabulku s rozsahy od-do
7. BY_PIECE varianty zobrazit v separátní sekci
8. Poznámka: "Cena je individuální dle konkrétního kusu"
```

**Layout stránky:**
```
+-------------------------------------------------+
| Breadcrumbs: Domu > Cenik                       |
+-------------------------------------------------+
| # Cenik vlasu                                   |
| Orientacni cenove rozsahy z aktualni nabidky.   |
| Cena zavisi na barve, kvalite a konkretnim kusu.|
+-------------------------------------------------+
|                                                 |
| ## Panenske Vlasy (VIRGIN)                      |
| +--------+------------------+                   |
| | Delka  | Cena za gram     |                   |
| +--------+------------------+                   |
| | 30 cm  | 35 - 45 Kc/g    |                   |
| | 40 cm  | 42 - 55 Kc/g    |                   |
| | 50 cm  | 55 - 70 Kc/g    |                   |
| | 60 cm  | 70 - 90 Kc/g    |                   |
| +--------+------------------+                   |
|                                                 |
| ## Luxe Vlasy (LUXE)                            |
| +--------+------------------+                   |
| | 30 cm  | 25 - 35 Kc/g    |                   |
| | ...    | ...              |                   |
| +--------+------------------+                   |
|                                                 |
| ## Culiky (BY_PIECE)                            |
| +-----------+--------+--------------+           |
| | Produkt   | Delka  | Cena za kus  |           |
| +-----------+--------+--------------+           |
| | Raw XY    | 40 cm  | 2 500 Kc     |           |
| | Raw XY    | 50 cm  | 3 200 Kc     |           |
| +-----------+--------+--------------+           |
|                                                 |
| (i) Cena je individualni dle konkretniho        |
|     kusu. Zavisi na barve, kvalite a            |
|     dostupnosti. Cenik se aktualizuje           |
|     automaticky dle aktualniho skladu.          |
|                                                 |
| [Zobrazit nabidku ->]                           |
+-------------------------------------------------+
```

### KROK 2: Datová logika

**Přímo v `page.tsx`** (server component, žádný client component potřeba):

```typescript
import { getCachedAllProducts, type CachedProduct } from "@/lib/cached-products";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { halereToCZK } from "@/lib/pricing";

// Typy
type PriceRange = { 
  lengthCm: number; 
  minPrice: number;  // haléře
  maxPrice: number;  // haléře
  hasStock: boolean;
};

type CategoryPrices = { 
  category: string; 
  label: string;
  ranges: PriceRange[];
};

type PieceProduct = {
  productName: string;
  lengthCm: number;
  minPrice: number;
  maxPrice: number;
  hasStock: boolean;
};

// Logika
const allProducts = await getCachedAllProducts();

// --- BY_GRAM varianty ---
const CATEGORY_ORDER = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;
const categoryLabels: Record<string, string> = {
  VIRGIN: t("pricelist.categoryVirgin"),
  LUXE: t("pricelist.categoryLuxe"),
  STANDARD: t("pricelist.categoryStandard"),
  SALE: t("pricelist.categorySale"),
};

const categoryPrices: CategoryPrices[] = [];

for (const cat of CATEGORY_ORDER) {
  const catProducts = allProducts.filter(p => p.category === cat);
  const allVariants = catProducts.flatMap(p => 
    p.variants.filter(v => v.sellingMode === "BY_GRAM" && v.retailPricePerGram > 0)
  );
  
  if (allVariants.length === 0) continue;
  
  // Seskupit podle délky
  const byLength = new Map<number, typeof allVariants>();
  for (const v of allVariants) {
    const arr = byLength.get(v.lengthCm) ?? [];
    arr.push(v);
    byLength.set(v.lengthCm, arr);
  }
  
  const ranges: PriceRange[] = [];
  for (const [length, variants] of byLength) {
    const prices = variants.map(v => v.retailPricePerGram);
    ranges.push({
      lengthCm: length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      hasStock: variants.some(v => v.availableGrams > 0),
    });
  }
  
  // Seřadit podle délky
  ranges.sort((a, b) => a.lengthCm - b.lengthCm);
  
  categoryPrices.push({
    category: cat,
    label: categoryLabels[cat] ?? cat,
    ranges,
  });
}

// --- BY_PIECE varianty ---
const byPieceProducts: PieceProduct[] = [];
for (const p of allProducts) {
  const pieceVariants = p.variants.filter(
    v => v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0
  );
  if (pieceVariants.length === 0) continue;
  
  // Seskupit podle délky
  const byLength = new Map<number, typeof pieceVariants>();
  for (const v of pieceVariants) {
    const arr = byLength.get(v.lengthCm) ?? [];
    arr.push(v);
    byLength.set(v.lengthCm, arr);
  }
  
  for (const [length, variants] of byLength) {
    const prices = variants.map(v => v.retailPricePerPiece ?? 0);
    byPieceProducts.push({
      productName: p.name,  // NOTE: use locale-specific name in JSX
      lengthCm: length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      hasStock: variants.some(v => v.availablePieces > 0),
    });
  }
}
byPieceProducts.sort((a, b) => a.lengthCm - b.lengthCm);
```

**Formátování cen:**
- Ceny jsou v haléřích -> dělit 100 pro Kč (`halereToCZK()` z `src/lib/pricing.ts`)
- Použít `Intl.NumberFormat("cs-CZ")` pro formát
- Pokud min === max, zobrazit jednu cenu (ne "45 - 45 Kč")
- Pokud žádné varianty v dané kategorii -> nezobrazovat kategorii

### KROK 3: Metadata a SEO

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("public"),
    getLocale(),
  ]);
  
  return {
    title: t("pricelist.metaTitle"),
    description: t("pricelist.metaDescription"),
    alternates: getAlternates("/cenik"),
    openGraph: {
      type: "website",
      title: `${t("pricelist.metaTitle")} | Hairland`,
      description: t("pricelist.metaDescription"),
      url: "https://www.hairland.cz/cenik",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
  };
}
```

### KROK 4: Navigace — přidat odkaz

**`src/components/public/PublicNavbar.tsx`** (řádek ~197-201):

Přidat "Ceník" do `offerItems` pole (dropdown "Nabídka"):
```typescript
const offerItems = [
  { href: "/offer", label: t("navbar.hair") },
  { href: "/ofiny", label: t("navbar.bangs") },
  { href: "/prislusenstvi", label: t("nav.accessories") },
  { href: "/cenik", label: t("navbar.pricelist") },  // NOVÉ
];
```

Přidat "Ceník" do mobile menu (řádek ~413-432, za příslusenství link):
```tsx
<Link
  href="/cenik"
  onClick={() => setMenuOpen(false)}
  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
    pathname.startsWith("/cenik") ? "text-rose bg-blush-100/50" : "text-ink hover:bg-nude-50"
  }`}
>
  {t("navbar.pricelist")}
</Link>
```

**`src/components/public/PublicFooter.tsx`** (řádek ~55-63):

Přidat "Ceník" do footer navigation sekce:
```tsx
<li><Link href="/cenik" className={linkClass}>{t("navbar.pricelist")}</Link></li>
```

### KROK 5: I18n klíče

Přidat do `messages/cs.json` pod namespace `public`:

```json
"pricelist": {
  "title": "Ceník vlasů",
  "metaTitle": "Ceník vlasů | Hairland",
  "metaDescription": "Orientační ceník prémiových vlasů. Ceny od-do dle délky, barvy a kategorie. Aktualizováno dle aktuálního skladu.",
  "subtitle": "Orientační cenové rozsahy z aktuální nabídky. Cena závisí na barvě, kvalitě a konkrétním kusu.",
  "perGram": "Kč/g",
  "perPiece": "Kč/ks",
  "length": "Délka",
  "priceRange": "Cena za gram",
  "pricePerPiece": "Cena za kus",
  "product": "Produkt",
  "inStock": "skladem",
  "onOrder": "na objednávku",
  "categoryVirgin": "Panenské vlasy",
  "categoryLuxe": "Luxe vlasy",
  "categoryStandard": "Standard vlasy",
  "categorySale": "Výprodej",
  "piecesTitle": "Hotové culíky (prodej na kusy)",
  "disclaimer": "Cena je individuální dle konkrétního kusu. Závisí na barvě, kvalitě a aktuální dostupnosti. Ceník se aktualizuje automaticky podle aktuálního skladu.",
  "viewOffer": "Zobrazit nabídku",
  "noProducts": "Zatím žádné produkty v této kategorii.",
  "updatedAutomatically": "Ceník se aktualizuje automaticky"
}
```

Přidat nav klíč:
```json
"navbar": {
  ...existující klíče...,
  "pricelist": "Ceník"
}
```

**`messages/uk.json`:**
```json
"pricelist": {
  "title": "Прайс-лист",
  "metaTitle": "Прайс-лист на волосся | Hairland",
  "metaDescription": "Орієнтовний прайс-лист на преміальне волосся. Ціни від-до за довжиною, кольором та категорією.",
  "subtitle": "Орієнтовні цінові діапазони з поточної пропозиції. Ціна залежить від кольору, якості та конкретного виробу.",
  "perGram": "Kč/г",
  "perPiece": "Kč/шт",
  "length": "Довжина",
  "priceRange": "Ціна за грам",
  "pricePerPiece": "Ціна за штуку",
  "product": "Продукт",
  "inStock": "в наявності",
  "onOrder": "на замовлення",
  "categoryVirgin": "Незаймане волосся",
  "categoryLuxe": "Luxe волосся",
  "categoryStandard": "Standard волосся",
  "categorySale": "Розпродаж",
  "piecesTitle": "Готові хвостики (продаж поштучно)",
  "disclaimer": "Ціна індивідуальна для кожного виробу. Залежить від кольору, якості та поточної наявності. Прайс-лист оновлюється автоматично.",
  "viewOffer": "Переглянути пропозицію",
  "noProducts": "Поки що немає продуктів у цій категорії.",
  "updatedAutomatically": "Прайс-лист оновлюється автоматично"
},
"navbar": {
  ...existující klíče...,
  "pricelist": "Прайс-лист"
}
```

**`messages/ru.json`:**
```json
"pricelist": {
  "title": "Прайс-лист",
  "metaTitle": "Прайс-лист на волосы | Hairland",
  "metaDescription": "Ориентировочный прайс-лист на премиальные волосы. Цены от-до по длине, цвету и категории.",
  "subtitle": "Ориентировочные ценовые диапазоны из текущего предложения. Цена зависит от цвета, качества и конкретного изделия.",
  "perGram": "Kč/г",
  "perPiece": "Kč/шт",
  "length": "Длина",
  "priceRange": "Цена за грамм",
  "pricePerPiece": "Цена за штуку",
  "product": "Продукт",
  "inStock": "в наличии",
  "onOrder": "на заказ",
  "categoryVirgin": "Девственные волосы",
  "categoryLuxe": "Luxe волосы",
  "categoryStandard": "Standard волосы",
  "categorySale": "Распродажа",
  "piecesTitle": "Готовые хвостики (продажа поштучно)",
  "disclaimer": "Цена индивидуальна для каждого изделия. Зависит от цвета, качества и текущей доступности. Прайс-лист обновляется автоматически.",
  "viewOffer": "Посмотреть предложение",
  "noProducts": "Пока нет продуктов в этой категории.",
  "updatedAutomatically": "Прайс-лист обновляется автоматически"
},
"navbar": {
  ...existující klíče...,
  "pricelist": "Прайс-лист"
}
```

---

## Soubory k vytvoření / úpravě

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `src/app/[locale]/(public)/cenik/page.tsx` | NOVÝ | Hlavní stránka ceníku (server component) |
| 2 | `src/components/public/PublicNavbar.tsx` | EDIT | Přidat "Ceník" do `offerItems` (řádek 198) + mobile link (řádek ~432) |
| 3 | `src/components/public/PublicFooter.tsx` | EDIT | Přidat "Ceník" do footer nav (řádek ~57) |
| 4 | `messages/cs.json` | EDIT | Nový namespace `pricelist` pod `public` + navbar klíč |
| 5 | `messages/uk.json` | EDIT | Překlad `pricelist` + navbar |
| 6 | `messages/ru.json` | EDIT | Překlad `pricelist` + navbar |

## Technický kontext

**Dostupná data z `getCachedAllProducts()`:**
```typescript
{
  id, slug, name, nameUk, nameRu, description, ...,
  category: "VIRGIN" | "LUXE" | "STANDARD" | "SALE" | "ACCESSORY",
  variants: [{
    lengthCm: number,
    color: string,
    retailPricePerGram: number,        // haléře, BY_GRAM
    retailPricePerPiece: number | null, // haléře, BY_PIECE
    sellingMode: "BY_GRAM" | "BY_PIECE",
    availableGrams: number,
    availablePieces: number,
  }]
}
```

**Cenový formát:** `halereToCZK(halere)` z `src/lib/pricing.ts` — konvertuje na Kč číslo. Pro formát použít `Intl.NumberFormat("cs-CZ")`.

**Stránky vzor:** `src/app/[locale]/(public)/offer/page.tsx` — používá `getTranslations("public")`, `getLocale()`, `getCachedAllProducts()`, `Breadcrumbs`, `getAlternates()`.

**Translations namespace:** `public` (ne root) — pricelist klíče budou pod `public.pricelist.*`.

## Edge cases

1. **Prázdné kategorie** — pokud žádné varianty v kategorii, nezobrazovat sekci
2. **Jedna varianta = jedna cena** — nezobrazovat "45 - 45 Kč", ale jen "45 Kč"
3. **BY_PIECE produkty** — separátní sekce, zobrazit název + délka + cena za kus (ne za gram)
4. **Nulové ceny** — ignorovat varianty s `retailPricePerGram === 0` (chybí nastavení)
5. **ACCESSORY kategorie** — NEZOBRAZOVAT v ceníku vlasů (příslušenství nemá cenu za gram)
6. **Vyprodané** — stále zobrazovat v ceníku, ale lze přidat vizuální indikátor "na objednávku" vs "skladem"
7. **Revalidace** — data z `getCachedAllProducts()` jsou cached 60s, stačí
8. **Multilingualita** — názvy produktů: `name` (cs), `nameUk`, `nameRu` — použít locale-specific název v BY_PIECE sekci

## Poznámky pro implementátora

- Stránka je čistě server-rendered, žádný client-side state potřeba
- Ceny jsou `retailPricePerGram` (haléře), to je finální cena pro retail zákazníky
- B2B ceny se na veřejném ceníku NEZOBRAZUJÍ
- ŽÁDNÉ DPH zmínky na ceníku (firma není plátce DPH — viz Task 3)
- Použít design jazyk konzistentní s `/offer` — Tailwind třídy: `text-ink`, `text-muted`, `bg-nude-50`, `border-line`, `text-rose` atd.
- Breadcrumbs: `[{ label: t("nav.home"), href: "/" }, { label: t("pricelist.title") }]`
- CTA button "Zobrazit nabídku" -> link na `/offer`
