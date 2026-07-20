# QA Report — Task #36: DPH inclusive fix (commit 5e2b5bf)

**Datum:** 2026-07-15  
**Výsledek: PASS**

---

## Ověření vzorce DPH — reverse calc (inclusive)

Správný vzorec: ceny JIŽ obsahují DPH, proto se DPH extrahuje zpětně:
```
totalAmount = subtotal - discountAmount
vatAmount   = totalAmount * 2100 / 12100
totalBeforeVat = totalAmount - vatAmount
```

### 1. src/lib/sales.ts ~řádky 114-118 ✅
```ts
const totalAmount = roundHalereUp(subtotal - discountAmount);
const vatRate = 2100; // 21%
const vatAmount = roundHalereUp((totalAmount * vatRate) / 12100);
const totalBeforeVat = totalAmount - vatAmount;
```
Správný reverse calc. Žádné `subtotal * vatRate / 10000`. ✅

### 2. src/app/(app)/sales/new/NewSaleWizard.tsx ~řádky 88-90 ✅
```ts
const totalAmount = roundUp(subtotal - discountAmount);
const vatAmount = roundUp((totalAmount * 2100) / 12100);
const totalBeforeVat = totalAmount - vatAmount;
```
Shodný vzorec s backend. ✅

### 3. src/lib/credit-note.ts ~řádky 24-27 ✅
```ts
const itemsTotal = returnItems.reduce((sum, item) => sum + item.lineTotal, 0);
const total = -itemsTotal;
const vatAmount = -roundHalereUp((itemsTotal * original.vatRate) / 12100);
const subtotal = total - vatAmount;
```
Credit note: používá `original.vatRate` (z faktury) místo hardcoded 2100 — správně. Reverse calc zachován. ✅

---

## TypeScript: 0 chyb ✅

---

## Závěr

Task #36: PASS. DPH inclusive reverse calc správně implementován ve všech 3 souborech. Frontend a backend konzistentní. Credit note korektně používá sazbu z původní faktury.
