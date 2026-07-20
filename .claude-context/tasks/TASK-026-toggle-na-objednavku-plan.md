# TASK-026: Toggle "Na objednávku" na variantě nefunguje

**Status:** Analýza hotová — ROOT CAUSE nalezen
**Autor:** Plánovač
**Datum:** 2026-07-14

---

## Root cause

**Serializer stripuje `availableToOrder` a `orderLeadDays` z variant dat.**

`src/lib/api/product-serializer.ts` řádky 22-31 — OWNER case:

```typescript
case "OWNER":
    return {
        ...base,
        sellingMode: variant.sellingMode,
        costPricePerGram: variant.costPricePerGram,
        wholesalePricePerGram: variant.wholesalePricePerGram,
        retailPricePerGram: variant.retailPricePerGram,
        retailManualOverride: variant.retailManualOverride,
        pricePerPiece: variant.pricePerPiece,
        retailPricePerPiece: variant.retailPricePerPiece,
        // ← CHYBÍ: availableToOrder
        // ← CHYBÍ: orderLeadDays
    };
```

`base` (řádky 12-18) obsahuje pouze: `id, productId, lengthCm, color, active`. Žádný `availableToOrder`.

### Co se děje:

1. Prisma načte variant z DB → `availableToOrder: true`
2. Serializer ho ODSTRANÍ z odpovědi → `availableToOrder: undefined`
3. VariantTable dostane `variant.availableToOrder` = `undefined` → toggle zobrazí "OFF" (gray)
4. User klikne toggle → `!undefined` = `true` → `PUT /api/variants/{id}` with `{ availableToOrder: true }`
5. DB se aktualizuje správně na `true`
6. `router.refresh()` → page re-render → serializer znovu odstraní field → toggle zase OFF
7. User: "toggle nefunguje"

### Proč API PUT funguje ale UI ne:

- **PUT `/api/variants/{id}`** čte přímo z request body, validuje přes Zod, a zapisuje do DB → OK
- **GET product page** prochází přes serializer → stripuje `availableToOrder` → UI nedostane aktuální hodnotu

---

## Fix

### `src/lib/api/product-serializer.ts` — přidat 2 pole do OWNER i EMPLOYEE case

**OWNER case (řádek 22-31):**
```typescript
case "OWNER":
    return {
        ...base,
        sellingMode: variant.sellingMode,
        costPricePerGram: variant.costPricePerGram,
        wholesalePricePerGram: variant.wholesalePricePerGram,
        retailPricePerGram: variant.retailPricePerGram,
        retailManualOverride: variant.retailManualOverride,
        pricePerPiece: variant.pricePerPiece,
        retailPricePerPiece: variant.retailPricePerPiece,
        availableToOrder: variant.availableToOrder,     // ← PŘIDAT
        orderLeadDays: variant.orderLeadDays,           // ← PŘIDAT
    };
```

**EMPLOYEE case (řádek 33-41)** — also needs it (employees see variant table too):
```typescript
case "EMPLOYEE":
    return {
        ...base,
        sellingMode: variant.sellingMode,
        wholesalePricePerGram: variant.wholesalePricePerGram,
        retailPricePerGram: variant.retailPricePerGram,
        pricePerPiece: variant.pricePerPiece,
        retailPricePerPiece: variant.retailPricePerPiece,
        availableToOrder: variant.availableToOrder,     // ← PŘIDAT
        orderLeadDays: variant.orderLeadDays,           // ← PŘIDAT
    };
```

**SALON a HAIRDRESSER cases** — NEMĚNIT (B2B uživatelé nepotřebují admin toggle)

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/lib/api/product-serializer.ts` | Přidat `availableToOrder` + `orderLeadDays` do OWNER a EMPLOYEE case |

**Celkový odhad: 2 minuty.** Jednořádkový fix (2 pole, 2 case).

---

## Vedlejší poznámka

Stale closure pattern v `VariantTable.tsx` řádek 318:
```typescript
setSaving(variant.id === saving ? null : saving);
```

`saving` v closure je vždy `null` (hodnota z render time), takže výraz se vždy vyhodnotí jako `setSaving(null)`. Funguje ale je matoucí — mělo by být prostě `setSaving(null)`. Není to bug, jen nepřehledný kód. Oprava je volitelná.
