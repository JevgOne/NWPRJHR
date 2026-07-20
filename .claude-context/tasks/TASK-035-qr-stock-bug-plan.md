# TASK-035: QR scan "nedostatek zásob" — stock check bug in sale flow

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

User naskenoval QR kód produktu (BY_PIECE varianta, 1 ks na skladě). Sale stránka zobrazí "nedostatek zásob" (insufficient stock), přestože inventory ukazuje 1 ks.

---

## Root cause: FIFO filtr `WHERE remainingGrams > 0`

### BUG v `src/lib/fifo.ts` řádek 40-46:

```sql
SELECT * FROM "deliveries"
WHERE "variantId" = ${variantId}
  AND "remainingGrams" > 0    -- ← PROBLÉM
ORDER BY "stockedAt" ASC
FOR UPDATE
```

Tento SQL filtr **vylučuje delivery záznamy kde `remainingGrams = 0`**, i když mají `remainingPieces > 0`.

### Kdy se to stane

Pro BY_PIECE produkty (culíky) existují 2 scénáře:

**Scénář A — `totalGrams` nebyl nastaven při stock-in:**
- StockInForm odesílá `totalGrams: 0` pro BY_PIECE (validation povoluje `min(0)`)
- Deliveries route: `effectiveTotalGrams = totalPieces * pieceWeightGrams` → funguje OK pokud `pieceWeightGrams > 0`
- ALE: pokud `pieceWeightGrams` nebylo správně nastaveno → `effectiveTotalGrams = 0` → `remainingGrams = 0`

**Scénář B — částečný prodej:**
- BY_PIECE varianta měla `remainingGrams = 200, remainingPieces = 2`
- Prodej 1 kusu: FIFO odečte `remainingGrams -= pieceWeightGrams, remainingPieces -= 1`
- Pokud `pieceWeightGrams` je 0 v delivery (špatná data) → odečte 0 gramů
- Následně se prodá zbytek gramů jiným prodejem → `remainingGrams = 0`, ale `remainingPieces = 1`

### Důsledek

| Systém | Co vidí | Proč |
|--------|---------|------|
| Inventory page (`getAllStockNumbers`) | **1 ks** (správně) | `SUM(remainingPieces)` bez filtru |
| Price preview (`getStockNumbers`) | **1 ks** (správně) | `SUM(remainingPieces)` bez filtru |
| SaleItemRow (klient) | **1 ks dostupný** (správně) | Z price-preview |
| Sale submit (`fifoDeduct`) | **0 ks** (ŠPATNĚ!) | `WHERE remainingGrams > 0` vylučuje delivery |
| → User vidí | "nedostatek zásob" | |

### Proč se to neprojeví pro BY_GRAM

BY_GRAM produkty mají `remainingGrams > 0` vždy dokud mají jakýkoli stock. Filtr funguje správně pro ně.

---

## Ale kde přesně se zobrazuje "nedostatek zásob" na UI?

Jsou DVĚ místa:

### 1. SaleItemRow (CLIENT-SIDE) — `src/components/sales/SaleItemRow.tsx:44-46`

```typescript
const insufficientStock = isByPiece
    ? item.pieces > item.availablePieces  // 1 > availablePieces
    : item.grams > item.availableGrams;
```

`availablePieces` pochází z `price-preview` API → `getStockNumbers()` → `SUM(remainingPieces)` BEZ filtru.

**Pokud `getStockNumbers` vrátí `availablePieces = 1`** → `1 > 1 = false` → žádný error → klient neblokuje.

**Pokud `getStockNumbers` vrátí `availablePieces = 0`** → `1 > 0 = true` → "nedostatek zásob" → **klient blokuje**.

### 2. Sale API submit (SERVER-SIDE) — `src/lib/fifo.ts:64-66`

```typescript
if (requestedPieces > 0 && totalAvailablePieces < requestedPieces) {
    throw new InsufficientStockError("pieces", requestedPieces, totalAvailablePieces);
}
```

**Toto crashne pokud FIFO SQL vrátí 0 deliveries** (kvůli `WHERE remainingGrams > 0`).

### Závěr: Bug může být na KLIENTU i SERVERU

- Pokud delivery má `remainingPieces > 0` ale `remainingGrams = 0`:
  - `getStockNumbers` vrátí `availablePieces = 0` (protože `aggregate` sečte ze VŠECH deliveries = "remainingPieces ze záznamů kde remainingGrams=0" se sečte) → **WAIT, ne** — `getStockNumbers` nemá filtr, sečte VŠECHNY deliveries
  
Počkej — přečetl jsem to znova. `getStockNumbers` (stock.ts řádky 27-33):
```typescript
const physical = await db.delivery.aggregate({
    where: { variantId },
    _sum: { remainingGrams: true, remainingPieces: true },
});
```
BEZ filtru `remainingGrams > 0`. Takže sečte i záznamy kde `remainingGrams = 0`.

**→ `getStockNumbers` vrátí `availablePieces = 1` správně.**
**→ Klientský check NEPROJDE (1 > 1 = false = OK).**
**→ User může kliknout "Potvrdit prodej".**
**→ Server-side `fifoDeduct` filtruje `WHERE remainingGrams > 0` → najde 0 záznamů → `InsufficientStockError`**
**→ API vrátí 500 → klient zobrazí error zprávu**

ALE user říká že vidí "nedostatek zásob" na stránce (ne po submitu). To by znamenalo že klientský check PROJDE — tedy `availablePieces` z price-preview je 0.

**Druhá možnost:** User možná vidí error PO submitu, ne na stránce. Zpráva "nedostatek zásob" je i18n klíč `sale.insufficientStock`, používaný na SaleItemRow. Ale server error message "Insufficient stock: requested 1 pieces, available 0" by se zobrazil jako JSON v error handleru (NewSaleWizard.tsx řádek 299).

---

## Doporučený fix

### Fix 1: Opravit FIFO SQL filtr (HLAVNÍ)

**Soubor:** `src/lib/fifo.ts` řádek 40-46

```sql
-- SOUČASNÝ (vylučuje BY_PIECE záznamy kde remainingGrams=0):
WHERE "variantId" = ${variantId}
  AND "remainingGrams" > 0

-- NAVRHOVANÝ FIX:
WHERE "variantId" = ${variantId}
  AND ("remainingGrams" > 0 OR "remainingPieces" > 0)
```

Toto zahrne delivery záznamy kde:
- `remainingGrams > 0` (BY_GRAM nebo BY_PIECE s váhou)
- NEBO `remainingPieces > 0` (BY_PIECE bez nastavené váhy)

### Fix 2: Zajistit že `remainingGrams` je vždy > 0 pro BY_PIECE

V `src/lib/stock-in.ts` přidat validation:

```typescript
// Pokud BY_PIECE a remainingGrams by byl 0, nastavit na minimální hodnotu
const effectiveRemainingGrams = data.totalGrams > 0 ? data.totalGrams : (data.totalPieces > 0 ? data.totalPieces : 0);
```

Toto je PREVENTIVNÍ fix — zajistí že nové stock-in záznamy budou mít vždy `remainingGrams > 0`.

### Fix 3: Opravit existující data (ONE-TIME)

Pokud existují delivery záznamy kde `remainingGrams = 0` ale `remainingPieces > 0`, opravit:

```sql
UPDATE deliveries
SET remainingGrams = remainingPieces * COALESCE(pieceWeightGrams, 100)
WHERE remainingGrams = 0 AND remainingPieces > 0;
```

---

## Soubory k úpravě

| # | Soubor | Řádek | Změna | Priorita |
|---|--------|-------|-------|----------|
| 1 | `src/lib/fifo.ts` | 43 | Změnit `AND "remainingGrams" > 0` → `AND ("remainingGrams" > 0 OR "remainingPieces" > 0)` | KRITICKÁ |
| 2 | `src/lib/stock-in.ts` | 51 | Zajistit `remainingGrams > 0` i pro BY_PIECE | STŘEDNÍ |

---

## Shrnutí

**Root cause:** FIFO deduction SQL v `fifo.ts` filtruje `WHERE remainingGrams > 0`, čímž vylučuje BY_PIECE delivery záznamy kde `remainingGrams = 0` ale `remainingPieces > 0`.

**Důsledek:** Inventory správně ukazuje "1 ks", ale při pokusu o prodej server-side FIFO deduction nenajde žádný stock a vyhodí InsufficientStockError.

**Fix:** Změnit FIFO SQL filtr na `AND ("remainingGrams" > 0 OR "remainingPieces" > 0)` v `src/lib/fifo.ts` řádek 43.
