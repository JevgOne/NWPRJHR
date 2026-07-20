# TASK-079: Prodejni karta — pridat origin, texturu, SKU, stock info

## Cil
Na karte polozky v prodejnim formulari (SaleItemRow) po naskenovani QR chybi dulezite informace pro osobni prodej. Aktualne se zobrazuje jen `variantLabel` = "Luxe Vlasy — Rovne 55cm 9". Potrebujeme pridat origin, texturu, SKU, a formatovane stock info.

## Soucasny stav

### page.tsx (server component)
- `productOptions` query uz obsahuje `origin` a `texture` z Product modelu (radky 32-33)
- Varianty obsahuji `id`, `lengthCm`, `color`

### NewSaleWizard.tsx (client component)
- `ProductOption` interface (radky 15-21) **CHYBI** `origin` a `texture` — nezpracovava data z page.tsx
- `SaleItem` interface (radky 23-36) **CHYBI** metadata pole pro origin, texturu, SKU, stock info
- `addItemFromVariantId` (radky 114-165) tvori label jako `${p.name} ${v.lengthCm}cm ${v.color}` — presne to co chceme rozsirit

### SaleItemRow.tsx (UI component)
- `SaleItemData` interface (radky 7-19) **CHYBI** nova pole
- Zobrazeni (radek 57): jen `{item.variantLabel}` + BY_PIECE badge

### lib/sku.ts
- `generateSku(category, texture, color, lengthCm)` — uz existuje, staci volat

## Plan implementace

### Krok 1: Rozsirit `ProductOption` interface v NewSaleWizard.tsx

```typescript
interface ProductOption {
  id: string;
  name: string;
  category: string;
  processingType: string;
  origin: string | null;    // PRIDAT
  texture: string | null;   // PRIDAT
  variants: { id: string; lengthCm: number; color: string }[];
}
```

### Krok 2: Rozsirit `SaleItem` interface v NewSaleWizard.tsx

Pridat nova pole:

```typescript
interface SaleItem {
  // ... existujici pole ...
  origin?: string | null;
  texture?: string | null;
  sku?: string;
  category?: string;
}
```

### Krok 3: Upravit `addItemFromVariantId` v NewSaleWizard.tsx

V obou vetvich (BY_PIECE i BY_GRAM) pri setItems pridat nova pole:

```typescript
const addItemFromVariantId = useCallback(
  async (variantId: string) => {
    let label = variantId;
    let origin: string | null = null;
    let texture: string | null = null;
    let sku: string | undefined;
    let category: string | undefined;
    
    for (const p of products) {
      const v = p.variants.find((v) => v.id === variantId);
      if (v) {
        label = `${p.name} ${v.lengthCm}cm ${v.color}`;
        origin = p.origin;
        texture = p.texture;
        category = p.category;
        sku = generateSku(p.category, p.texture, v.color, v.lengthCm);
        break;
      }
    }
    // ... pak v obou setItems volanich pridat: origin, texture, sku, category
```

Pridat import `generateSku` z `@/lib/sku`.

### Krok 4: Rozsirit `SaleItemData` interface v SaleItemRow.tsx

```typescript
interface SaleItemData {
  // ... existujici pole ...
  origin?: string | null;
  texture?: string | null;
  sku?: string;
  category?: string;
}
```

### Krok 5: Upravit UI v SaleItemRow.tsx

Pod `variantLabel` pridat novy radek s detaily. Formatovane stock info jiz existuje nize (radky 117-126), takze staci pridat origin/texture/SKU nad input sekci.

```tsx
<div className="flex items-start justify-between">
  <div className="font-medium text-sm">
    {item.variantLabel}
    {isByPiece && <span className="ml-1.5 text-[10px] font-bold text-rose bg-rose/10 px-1.5 py-0.5 rounded">{tStock("perPiece")}</span>}
  </div>
  <Button variant="ghost" size="sm" onClick={onRemove}>
    &times;
  </Button>
</div>

{/* NOVY BLOK — metadata radek */}
<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
  {item.origin && <span>{item.origin}</span>}
  {item.texture && <span>{item.texture}</span>}
  {item.sku && <span className="font-mono">{item.sku}</span>}
</div>
```

### Krok 6: Upravit stock info zobrazeni

Soucasne stock info (radky 117-126) ukazuje:
- BY_PIECE (sellByGrams): `{availableGrams} g`
- BY_PIECE (sellByPieces): `{availablePieces} ks`  
- BY_GRAM: `{availableGrams} g / {availablePieces} ks`

Pozadovany format pro BY_PIECE: **"1ks - 100g"** (pocet kusu a celkove gramy).
Pro BY_GRAM: **celkove dostupne gramy**.

Upravit radky 117-126 na:

```tsx
<div className="flex justify-between text-sm">
  <span className="text-muted">
    {t("availableStock")}:{" "}
    {isByPiece
      ? `${item.availablePieces} ${tStock("pieces")} - ${item.availableGrams} ${tStock("grams")}`
      : `${item.availableGrams} ${tStock("grams")}`}
  </span>
</div>
```

Poznamka: Pro BY_PIECE vzdy zobrazit oba udaje (ks + gramy), bez ohledu na `sellByGrams` toggle. Pro BY_GRAM staci gramy (pieces se pro BY_GRAM produkty netykaji).

### Krok 7: Fallback pro initialVariantId error handler

V useEffect pro initialVariantId (radky 177-192) je fallback `catch` — i ten by mel mit prazdna nova pole:
```typescript
origin: null, texture: null, sku: undefined, category: undefined
```
To se stane automaticky protoze interface ma optional pole.

## Soubory k uprave (presny poradi)

1. **`src/app/(app)/sales/new/NewSaleWizard.tsx`**
   - Pridat import `generateSku` z `@/lib/sku`
   - Rozsirit `ProductOption` o `origin`, `texture`
   - Rozsirit `SaleItem` o `origin`, `texture`, `sku`, `category`
   - Upravit `addItemFromVariantId` — extrahovat nova pole z product, pridat je do obou setItems volani
   
2. **`src/components/sales/SaleItemRow.tsx`**
   - Rozsirit `SaleItemData` o `origin`, `texture`, `sku`, `category`
   - Pridat metadata radek pod variantLabel
   - Upravit stock info format pro BY_PIECE (vzdy zobrazit ks + gramy)

## Data flow

```
page.tsx (server)
  ↓ productOptions (uz obsahuje origin, texture)
NewSaleWizard.tsx (client)
  ↓ ProductOption interface rozsereno o origin, texture
  ↓ addItemFromVariantId() extrahuje origin, texture, generuje SKU
  ↓ SaleItem nese origin, texture, sku, category
SaleItemRow.tsx (display)
  ↓ SaleItemData rozsereno
  ↓ Zobrazuje metadata radek + upraveny stock info
```

## Poznamky

- **page.tsx NENI treba menit** — uz vraci origin a texture (radky 32-33)
- **generateSku uz existuje** v lib/sku.ts — staci importovat a zavolat
- Nova pole v SaleItem jsou optional (`?`) takze neovlivni existujici logiku (submit, price preview, atd.)
- Variant color v SKU: `color.padStart(2, "0")` — uz je v generateSku
