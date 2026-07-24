# TASK-114: Prodej — přidání více produktů (QR) do jedné faktury — Plán

## Analýza problému

Uživatel: "když prodavame 1 salonu vlasy nebo koncovému zakazníkovi a on si chce vzít 2-3 druhy jinych, tak se tam neda přidat nic po tom co načtu QR"

### Skutečný stav — FUNGUJE to, ale uživatel to neví

Po důkladné analýze kódu jsem zjistil, že **přidání více produktů do jednoho prodeje JIŽ FUNGUJE** na úrovni kódu:

1. **Backend:** `completeSaleSchema` v `src/lib/validations/sale.ts:30` akceptuje `items: z.array(saleItemSchema).min(1).max(100)` — až 100 položek v jednom prodeji.

2. **Frontend state:** `NewSaleWizard.tsx:82` — `items` je array (`useState<SaleItem[]>([])`) a `addItemFromVariantId` (řádky 135-221) přidává do pole pomocí `setItems(prev => [...prev, newItem])`.

3. **QR scan handler:** `handleBarcodeScan` (řádky 278-313) po naskenování volá `addItemFromVariantId` který PŘIDÁVÁ novou položku do existujícího pole. Jediné omezení je **duplicate check** na řádku 309: `if (items.some((i) => i.variantId === variantId)) return;` — stejnou variantu nejde přidat dvakrát (logické).

4. **Manuální výběr:** Tlačítko "Vybrat ručně" (řádky 617-664) také funguje pro přidání dalších položek.

5. **UI:** Tlačítka "Naskenovat QR" a "Vybrat ručně" (řádky 609-625) jsou VŽDY viditelné v sekci Items — i po přidání první položky.

### Tak kde je problém?

Problém je **UX/vizuální**, ne technický:

1. **Po prvním QR scanu se scanner zavře** (`setScannerOpen(false)` na řádku 280) — uživatel musí znovu kliknout na "Naskenovat QR" pro další sken. To není intuitivní — uživatel čeká že scanner zůstane otevřený.

2. **Chybí vizuální indikace** že jde přidat další položku. Po přidání první položky se zobrazí `SaleItemRow` a pod ním summary — ale žádné výrazné "Přidat další produkt" tlačítko.

3. **Tlačítka "Naskenovat QR" a "Vybrat ručně"** jsou nahoře v Items kartě, ale po přidání položek se odscrollují mimo viditelnost na menším displeji.

4. **Scanner se zavírá po KAŽDÉM scanu** — pro přidání 3 produktů musí uživatel 3× kliknout na "Naskenovat QR". Měl by být "continuous scan" mód.

---

## Řešení

### Fix 1: Continuous scan mód (P0)
**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`
**Řádek:** 278-313 (`handleBarcodeScan`)

Aktuálně scanner se zavírá hned po scanu (řádek 280: `setScannerOpen(false)`).

**Změna:** Nechat scanner otevřený po scanu, přidat toast/feedback o přidané položce, zavřít jen ručně.

```tsx
const handleBarcodeScan = useCallback(
  async (scanned: string) => {
    // ODSTRANIT: setScannerOpen(false);  ← scanner zůstane otevřený

    if (!customerType) {
      setCustomerType("RETAIL");
    }

    let variantId: string | null = null;
    let barcodeProduct = null;

    const urlMatch = scanned.match(/variantId=([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      variantId = urlMatch[1];
    } else {
      const res = await fetch(`/api/deliveries/barcode/${encodeURIComponent(scanned)}`);
      if (!res.ok) {
        setError(t("barcodeNotFound"));
        return;
      }
      const delivery = await res.json();
      variantId = delivery.variant?.id ?? delivery.variantId;
      barcodeProduct = delivery.variant?.product ?? null;
    }

    if (!variantId) return;

    if (items.some((i) => i.variantId === variantId)) {
      // Místo tichého skipu — zobrazit feedback
      setScanFeedback(t("itemAlreadyAdded"));
      return;
    }

    await addItemFromVariantId(variantId, barcodeProduct);
    setScanFeedback(t("itemAdded"));  // nový state pro feedback
  },
  [addItemFromVariantId, t, customerType, items]
);
```

Nový state:
```tsx
const [scanFeedback, setScanFeedback] = useState<string | null>(null);
```

Auto-clear feedback po 2s:
```tsx
useEffect(() => {
  if (scanFeedback) {
    const timer = setTimeout(() => setScanFeedback(null), 2000);
    return () => clearTimeout(timer);
  }
}, [scanFeedback]);
```

### Fix 2: Výrazné "Přidat další" tlačítko (P0)
**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`
**Řádky:** 666-675 (za items.map)

Po vykreslení všech `SaleItemRow` přidat viditelné tlačítko pro přidání dalšího produktu:

```tsx
{items.map((item, i) => (
  <SaleItemRow key={...} ... />
))}

{/* === NOVÉ: Přidat další produkt === */}
{items.length > 0 && (
  <div className="border-2 border-dashed border-line rounded-lg p-3 flex gap-2">
    <Button
      size="lg"
      variant="secondary"
      className="flex-1"
      onClick={() => setScannerOpen(true)}
    >
      + {t("addAnotherQr")}
    </Button>
    <Button
      variant="secondary"
      size="lg"
      className="flex-1"
      onClick={() => setShowProductPicker(!showProductPicker)}
    >
      + {t("addAnotherManual")}
    </Button>
  </div>
)}
```

### Fix 3: Feedback v BarcodeScanner overlay (P1)
**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`
**Řádky:** 677-681 (BarcodeScanner)

Předat `scanFeedback` jako overlay do scanneru:

```tsx
<BarcodeScanner
  active={scannerOpen}
  onScan={handleBarcodeScan}
  onClose={() => setScannerOpen(false)}
/>
{/* Scan feedback toast — zobrazí se nad scannerem */}
{scannerOpen && scanFeedback && (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
    {scanFeedback}
  </div>
)}
```

### Fix 4: Počet položek v headeru (P2)
**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`

V Items kartě přidat badge s počtem položek:

```tsx
<Card>
  <div className="space-y-3">
    {items.length > 0 && (
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-ink">
          {t("itemsInSale", { count: items.length })}
        </span>
      </div>
    )}
    <div className="flex gap-2">
      <Button ... onClick={() => setScannerOpen(true)}>
        {t("scanBarcode")}
      </Button>
      ...
```

---

## I18n klíče

**Soubory:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json` v namespace `sale`:

```json
// cs.json
"addAnotherQr": "Naskenovat další QR",
"addAnotherManual": "Přidat další ručně",
"itemAdded": "Produkt přidán",
"itemAlreadyAdded": "Tento produkt je již v prodeji",
"itemsInSale": "{count, plural, one {# položka} few {# položky} other {# položek}}"

// uk.json
"addAnotherQr": "Сканувати інший QR",
"addAnotherManual": "Додати ще вручну",
"itemAdded": "Продукт додано",
"itemAlreadyAdded": "Цей продукт вже в продажу",
"itemsInSale": "{count, plural, one {# товар} few {# товари} other {# товарів}}"

// ru.json
"addAnotherQr": "Сканировать другой QR",
"addAnotherManual": "Добавить ещё вручную",
"itemAdded": "Продукт добавлен",
"itemAlreadyAdded": "Этот продукт уже в продаже",
"itemsInSale": "{count, plural, one {# товар} few {# товара} other {# товаров}}"
```

---

## Soubory k úpravě

| # | Soubor | Změna | Řádky |
|---|--------|-------|-------|
| 1 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Continuous scan, "Přidat další" tlačítko, scan feedback, items badge | ~30 řádků nových |
| 2 | `messages/cs.json` | 5 nových klíčů v `sale` namespace | 5 řádků |
| 3 | `messages/uk.json` | 5 nových klíčů v `sale` namespace | 5 řádků |
| 4 | `messages/ru.json` | 5 nových klíčů v `sale` namespace | 5 řádků |

## Rozsah
- 4 soubory
- ~45 řádků změn
- Žádné nové závislosti
- Žádná DB migrace
- Backend nepotřebuje žádnou změnu (multi-item sale funguje)

## Implementační pořadí
1. Continuous scan (odstranit `setScannerOpen(false)` z handleBarcodeScan)
2. Scan feedback state + auto-clear
3. "Přidat další" tlačítko za items
4. I18n klíče
5. Feedback toast v scanner overlay
6. Items count badge (optional)

## Testování
1. Naskenovat 1 QR → scanner zůstane otevřený
2. Naskenovat 2. QR (jiná varianta) → přidá se jako 2. položka, feedback "Produkt přidán"
3. Naskenovat stejný QR znovu → feedback "Tento produkt je již v prodeji"
4. Zavřít scanner ručně (X) → vidět 2 položky + "Přidat další" tlačítko
5. Kliknout "Přidat další ručně" → otevře se product picker, přidat 3. položku
6. Dokončit prodej → faktura obsahuje 3 položky

## Rizika
- **Žádné:** Backend multi-item sale funguje bez změn
- **Nízké:** Continuous scan mód — ověřit že `BarcodeScanner` komponenta nezačne scanovat duplicitně
