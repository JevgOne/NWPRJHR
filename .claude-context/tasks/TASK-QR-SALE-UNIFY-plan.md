# TASK: Sjednotit prodej/rezervace na QR-based flow + vylepšit ruční výběr

## Kontext

**Primární flow:** Každý culík má QR štítek (generovaný v `QrLabelSheet.tsx`), QR kód vede na `/sales/new?variantId=XXX`. Naskenováním se automaticky předvyplní varianta pro prodej.

**Současný stav:**
- `NewSaleWizard.tsx` (270+ řádků) — wizard pro nový prodej s:
  - `CustomerSelect` — volba SALON / RETAIL + výběr konkrétního zákazníka
  - Dva způsoby přidání produktu: QR scan (`BarcodeScanner`) NEBO ruční výběr (product picker)
  - `SaleItemRow` — řádek s gramáží/kusy + cenou
  - `DiscountForm` — speciální sleva
  - Payment type (TRANSFER/CASH/PROMO/WRITEOFF)
  - Summary + submit
- **Rezervace** = Order systém (`order-workflow.ts`) — salony si objednávají, vytvoří se Reservation v DB, admin potvrdí/zamítne, při dokončení se vytvoří Sale
- **QR scan** (`BarcodeScanner.tsx`) — fullscreen kamera + ruční zadání kódu, po scanu volá `/api/deliveries/barcode/{code}` a dostane `variantId`
- **QR label** — generuje URL `/sales/new?variantId={variantId}`, tiskne se na štítek 40×30mm

**Problémy k řešení:**
1. Ruční výběr produktu je nepřehledný — prostý `<select>` dropdown, barva není vidět (jen text "1" nebo "2"), nejde dobře vybrat
2. Po naskenování QR se zobrazí stejný wizard, ale zážitek by měl být více streamlined (QR = fast path)
3. Prodej a rezervace by měly vypadat stejně — stejná pole, stejný layout

---

## Plán implementace

### KROK 1: Vylepšit ruční výběr produktu (hlavní priorita)

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx` (řádky 356–393)

**Současný stav:**
```tsx
<select>
  <option value="">Hledat...</option>
  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
// + po vybrání produktu se zobrazí varianty jako textové buttony "30cm - 2"
```

**Problém:** 
- Dropdown `<select>` — na mobilu sice nativní, ale nevidíte barvy
- Varianty zobrazují barvu jen jako malý kroužek 4×4, text "2" nebo "3" nic neříká
- Žádné seskupení podle barvy/délky

**Řešení — přepsat product picker na vizuální card-based výběr:**

1. **Nahradit `<select>` za vyhledávací input + scrollable list produktů** (cards)
   - Každý produkt = card s názvem, kategorií (VIRGIN/PREMIUM badge), originem
   - Tap na produkt → rozbalí varianty

2. **Varianty zobrazit jako vizuální grid s barvou:**
   - Každá varianta = button s:
     - Větší color swatch (16×16px → 24×24px nebo 32×32px)
     - Délka velký text
     - Název barvy (z i18n `tColors(getHairColor(v.color).nameKey)`)
     - Dostupnost (skladem X g) — fetch z price-preview nebo předat ze serverové stránky
   - Seskupit: **nejdřív barvy (horizontální scroll), pak délky pro každou barvu**
   - Nebo: grid layout kde řádky = barvy, sloupce = délky

3. **Implementační detaily:**
   - Přidat prop `colorName` do variant display (využít `getHairColor()` + `tColors()`)
   - Přidat stock info do product picker (potřeba fetchnout stock pro varianty produktu)
   - Přidat filtr/search do product listu
   - Mobile-friendly: velké tap targets (min 44×44px)

**Nové soubory:**
- `src/components/sales/ProductPicker.tsx` — nový komponent pro vizuální výběr produktu + varianty
  - Props: `products: ProductOption[]`, `onSelect: (variantId: string) => void`, `onClose: () => void`
  - Interní stav: selectedProduct, searchQuery
  - Layout: search input → product cards → variant grid s barvami

### KROK 2: Sjednotit look po QR scanu vs. ruční výběr

**Problém:** Po QR scanu se přidá item a uživatel pokračuje ve wizardu — ale nevidí product detail tak jako při ručním výběru.

**Řešení:** 
- `SaleItemRow.tsx` — přidat color swatch k `variantLabel`
  - Parse barvu z label nebo předat `color` jako novou prop
  - Zobrazit barevný kroužek vedle názvu varianty
  - Tím bude UX konzistentní — vždy vidíte barvu

**Změny v `SaleItemRow`:**
- Přidat prop `color?: string` do `SaleItemData` interface
- Zobrazit `<span style={{backgroundColor: getHairColor(color).hex}} />` vedle `variantLabel`

**Změny v `NewSaleWizard`:**
- Při `addItemFromVariantId` předat barvu do item dat:
  ```tsx
  const v = p.variants.find(v => v.id === variantId);
  // ...
  setItems(prev => [...prev, { ...item, color: v.color }]);
  ```

### KROK 3: Sjednotit layout prodeje a objednávek (Order = B2B salon flow)

**Analýza:** Objednávky (Orders) = B2B flow pro salony přes salon portál. Prodej (Sales) = admin flow přes interní panel.

**Klíčový insight:** Tyto dva flow slouží RŮZNÝM uživatelům:
- **Orders** = salon si objednává z katalogu → admin potvrzuje → vytvoří se Sale
- **Sales** = admin prodává přímo (QR scan culíku, nebo walk-in zákazník)

**Co sjednotit:**
- Obě stránky by měly zobrazovat produkty se **stejným vizuálním stylem** (barvy, layout variant)
- Salon portál order page (`/salon/orders/`) by měl mít stejný picker jako admin prodej

**ALE:** Toto je VELKÝ scope — salon portál order flow je v jiných souborech a řeší jiný use case. Doporučuji to jako separátní task.

**Pro tento task se zaměřit na:**
- Vylepšit product picker v `NewSaleWizard` (KROK 1)
- Přidat barvy do `SaleItemRow` (KROK 2)  
- Extrahovat `ProductPicker` jako reusable komponent, aby se dal později použít i v salon portálu

---

## Technické detaily

### Nový komponent `ProductPicker.tsx`

```
Struktura UI:
┌─────────────────────────────┐
│ 🔍 Hledat produkt...        │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🏷️ Raw Cambodian Virgin  │ │  ← Product card
│ │ VIRGIN · Kambodža       │ │
│ │ ┌──────┐ ┌──────┐       │ │
│ │ │ ⬤ 40 │ │ ⬤ 50 │ ...   │ │  ← Variant buttons s barvou
│ │ │ #1   │ │ #1   │       │ │
│ │ │ 250g │ │ 120g │       │ │  ← Dostupné gramy
│ │ └──────┘ └──────┘       │ │
│ │ ┌──────┐ ┌──────┐       │ │
│ │ │ ⬤ 40 │ │ ⬤ 50 │       │ │
│ │ │ #3   │ │ #3   │       │ │
│ │ └──────┘ └──────┘       │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Raw Vietnamese Premium   │ │
│ │ PREMIUM · Vietnam       │ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Variant buttons layout:**
- Seskupené podle barvy (řádky)
- V každém řádku: color swatch + color name + buttony pro jednotlivé délky
- Každý button: délka (cm) + dostupné gramy/kusy
- Vyprodané = disabled + šedé
- Tap → `onSelect(variantId)` + zavře picker

### Změny v existujících souborech

1. **`NewSaleWizard.tsx`**
   - Nahradit inline product picker (řádky 356-393) za `<ProductPicker />`
   - Přidat `color` do `SaleItem` interface
   - V `addItemFromVariantId` populovat `color` 

2. **`SaleItemRow.tsx`**
   - Přidat `color?: string` do `SaleItemData` interface
   - Přidat color swatch vedle `variantLabel`

3. **`page.tsx` (sales/new)**
   - Možná přidat stock data do product options předávaných do wizardu (aby picker zobrazoval dostupnost bez extra API volání)
   - NEBO: ProductPicker si stock fetchne lazy per-produkt

### Stock data pro picker

**Varianta A (doporučená):** Lazy loading — picker si pro expandovaný produkt fetchne stock data z `/api/stock?variantIds=xxx,yyy`
- PRO: Jednoduchý, žádné změny v server page
- PROTI: Extra API call per produkt

**Varianta B:** Předat stock data ze serveru
- PRO: Žádné extra API calls
- PROTI: Větší payload, potřeba změnit `page.tsx`

**Doporučení:** Varianta A — lazy loading, protože:
- Obvykle je v pickeru jen pár produktů expandovaných
- Server page nemusí loadovat celý stock
- Stock se může měnit, lazy = aktuální data

### Pořadí implementace

1. Vytvořit `ProductPicker.tsx` 
2. Upravit `SaleItem` interface (přidat `color`)
3. Upravit `addItemFromVariantId` v `NewSaleWizard` (předávat `color`)
4. Upravit `SaleItemRow` (zobrazit barvu)
5. Nahradit inline picker v `NewSaleWizard` za `<ProductPicker />`
6. Otestovat QR flow (scan → přidá item se správnou barvou)
7. Otestovat ruční flow (picker → vyber → přidá item)

### I18n klíče k přidání

Do `sale` namespace v `messages/cs.json`, `uk.json`, `ru.json`:
```json
"pickProduct": "Vybrat produkt",
"availableGrams": "Dostupné: {count} g",
"availablePieces": "Dostupné: {count} ks",
"soldOut": "Vyprodáno",
"colorLabel": "Barva {code}"
```

---

## Scope shrnutí

| Co | Kde | Priorita |
|----|-----|----------|
| Nový `ProductPicker` s vizuálním výběrem + barvami | Nový komponent | P0 |
| Color swatch v `SaleItemRow` | Úprava existujícího | P0 |
| Předávání barvy v `addItemFromVariantId` | `NewSaleWizard` | P0 |
| Nahradit inline picker za `<ProductPicker />` | `NewSaleWizard` | P0 |
| Stock info v pickeru (lazy load) | `ProductPicker` + API | P1 |
| Sjednotit salon order picker (future) | Separátní task | P2 |

## Rizika

- **Stock API:** Pokud není endpoint pro bulk variant stock, bude třeba přidat nebo použít existující price-preview
- **Výkon:** Lazy loading stock dat by neměl blokovat UI, ale je potřeba loading state
- **Mobile UX:** Picker musí být scrollable a touch-friendly, velké tap targets
