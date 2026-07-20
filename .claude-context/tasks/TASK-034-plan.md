# TASK-034: Přidat QR kód na stránku editace produktu (admin)

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

QR kód byl přidán do inventory tabulky (TASK-030, commit `296329a`), ale NEEXISTUJE na admin product detail/edit stránce. User očekává QR i tam — na stránce kde edituje produkt a vidí varianty.

---

## Současný stav

### Inventory (HOTOVO) — `InventoryClient.tsx`

- QR ikona per-row v tabulce (řádek 335-346)
- `openQr(variantId)` generuje QR přes `qrcode` package (řádek 55-64)
- `downloadQr()` stahuje QR jako PNG přes Blob URL (řádek 66-80)
- Modal overlay s QR obrázkem + download button (řádek 362-378)
- QR URL: `{origin}/sales/new?variantId={id}`

### Product detail (CHYBÍ) — `ProductDetailClient.tsx` + `VariantTable.tsx`

- `ProductDetailClient.tsx` renderuje `<VariantTable>` na řádku 536-540
- `VariantTable.tsx` zobrazuje variant karty v gridu (per-length, per-color)
- Žádné QR tlačítko/ikona na kartách

---

## Doporučený fix

### Přidat QR ikonu do `VariantTable.tsx` — na každou variant kartu

Každá varianta v gridu (řádky 175-359) je `<div>` karta s barvou, cenou, stock badge, toggle. Přidat QR ikonu do karty.

**Umístění:** Vedle stock badge nebo v horním rohu karty. Doporučuji přidat do spodní sekce karty (vedle "Na objednávku" toggle) nebo jako malou ikonu v pravém horním rohu.

**Implementace — kopie z InventoryClient.tsx:**

1. Přidat state pro QR modal do `VariantTable.tsx`:
```typescript
const [qrModal, setQrModal] = useState<{ variantId: string; dataUrl: string } | null>(null);
```

2. Přidat `openQr` a `downloadQr` funkce (copy z InventoryClient.tsx řádky 55-80)

3. Přidat QR ikonu do variant karty (uvnitř `<div key={variant.id}>`, řádek 175-359):
```tsx
{/* QR button — top-right of card */}
<button
  onClick={(e) => { e.stopPropagation(); openQr(variant.id); }}
  className="absolute top-2 right-2 p-1 rounded hover:bg-nude-100 text-muted hover:text-espresso transition-colors"
  title="QR"
>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.625m0 3v.375m0-3h3.375m-3.375 0h-.375m3.75 0h.375m0 0v.375m0-.375h.375" />
  </svg>
</button>
```

4. Karta potřebuje `position: relative` pro absolute pozici QR ikony:
   - Řádek 178: přidat `relative` do className

5. Přidat QR modal na konec komponenty (copy z InventoryClient.tsx řádky 362-378)

**Viditelnost:** Pouze pro `isOwner` — QR kód generuje prodejní URL, relevantní jen pro OWNER.

---

## Soubory k úpravě

| # | Soubor | Změna | Priorita |
|---|--------|-------|----------|
| 1 | `src/components/products/VariantTable.tsx` | Přidat QR ikonu + modal + openQr/downloadQr funkce | HLAVNÍ |

**Žádné nové soubory.** Žádné API změny. QR se generuje client-side z `variantId` (stejně jako v inventory).

---

## Implementační detail

### Co kopírovat z InventoryClient.tsx

| Element | Zdroj (InventoryClient.tsx) | Cíl (VariantTable.tsx) |
|---------|---------------------------|----------------------|
| `qrModal` state | řádek 53 | nový state |
| `openQr()` funkce | řádky 55-64 | nová funkce |
| `downloadQr()` funkce | řádky 66-80 | nová funkce |
| QR SVG ikona | řádky 341-344 | v kartě (menší, w-3.5) |
| QR modal overlay | řádky 362-378 | na konci komponenty |

### Pozor

- Karta je grid item s `p-3` — QR ikona musí být malá (w-3.5 h-3.5) aby nezabírala moc místa
- Karta nemá `relative` positioning — přidat pro absolute QR ikonu
- `openQr` potřebuje `window.location.origin` — funguje v client component (VariantTable je `"use client"`)
- `qrcode` package je už v dependencies (`^1.5.4`)

---

## Shrnutí

Jednoduchá feature: zkopírovat QR pattern z InventoryClient do VariantTable. Přidat QR ikonu do pravého horního rohu variant karty, kliknutí otevře modal s QR + download. Viditelné pouze pro OWNER.
