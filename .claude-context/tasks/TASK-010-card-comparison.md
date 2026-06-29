# TASK #10 — Srovnani karet: Homepage vs Offer

**Datum:** 2026-06-28
**Agent:** planovac

---

## SOUHRN

Karty produktu na homepage (HeroProductSlider.tsx) a offer (ProductsShowcase.tsx) jsou DVE NEZAVISLE IMPLEMENTACE se stejnym vizualnim vzorem, ale s vyznamnymy rozdily v obsahu a interaktivite. Nize je detailni srovnani a navrh sjednoceni.

---

## STRUKTURALNI ROZDILY

| Aspekt | Homepage (HeroProductSlider) | Offer (ProductsShowcase) |
|--------|------------------------------|--------------------------|
| **Soubor** | `src/components/public/HeroProductSlider.tsx` | `src/app/(public)/offer/ProductsShowcase.tsx` |
| **Sdileny komponent?** | NE — vlastni `VariantCard` funkce (r.70-161) | NE — inline JSX v renderovacim cyklu (r.438-559) |
| **Wrapper element** | `<Link>` — cela karta je odkaz | `<div>` — odkaz jen na fotku a nazev |
| **Pocet karet** | Max 4 (top stock) | Vsechny varianty s cenou > 0 |
| **Grid** | `grid-cols-2 lg:grid-cols-4` | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` |

---

## INFORMACE NA KARTE — SROVNANI

| Informace | Homepage | Offer | Rozdil |
|-----------|----------|-------|--------|
| **Foto produktu** | ANO (aspect-[3/4]) | ANO (aspect-[3/4]) | Stejne |
| **Kategorie badge** | ANO (`<span>`) — staticky | ANO (`<button>`) — klikaci (filtruje) | Offer je interaktivni |
| **Origin badge** | ANO (`<span>`) — staticky | ANO (`<button>`) — klikaci (filtruje) | Offer je interaktivni |
| **Texture badge** | ANO (`<span>`) — staticky | ANO (`<button>`) — klikaci (filtruje) + TextureSwatch ikona | Offer ma SVG ikonu navic |
| **Nazev produktu** | ANO (lokalizovany) | ANO (lokalizovany) | Stejne |
| **Subtitle (bio)** | **NE** | ANO — `generateProductBioShort()` | CHYBI na homepage |
| **Delka (cm)** | ANO | ANO | Stejne |
| **Barva (swatch + nazev)** | ANO | ANO | Stejne |
| **Cena (Kc/g)** | ANO — jen retail | ANO — retail + B2B/salon ceny | Offer ma B2B logiku |
| **Sklad (gramy)** | ANO — jen cislo | ANO — cislo nebo "Vyprodano" | Offer ma out-of-stock state |
| **Opacity pro vyprodane** | NE | ANO (`opacity-60`) | CHYBI na homepage |
| **Alt text fotky** | Lokalizovany nazev | `p.name` (vzdy CZ) | BUG na offer — chybi lokalizace alt |

---

## DESIGNOVE ROZDILY

| Design aspekt | Homepage | Offer |
|---------------|----------|-------|
| **Karta obal** | `rounded-xl border border-line` | Stejne + `opacity-60` pro vyprodane |
| **Padding obsahu** | `p-2.5` | `p-2.5` |
| **Nazev font** | `text-xs font-medium line-clamp-2` | Stejne + `hover:text-rose` |
| **Badges kontejner** | `mb-1 flex flex-wrap gap-1` (podminka: jen kdyz existuji) | `mb-1 flex flex-wrap items-center gap-1` (vzdy zobrazen) |
| **Badge velikost** | `text-[10px] px-1.5 py-0.5` | Stejne |
| **Badge barvy** | origin: `bg-emerald-100 text-emerald-700` | Stejne + aktivni stav (`ring-1`) |
| **Badge barvy** | texture: `bg-violet-100 text-violet-700` | Stejne + aktivni stav (`ring-1`) |
| **Cena layout** | `flex items-baseline justify-between` | Stejne, ale v `space-y-0.5` wrapperu |

---

## KONKRETNI BUGY

1. **Offer: alt text neni lokalizovany** — `alt={p.name}` (r.449) pouziva vzdy cesky nazev misto `localizedName(p)`
2. **Homepage: chybi subtitle** — nezobrazuje `generateProductBioShort()`, na offer ano
3. **Homepage: chybi out-of-stock stav** — filtruje `availableGrams > 0`, ale na offer se zobrazuji i vyprodane varianty s `opacity-60` a textem "Vyprodano"

---

## NAVRH SJEDNOCENI

### Varianta A: Sdileny `<ProductVariantCard>` komponent (DOPORUCENO)

Vytvorit novy komponent `src/components/public/ProductVariantCard.tsx` ktery:

```
Props:
  product: ProductData       // spolecny interface
  variant: VariantData       // spolecny interface
  mode: "static" | "interactive"   // homepage = static, offer = interactive
  onFilterClick?: (key, value) => void  // jen pro interactive mode
  activeFilters?: { origin, texture, color }  // pro zvyrazneni aktivnich filtru
  userRole?: string | null   // pro B2B ceny
  discountPct?: number       // pro kadernicke slevy
```

**Static mode (homepage):**
- Cela karta je `<Link>`
- Badges jsou `<span>` (neklikaci)
- Jen retail cena
- Nezobrazuje vyprodane (protoze homepage filtruje jen skladove)

**Interactive mode (offer):**
- Foto + nazev jsou `<Link>`, badges jsou `<button>`
- B2B cenova logika
- Out-of-stock vizualizace
- Aktivni filtr zvyrazneni

**Sdileny obsah (obe varianty):**
- Foto s category badge
- Origin + texture badges
- Lokalizovany nazev
- Subtitle (`generateProductBioShort`)
- Delka + barva swatch
- Cena + sklad

### Implementacni kroky:

1. **Vytvorit `src/components/public/ProductVariantCard.tsx`**
   - Spolecne interface `ProductCardData` a `VariantCardData`
   - Render logika s `mode` prop
   - Subtitle vzdy zobrazit (`generateProductBioShort`)
   - Alt text vzdy lokalizovany

2. **Upravit `HeroProductSlider.tsx`**
   - Nahradit `VariantCard` funkci za `<ProductVariantCard mode="static" />`
   - Odstranit duplicitni JSX (~90 radku)

3. **Upravit `ProductsShowcase.tsx`**
   - Nahradit inline JSX (r.438-559) za `<ProductVariantCard mode="interactive" />`
   - Predat `onFilterClick`, `activeFilters`, `userRole`, `discountPct`
   - Odstranit duplicitni JSX (~120 radku)

4. **Opravit bugy:**
   - Alt text lokalizace (bug na offer)
   - Pridat subtitle na homepage
   - TextureSwatch ikona na obe varianty

### Varianta B: Copy-paste sjednoceni (NEDOPORUCENO)

Rucne sjednotit JSX v obou souborech bez sdileneho komponentu. Vede k dalsi divergenci v budoucnu.

---

## ZAVAZNOST PRO TASK #9

Task #9 (BUG-FIX implementace) je blokovany timto taskem. Klicove informace pro implementatora:

1. **Subtitle na homepage CHYBI** — pridat `generateProductBioShort()` do homepage karet
2. **Alt text na offer je spatne** — zmenit `alt={p.name}` na `alt={localizedName(p)}`
3. **Doporuceni: vytvorit sdileny komponent** aby se bugy neopakovaly a karty zustaly identicky v budoucnu
4. **TextureSwatch na homepage CHYBI** — offer pouziva `<TextureSwatch>` SVG ikonu, homepage jen text

---

## SOUBORY K UPRAVE

| Soubor | Akce |
|--------|------|
| `src/components/public/ProductVariantCard.tsx` | NOVY — sdileny komponent |
| `src/components/public/HeroProductSlider.tsx` | UPRAVIT — pouzit sdileny komponent |
| `src/app/(public)/offer/ProductsShowcase.tsx` | UPRAVIT — pouzit sdileny komponent |

---
