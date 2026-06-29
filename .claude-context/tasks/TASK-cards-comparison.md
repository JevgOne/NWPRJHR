# TASK #10 — Srovnani karet: Homepage vs Offer

**Datum:** 2026-06-28
**Agent:** planovac

---

## HLAVNI ZJISTENI

**Obe stranky pouzivaji SDILENY komponent `src/components/public/ProductCard.tsx`.**

Karty jsou UZ IDENTICKE co do obsahu a designu. Jediny rozdil je v INTERAKTIVITE (badges jako filtry na offer) a v GRIDU (homepage 2/4 cols, offer 2/3/4 cols).

---

## SDILENY KOMPONENT: ProductCard.tsx

Soubor: `src/components/public/ProductCard.tsx` (272 radku)

### Jak se pouziva

**Homepage** (`HeroProductSlider.tsx` r.62-66):
```tsx
<ProductCard product={p} variant={v} />
```
- BEZ `onCategoryClick` → `isInteractive = false` → staticke badges, cela karta je `<Link>`

**Offer** (`ProductsShowcase.tsx` r.466-479):
```tsx
<ProductCard
  product={p} variant={v}
  userRole={userRole} discountPct={discountPct}
  onCategoryClick={...} onOriginClick={...}
  onTextureClick={...} onColorToneClick={...}
  activeOriginFilter={...} activeTextureFilter={...}
  activeColorToneFilter={...}
/>
```
- S `onCategoryClick` → `isInteractive = true` → badges jako klikaci filtry, jen foto+nazev jako link

---

## INFORMACE NA KARTE — OBE STRANKY STEJNE

| Informace | Zobrazena? | Radky v ProductCard.tsx |
|-----------|-----------|------------------------|
| Fotka produktu (aspect-[3/4]) | ANO | r.98-124 |
| Category badge (VIRGIN/PREMIUM/STANDARD/SALE) | ANO | r.111-123 |
| Origin badge (vlajka + nazev) | ANO (pokud `p.origin`) | r.131-148 |
| Texture badge (TextureSwatch ikona + label) | ANO (pokud `p.texture`) | r.149-168 |
| ColorTone badge (barevna tecka + nazev) | ANO (pokud `p.colorTone`) | r.169-189 |
| Lokalizovany nazev produktu | ANO | r.192-203 |
| Texture subtitle text | NE — CHYBI | — |
| Delka (cm) | ANO | r.207 |
| Barva (swatch foto + nazev) | ANO | r.208-211 |
| Cena (Kc/g) — retail | ANO | r.237-240 |
| Cena (Kc/g) — B2B/salon | ANO (jen na offer s `userRole`) | r.218-235 |
| Sklad (gramy nebo "Vyprodano") | ANO | r.243-244 |
| Opacity pro vyprodane | ANO | r.255 (`opacity-60`) |

---

## DESIGN — OBE STRANKY STEJNE

| Design prvek | Hodnota | Radky |
|--------------|---------|-------|
| Karta obal | `bg-white rounded-xl border border-line overflow-hidden hover:shadow-md` | r.255, r.265 |
| Fotka aspect ratio | `aspect-[3/4]` | r.99 |
| Info padding | `p-2.5` | r.127 |
| Badges kontejner | `flex flex-wrap items-center gap-1 mb-1` | r.130 |
| Badge velikost | `text-[10px] px-1.5 py-0.5 rounded font-medium` | r.136, r.144 |
| Origin badge barvy | `bg-emerald-100 text-emerald-700` | r.138, r.144 |
| Texture badge barvy | `bg-violet-100 text-violet-700` | r.155, r.163 |
| ColorTone badge barvy | `bg-amber-100 text-amber-700` | r.176, r.183 |
| Nazev font | `font-medium text-ink text-xs leading-tight line-clamp-2 mb-0.5` | r.195, r.200 |
| Delka+barva | `flex items-center gap-1.5 mb-1.5` | r.206 |
| Cena font | `text-sm font-bold text-ink` (retail) / `text-rose` (B2B) | r.238, r.223 |
| Sklad font | `text-[10px] font-medium text-emerald-600` / `text-red-400` | r.243 |

---

## ROZDILY HOMEPAGE vs OFFER

### 1. Grid layout (JEDINY vizualni rozdil)

| Stranka | Grid |
|---------|------|
| Homepage | `grid-cols-2 lg:grid-cols-4 gap-3` |
| Offer | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` |

Offer ma navic `md:grid-cols-3` breakpoint. Na lg+ jsou STEJNE (4 sloupce).

### 2. Interaktivita (funkcni rozdil, NE vizualni)

| Aspekt | Homepage | Offer |
|--------|----------|-------|
| Karta wrapper | `<Link>` (cela klikaci) | `<div>` (jen foto+nazev klikaci) |
| Category badge | `<span>` (staticky) | `<button>` (filtruje) |
| Origin badge | `<span>` (staticky) | `<button>` (filtruje, s hover+active ring) |
| Texture badge | `<span>` (staticky) | `<button>` (filtruje, s hover+active ring) |
| ColorTone badge | `<span>` (staticky) | `<button>` (filtruje, s hover+active ring) |
| Nazev produktu | `<h3>` (ne-link, parent Link) | `<Link><h3>` (vlastni link, hover:text-rose) |
| B2B ceny | NE (nema userRole) | ANO (salon/kadernice ceny) |

### 3. Pocet karet

| Stranka | Pocet |
|---------|-------|
| Homepage | Max 4 (top stock, jen availableGrams > 0) |
| Offer | Vsechny varianty s retailPricePerGram > 0 |

---

## CO CHYBI NA OBOU KARTACH

### Texture subtitle

Textura se zobrazuje jen jako BADGE (maly fialovy tag). Uzivatel chce texturu prominentneji — jako SUBTITLE text pod nazvem produktu.

**Fix:** Pridat do `ProductCard.tsx` za nazev (r.203):
```tsx
{textureLabel && (
  <p className="text-[10px] text-muted line-clamp-1 mb-1">
    {textureLabel}
  </p>
)}
```

Protoze obe stranky pouzivaji STEJNY komponent, zmena se automaticky projevi na OBOU.

---

## ZAVER

**Karty UZ JSOU identicke** — pouzivaji sdileny `ProductCard.tsx`. Zadne zmeny pro sjednoceni nejsou potreba.

Jedina doporucena zmena: pridat texture subtitle (viz vyse), coz se projevi na obou strankach automaticky.
