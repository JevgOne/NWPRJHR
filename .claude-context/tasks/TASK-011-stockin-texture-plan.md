# TASK #11 — Plan: Pridat texturu do StockInForm

**Datum:** 2026-06-28
**Agent:** planovac

---

## ANALYZA SOUCASNEHO STAVU

### Aktualni flow StockInForm.tsx

1. **Vyber Produkt** (dropdown `<select>`) — zobrazuje `p.name`, volitelne ` — p.texture`, `[p.colorTone]`
2. **Vyber Barvu** (swatch buttons) — unikatni barvy z variant produktu
3. **Vyber Delku** (cm buttons) — delky dostupne pro vybranou barvu
4. → Resolve `variantId` z color + length
5. Vyplnit: dodavatel, cena, gramy, datum, poznamka
6. Submit POST /api/deliveries

### Kde je textura v datech

- `Product.texture` — string na urovni produktu (NE varianty)
- Hodnoty: `"Rovné"`, `"Mírně vlnité"`, `"Vlnité"`, `"Kudrnaté"` nebo `null`
- Definovano v `src/lib/hair-textures.ts`: `TEXTURE_OPTIONS` (4 polozky)
- Textura se NEPOSILA do API — je uz ulozena na Produktu

### Aktualni zobrazeni textury

- V dropdown option: `{p.name}{p.texture ? ' — ' + p.texture : ''}` (r.207)
- Po vyberu produktu: maly text pod dropdownem (r.211-215)
- **Problem:** textura je jen maly text, snadno prehlédnutelna

---

## NAVRH RESENI

### Varianta A: Textura jako FILTR pred vybérem produktu (DOPORUCENO)

Pridat texturu jako PRVNI krok — tlacitka s ikonami jako barva/delka. Po vyberu textury se dropdown produktu FILTRUJE jen na produkty s danou texturou.

**Flow:**
1. **NOVY: Vyber Texturu** (4 tlacitka s TextureSwatch ikonami)
2. Vyber Produkt (dropdown — filtrovan podle textury)
3. Vyber Barvu (swatch buttons)
4. Vyber Delku (cm buttons)

**Implementace:**

#### 1. Novy state

```tsx
const [selectedTexture, setSelectedTexture] = useState("");
```

#### 2. Filtrovani produktu

```tsx
const filteredProducts = useMemo(() => {
  if (!selectedTexture) return products;
  return products.filter((p) => p.texture === selectedTexture);
}, [products, selectedTexture]);
```

#### 3. UI blok — pred produktovym dropdown (r.189)

```tsx
{/* Texture selector */}
<div>
  <label className="block text-sm font-medium text-espresso mb-2">
    {t("texture")}
  </label>
  <div className="flex flex-wrap gap-2">
    {TEXTURE_OPTIONS.map((tex) => {
      const count = products.filter((p) => p.texture === tex.name).length;
      if (count === 0) return null;
      const isSelected = selectedTexture === tex.name;
      return (
        <button
          key={tex.name}
          type="button"
          onClick={() => {
            setSelectedTexture(isSelected ? "" : tex.name);
            setProductId("");
            setSelectedColor("");
            setSelectedLength("");
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            isSelected
              ? "border-violet-400 bg-violet-100 text-violet-800 ring-1 ring-violet-300"
              : "border-line bg-white text-muted hover:border-espresso/30"
          }`}
        >
          <TextureSwatch texture={tex.name} size={20} />
          {tTexture(tex.nameKey)}
          <span className="text-muted text-xs">({count})</span>
        </button>
      );
    })}
  </div>
</div>
```

#### 4. Pouzit `filteredProducts` misto `products` v dropdown (r.205)

```tsx
{filteredProducts.map((p) => (
  <option key={p.id} value={p.id}>
    {p.name}{p.texture ? ` — ${p.texture}` : ""}
  </option>
))}
```

#### 5. Validace — textura POVINNA

```tsx
// V handleSubmit (r.91):
if (!selectedTexture) {
  setError(t("selectTexture")); // pridat i18n klic
  return;
}
```

ALTERNATIVNE: Pokud vsechny produkty maji texturu, staci kontrolovat ze vybrany produkt ma texturu:
```tsx
if (!selectedProduct?.texture) {
  setError(t("productMissingTexture"));
  return;
}
```

#### 6. Importy

```tsx
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
import { TextureSwatch } from "@/components/TextureSwatch";
```

#### 7. i18n klice

Do `messages/*/stock.json` (nebo kde je `stock` namespace):
```json
"texture": "Struktura vlasů",
"selectTexture": "Vyberte strukturu vlasů"
```

---

### Varianta B: Textura jako INFO karta po vyberu produktu (JEDNODUSSI)

Misto filtru jen zobrazit texturu prominentne po vyberu produktu — velky badge s TextureSwatch. Bez filtrovani.

**NEDOPORUCENO** — uzivatel chce texturu "ve stejnem stylu jako Barva/Delka", coz implikuje interaktivni vyber.

---

## SOUBORY K UPRAVE

| Soubor | Akce |
|--------|------|
| `src/components/inventory/StockInForm.tsx` | Pridat texture selector, import, state, filtrovani, validaci |
| `messages/cs.json` | Pridat `stock.texture`, `stock.selectTexture` |
| `messages/uk.json` | Pridat `stock.texture`, `stock.selectTexture` |
| `messages/ru.json` | Pridat `stock.texture`, `stock.selectTexture` |

---

## SROVNANI SE SOUCASNYM BARVA/DELKA STYLEM

| Prvek | Barva (r.222-252) | Delka (r.254-282) | Textura (NOVY) |
|-------|------|-------|---------|
| Label | `t("color")` | `t("length")` | `t("texture")` |
| UI | `flex flex-wrap gap-2` buttons | `flex flex-wrap gap-2` buttons | `flex flex-wrap gap-2` buttons |
| Button styl | swatch + nazev barvy | `{cm} cm` | TextureSwatch + lokalizovany nazev |
| Selected styl | `border-rose bg-rose/10 ring-1 ring-rose` | Stejny | `border-violet-400 bg-violet-100 ring-1 ring-violet-300` (violet = textura) |
| Unselected styl | `border-line bg-white text-muted hover:border-espresso/30` | Stejny | Stejny |
| Poradi | 2. (po produktu) | 3. (po barve) | **1. (PRED produktem)** |

---

## CASOVA NAROCNOST

~15 minut implementace. Nejvetsi cast je pridani TextureSwatch importu a UI bloku.
