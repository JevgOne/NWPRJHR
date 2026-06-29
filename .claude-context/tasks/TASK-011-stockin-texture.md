# TASK #11 — BUG: Stock-in formular — chybi Struktura vlasu (textura)

**Datum:** 2026-06-28
**Agent:** planovac

---

## SOUHRN

Stock-in formular (`src/components/inventory/StockInForm.tsx`) zobrazuje texturu MINIMALNE — jen jako text za nazvem v dropdown selectu a maly text pod vyberem produktu. Pro uzivatele to neni dostatecne viditelne. Textura je vlastnost PRODUKTU (ne dodavky), takze se nemeni pri naskladneni — ale musi byt jasne videt, aby operator overil ze skladnuje spravne vlasy.

---

## AKTUALNI STAV

### Co formular MA:
1. **Product select** (r.193-209) — dropdown se `{p.name}{p.texture ? " — " + p.texture : ""}` — textura je v textu option, ale spatne viditelna v selectu
2. **Texture info** (r.210-214) — pod selectem maly text `{selectedProduct.texture}` v `text-xs text-violet-600`
3. **Color swatch selector** (r.220-250) — vizualni swatche barev
4. **Length selector** (r.253-282) — tlacitka s delkami

### Co formular NEMA:
1. **Vizualni textura badge** — zadny TextureSwatch SVG swatch, jen text
2. **Jasna info karta** — po vyberu produktu neni jasne videt co se bude skladnit (kategorie, puvod, textura)
3. **Moznost zmenit texturu** — pokud produkt nema texturu nastavenou, neni moznost ji pridat primo z stock-in

---

## NAVRH OPRAVY

### Zmena 1: Info karta vybrancho produktu (HLAVNI)

Po vyberu produktu zobrazit prehlednou info kartu:

**Soubor:** `src/components/inventory/StockInForm.tsx`
**Kde:** Za product selectem (r.209), pred color/length (r.218)

```tsx
{selectedProduct && (
  <div className="flex flex-wrap items-center gap-2 p-3 bg-nude-50 rounded-lg border border-line">
    <CategoryBadge category={selectedProduct.category} />
    {selectedProduct.origin && (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
        {getOriginFlag(selectedProduct.origin)} {selectedProduct.origin}
      </span>
    )}
    {selectedProduct.texture && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">
        <TextureSwatch texture={selectedProduct.texture} size={16} />
        {selectedProduct.texture}
      </span>
    )}
    {!selectedProduct.texture && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
        ⚠ Textura nenastavena
      </span>
    )}
  </div>
)}
```

### Zmena 2: Rozsirit ProductOption interface

Pridat `origin` a `category` do dat predanych z page.tsx:

**Soubor:** `src/components/inventory/StockInForm.tsx` — interface ProductOption (r.18-24):
```diff
 interface ProductOption {
   id: string;
   name: string;
   category: string;
+  origin?: string | null;
   texture?: string | null;
   variants: { id: string; lengthCm: number; color: string }[];
 }
```

**Soubor:** `src/app/(app)/inventory/stock-in/page.tsx` — serialization (r.26-35):
```diff
 const productOptions = products.map((p) => ({
   id: p.id,
   name: p.name,
   category: p.category,
+  origin: p.origin,
   texture: p.texture,
   variants: p.variants.map((v) => ({
     id: v.id,
     lengthCm: v.lengthCm,
     color: v.color,
   })),
 }));
```

### Zmena 3: Pridat importy

Do `StockInForm.tsx` pridat:
```tsx
import { TextureSwatch } from "@/components/TextureSwatch";
import { CategoryBadge } from "@/components/products/CategoryBadge";
import { getOriginFlag } from "@/lib/origin-flags";
```

### Zmena 4: Odstranit duplicitni texture text

Odstranit stavajici `selectedProduct?.texture && (...)` blok (r.210-214), protoze info karta ho nahradi.

---

## SOUBORY K UPRAVE

| Soubor | Akce |
|--------|------|
| `src/components/inventory/StockInForm.tsx` | Pridat info kartu, importy, rozsirit interface |
| `src/app/(app)/inventory/stock-in/page.tsx` | Pridat `origin` do product options |

---

## POZNAMKA K "PRODUKTY NEJSOU DODELANE"

Z analyzy kodu vyplyva ze produkt/varianta/dodavka workflow je KOMPLETNI:
1. Vytvorit produkt (CreateProductForm) ✅
2. Pridat varianty - delky + barvy (VariantBatchCreate) ✅  
3. Naskladnit (StockInForm → /api/deliveries POST) ✅
4. Spravovat dodavatele (SuppliersClient) ✅
5. Cenotvorba (PricingSettingsClient) ✅

Mozne duvody proc uzivatel rika "nejsou dodelane":
- **Chybi colorTone (ton barvy)** — planovano v TASK-004, zatim neimplementovano
- **Textura neni dost videt** pri naskladneni — to resime vyse
- **Produkt nema fotky/popis** — to je otazka obsahu, ne kodu

---
