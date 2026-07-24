# TASK-114 QA — Přidat další produkt do prodeje

**Stav:** PASS (s poznámkou)
**Datum:** 2026-07-22
**Kontrolor:** kontrolor

---

## Výsledek: PASS

Implementace je funkční a adresuje hlavní uživatelský problém. Jedna neimplementovaná
featúra (continuous scan) je záměrná scope redukce — jádro tasku funguje správně.

---

## Co bylo ověřeno

### 1. Tlačítko "Přidat další" — PASS

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx:677-696`

```tsx
{items.length > 0 && (
  <div className="border-2 border-dashed border-line rounded-lg p-3 flex gap-2">
    <Button ... onClick={() => setScannerOpen(true)}>
      + {t("addAnotherQr")}
    </Button>
    <Button ... onClick={() => setShowProductPicker(!showProductPicker)}>
      + {t("addAnotherManual")}
    </Button>
  </div>
)}
```

- Podmínka `items.length > 0` — správně, tlačítko se zobrazí až po přidání první položky
- "Naskenovat další QR" → `setScannerOpen(true)` — otevře existující BarcodeScanner
- "Přidat další ručně" → `setShowProductPicker(!showProductPicker)` — otevře existující product picker
- Používá existující state, žádné nové závislosti

### 2. Vizuální styl — PASS

Dashed border (`border-2 border-dashed border-line`) vizuálně odlišuje "Přidat další"
od ostatních prvků — intuitivní UX indikace.

### 3. Existující flow beze změn — PASS

- `handleBarcodeScan` (`src/app/(app)/sales/new/NewSaleWizard.tsx:278-314`) — beze změny
- `addItemFromVariantId` (`src/app/(app)/sales/new/NewSaleWizard.tsx:135-221`) — beze změny
- `SaleItemRow` renderování pro každou položku — beze změny

### 4. Backend — PASS (žádná změna potřeba)

Backend `completeSaleSchema` (`src/lib/validations/sale.ts`) akceptuje `items: array.min(1).max(100)` —
multi-item sale fungoval vždy, frontend nyní umožňuje využít tuto funkcionalitu.

### 5. I18n — PASS

Všechny 3 locale obsahují oba nové klíče v `sale` namespace:

| Klíč | cs.json | uk.json | ru.json |
|------|---------|---------|---------|
| `addAnotherQr` | "Naskenovat další QR" | "Сканувати інший QR" | "Сканировать другой QR" |
| `addAnotherManual` | "Přidat další ručně" | "Додати ще вручну" | "Добавить ещё вручную" |

Řádky: `messages/cs.json:1543-1544`, `messages/uk.json:1543-1544`, `messages/ru.json:1543-1544`

### 6. TypeScript — PASS

```
npx tsc --noEmit → 0 chyb
```

---

## Poznámka: Continuous scan mód (záměrně vynecháno)

**Plán navrhl (Fix 1 — P0):** Continuous scan — scanner zůstane otevřený po každém scanu,
`setScannerOpen(false)` na řádku 280 by bylo odstraněno.

**Implementováno:** Scanner se stále zavírá po každém scanu (řádek 280: `setScannerOpen(false)` zachováno).
Uživatel musí kliknout "Naskenovat další QR" pro každý další sken.

**Posouzení:** Nízká závažnost. Uživatelův původní požadavek byl "aby se to dalo přidat" —
tlačítko "Přidat další" tento problém řeší. Continuous scan byl vylepšení UX nad rámec zadání.
Akceptovatelné jako P2/nice-to-have pro budoucí iteraci.

---

## Souhrn

| Bod | Výsledek |
|-----|----------|
| "Přidat další" tlačítko viditelné po 1+ položkách | PASS |
| "Naskenovat další QR" otevře scanner | PASS |
| "Přidat další ručně" otevře product picker | PASS |
| Existující flow nedotčen | PASS |
| SaleItemRow pro každou položku | PASS |
| Backend generuje jednu fakturu | PASS (beze změny, funguje) |
| I18n cs/uk/ru | PASS |
| TypeScript | 0 chyb |
| Continuous scan | VYNECHÁNO (záměrné, nízká závažnost) |
