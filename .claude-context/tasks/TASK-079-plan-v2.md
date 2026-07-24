# PLAN: TASK-079 — Prodejní karta chybí info o produktu

## Kontext

Uzivatel: "nejsou tam puvod vlasu, atd všechny informace + není tam videt kolik je skladem G."

---

## Analyza — co uz se zobrazuje vs co chybi

### SaleItemRow.tsx — aktualni stav (radek 57-151)

```
┌──────────────────────────────────────┐
│ Virgin Indian 55cm Natural Brown  [×]│  ← variantLabel
│ India · Wavy · VRG-WAV-NAT-55       │  ← origin, texture, SKU
│ ┌─────────┐ ┌─────────┐             │
│ │ Gramy   │ │ Kusy    │             │
│ └─────────┘ └─────────┘             │
│ Skladem: 450 g                       │  ← availableGrams ✅
│ Cena/g: 25,00 CZK    Celkem: xxx CZK│
└──────────────────────────────────────┘
```

### Co UZ je viditelne:
- `origin` — puvod vlasu (radek 70) ✅
- `texture` — textura (radek 71) ✅  
- `sku` — SKU kod (radek 72) ✅
- `category` — jako fallback kdyz neni origin (radek 70) ✅
- `availableGrams` / `availablePieces` — skladem (radek 128-135) ✅

### Co CHYBI:
1. **`processingType`** — typ zpracovani (CLIP_IN, TAPE_IN, KERATIN, WEFT, MICRO_RING, BANGS, OTHER) — existuje v `ProductOption` interface (radek 20) ale NENI predavan do SaleItemRow
2. **`colorTone`** — odsten barvy — existuje v Product modelu ale NENI v `ProductOption` interface ani v SaleItemRow
3. **`costPricePerGram`** — nakupni cena za gram (pro owner/employee zobrazeni marze) — existuje ve Variant modelu ale NENI v SaleItemRow

### Uzivatelsky feedback "kolik je skladem G":
Toto UZ JE zobrazeno (radek 128-135). Mozna to bylo pridano po podani stiznosti, nebo uzivatel ocekaval prominentnejsi zobrazeni.

---

## NALEZENE PROBLEMY

### PROBLEM 1: processingType se nezobrazuje (MAIN)

**Zdroj dat:** `ProductOption.processingType` (radek 20 v NewSaleWizard.tsx) — data UZ EXISTUJI na klientu, jen se nepredavaji.

**FIX — 3 kroky:**

1. Pridat `processingType` do `SaleItemData` interface v `SaleItemRow.tsx`:
```typescript
interface SaleItemData {
  // ... existujici fields ...
  processingType?: string;  // PRIDAT
}
```

2. Pridat `processingType` do `SaleItem` interface v `NewSaleWizard.tsx:26`:
```typescript
interface SaleItem {
  // ... existujici fields ...
  processingType?: string;  // PRIDAT
}
```

3. Predat `processingType` pri pridani polozky v `addItemFromVariantId` (radky 175-212):
```typescript
// V obou vetvich (BY_PIECE i BY_GRAM):
processingType: p.processingType,  // z ProductOption
```

4. Zobrazit v SaleItemRow (radek 69-73):
```typescript
<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
  {item.origin && <span>{item.origin}</span>}
  {item.texture && <span>{item.texture}</span>}
  {item.processingType && <span>{item.processingType}</span>}
  {item.category && <span className="text-muted/70">{item.category}</span>}
  {item.sku && <span className="font-mono">{item.sku}</span>}
</div>
```

**Obtiznost:** Jednoducha — 4 zmeny

---

### PROBLEM 2: colorTone se nezobrazuje (MEDIUM)

**Zdroj dat:** `Product.colorTone` — existuje v DB ale NENI v `ProductOption` interface ani neni nacitan na klienta.

**FIX:**

1. Pridat do `ProductOption` interface v NewSaleWizard.tsx:
```typescript
interface ProductOption {
  // ...
  colorTone: string | null;  // PRIDAT
}
```

2. Zajistit ze page.tsx predava `colorTone` z produktu. Overit v `sales/new/page.tsx`.

3. Predat do SaleItemRow pres `SaleItem` a `SaleItemData`.

4. Zobrazit v SaleItemRow.

**POZOR:** Overit ze `sales/new/page.tsx` nacita `colorTone` z DB — pokud ne, pridat do select.

**Obtiznost:** Stredni — zavisi na datovem flow

---

### PROBLEM 3: Sklademova informace neni dostatecne prominentni (LOW)

Aktualni zobrazeni (radek 128-135):
```
Skladem: 450 g
```

Uzivatel mozna ocekaval videt skladem UZ V PRVNI RADCE pri vyberu varianty — ne az PO pridani do kosiku. 

**FIX:** Zvyraznit skladem informaci — napr. pridat ikonu, zmenit barvu, nebo presunout nahoru k nazvu.

**DOPORUCENI:** Pridat skladem do info radku pod nazvem:
```typescript
<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
  {item.origin && <span>{item.origin}</span>}
  {item.texture && <span>{item.texture}</span>}
  {item.processingType && <span>{item.processingType}</span>}
  <span className="font-medium text-emerald-600">
    {item.availableGrams} g skladem
  </span>
</div>
```

**Obtiznost:** Jednoducha — 2 radky

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena |
|---|--------|-------|
| 1 | `src/components/sales/SaleItemRow.tsx:7-23` | Pridat `processingType`, `colorTone` do SaleItemData |
| 2 | `src/components/sales/SaleItemRow.tsx:69-73` | Zobrazit processingType, colorTone, skladem v info radku |
| 3 | `src/app/(app)/sales/new/NewSaleWizard.tsx:26-42` | Pridat `processingType`, `colorTone` do SaleItem |
| 4 | `src/app/(app)/sales/new/NewSaleWizard.tsx:135-212` | Predat nove fields pri addItemFromVariantId |

### Overit pred implementaci:
- `src/app/(app)/sales/new/page.tsx` — overit ze products query nacita `colorTone`
- `src/app/api/variants/[id]/route.ts` — overit ze fallback fetch vraci `colorTone`

---

## PORADI IMPLEMENTACE

1. **Overit** ze page.tsx a variants API vraci vsechna potrebna data
2. **SaleItemRow.tsx** — rozsirit interface, upravit zobrazeni
3. **NewSaleWizard.tsx** — rozsirit SaleItem interface, predat data pri pridani polozky
4. **Volitelne** — zvyraznit skladem v info radku

**Celkem: 2 soubory, ~15 radku zmeny**

---

## VERIFIKACE

1. Pridat polozku do prodeje → overit ze se zobrazi: origin, texture, processingType, category, SKU
2. Pridat polozku bez origin → overit ze se zobrazi category jako fallback
3. Overit ze skladem gramy jsou viditelne a prominentni
4. Overit ze barcode scan funguje se vsemi novymi fieldy

---

## RIZIKA

- **Nizke** — ciste UI zmeny, pridani zobrazeni dat ktere uz existuji
- `processingType` values (CLIP_IN, TAPE_IN...) se zobrazi jako surovy enum → zvazit lokalizaci pres i18n
- `colorTone` muze byt null u vetsiny produktu → zobrazovat jen kdyz existuje
