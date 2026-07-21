# QA Report — Task #6: QR štítky — SKU místo barcode

**Datum:** 2026-07-21  
**Kontrolor:** QA agent  
**Typ kontroly:** Reverzní kontrola + Debug

---

## 1. Zadání (z TaskList)

> QR štítky — přidat SKU + přegenerovat všechny na skladě

Konkrétně: nahradit barcode za SKU generované z category/texture/color/lengthCm.

---

## 2. Reverzní kontrola — bod po bodu

### ✅ SKU generování je správně implementováno

**`src/lib/sku.ts`** — `generateSku(category, texture, color, lengthCm)` existuje a funguje:
- Formát: `{CAT}-{TEX}-{COL}-{LEN}` (např. `V-RV-01-50`)
- Mapování kategorií: VIRGIN→V, LUXE→L, STANDARD→S, SALE→X, ACCESSORY→A
- Mapování textur: Rovné→RV, Mírně vlnité→MV, Vlnité→VL, Kudrnaté→KU
- Fallback: kategorie `?` nebo textura `XX` pokud chybí

### ✅ StockInForm.tsx — barcode nahrazen SKU

- `barcode` odstraněn z `SuccessData` interface
- `barcode: result.barcode ?? ""` odstraněn z success callbacku
- Zobrazení SKU: `generateSku(category, texture, color, lengthCm ?? 0)` volán správně
- Download filename: `qr-${sku}.png` místo `qr-${barcode}.png`

### ✅ QrLabelSheet.tsx — barcode odstraněn

- `barcode?: string | null` odstraněno z `LabelData` interface
- Na štítku se nyní zobrazuje `label.variantId.slice(-8)` místo `label.barcode ?? ...`

**POZOR:** QrLabelSheet nezobrazuje SKU, zobrazuje pouze zkrácený variantId. Pokud bylo zadáním ukázat SKU i na fyzickém štítku, toto není splněno — pouze barcode byl odstraněn, ale SKU nepřidáno.

---

## 3. Cizí změny v diffstatu (VAROVÁNÍ)

Soubory **nesouvisející s Task #6** jsou v uncommitted změnách:

| Soubor | Rozsah | Popis |
|--------|--------|-------|
| `prisma/schema.prisma` | +7 řádků | Nový schema (pravděpodobně DEPOSIT invoice) |
| `src/app/api/reservations/[id]/route.ts` | ±19 | Settlement invoice logika — jiný task |
| `src/app/api/reservations/route.ts` | ±16 | Rezervace změny — jiný task |
| `src/lib/invoicing.ts` | +301 | Deposit/Settlement invoice — Task #104? |
| `src/lib/reservations.ts` | +1 | Drobná změna |
| `src/lib/validations/reservation.ts` | +1 | Drobná změna |

**Tyto změny NEJSOU součástí Task #6.** Jsou to změny z jiného tasku (pravděpodobně Task #104 — záloha/deposit faktura), které nebyly ještě commitovány.

---

## 4. TypeScript check

```
npx tsc --noEmit → 0 chyb, 0 warningů ✅
```

---

## 5. Simplify kontrola

- `generateSku` je volán 2x v StockInForm.tsx ze stejných proměnných — mohlo by být extrahováno do proměnné, ale není kritické
- Žádné duplicity ani zbytečná složitost v SKU implementaci

---

## 6. Závěr

| # | Kritérium | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | SKU generuje se správně z category/texture/color/lengthCm | ✅ | Formát `CAT-TEX-COL-LEN` |
| 2 | Cizí soubory nebyly omylem změněny | ⚠️ VAROVÁNÍ | 6 souborů z jiného tasku jsou v diff |
| 3 | TypeScript build projde | ✅ | 0 chyb |
| 4 | QrLabelSheet zobrazuje SKU na štítku | ❓ | Zobrazuje variantId.slice(-8), ne SKU — záměr? |

---

## Doporučení

1. **Commit separovat** — Task #6 změny (StockInForm + QrLabelSheet) commitovat odděleně od Task #104 (invoicing/deposit) než se vše zamíchá
2. **Ověřit QrLabelSheet** — bylo v zadání zobrazit SKU na fyzickém QR štítku? Aktuálně tam SKU není, jen variantId suffix
