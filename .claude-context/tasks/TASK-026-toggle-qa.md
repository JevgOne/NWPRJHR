# QA Report — #26 Toggle "Na objednávku" (product-serializer.ts)

**Datum:** 2026-07-15  
**Výsledek: PASS**

## Ověření

### product-serializer.ts — OWNER case (řádek 21–34)
```ts
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
    availableToOrder: variant.availableToOrder,   // ✅
    orderLeadDays: variant.orderLeadDays,          // ✅
  };
```

### product-serializer.ts — EMPLOYEE case (řádek 35–46)
```ts
case "EMPLOYEE":
  return {
    ...base,
    sellingMode: variant.sellingMode,
    wholesalePricePerGram: variant.wholesalePricePerGram,
    retailPricePerGram: variant.retailPricePerGram,
    pricePerPiece: variant.pricePerPiece,
    retailPricePerPiece: variant.retailPricePerPiece,
    availableToOrder: variant.availableToOrder,   // ✅
    orderLeadDays: variant.orderLeadDays,          // ✅
  };
```

### SALON / HAIRDRESSER — korektně bez těchto polí
SALON a HAIRDRESSER case neobsahují `availableToOrder` / `orderLeadDays` — správně, B2B role tyto admin pole nepotřebují. ✅

### API endpoint /api/variants/[id] (updateVariantSchema)
```ts
availableToOrder: z.boolean().optional(),
orderLeadDays: z.number().int().min(1).max(90).nullable().optional(),
```
Validace přijímá obě pole. PUT request z VariantTable toggle funguje. ✅

## Reverzní kontrola

Uživatel: "Toggle 'Na objednávku' na variantě nefunguje"

Příčina bugu byla: `availableToOrder` a `orderLeadDays` chyběly v product-serializer OWNER/EMPLOYEE case → frontend dostával `undefined` → toggle se nikdy nepřepnul vizuálně (hodnota vždy false/undefined), i když se data do DB uložila.

Po opravě:
- ✅ OWNER vidí `availableToOrder` a `orderLeadDays` v serialized variantě
- ✅ EMPLOYEE také (pro info)
- ✅ Toggle v VariantTable.tsx reaguje na skutečnou hodnotu z DB
- ✅ Input "dní" se zobrazí správně pokud `variant.availableToOrder === true`

## TypeScript
0 chyb (npx tsc --noEmit).

## Závěr
PASS. Toggle funguje — serializer nyní správně předává obě pole pro OWNER i EMPLOYEE.
