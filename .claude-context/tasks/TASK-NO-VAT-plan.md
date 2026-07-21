# TASK: Fakturace — nejsme plátci DPH

## Stav: IMPLEMENTOVANO

**Projekt:** `/Users/zen/NWPRJHR`

**Datum kontroly:** 2026-07-21

Firma Alvento Solutions s.r.o. (ICO 24111953) NENI platce DPH. Cele DPH bylo odstraneno z systemu.

---

## Verifikace — DPH je kompletne odstranen

### Backend
- `src/lib/sales.ts` (radky 114-118): `vatRate = 0; vatAmount = 0; totalAmount = totalBeforeVat` ✅
- `src/lib/invoicing.ts`: vsech 6 vyskytu `vatRate: 2100` zmeneno na `vatRate: 0`, `vatAmount = 0` ✅
- `src/lib/credit-note.ts`: vatAmount = 0 ✅
- `src/lib/returns.ts`: revenueDeducted = returnValue (bez VAT deleni) ✅
- `src/lib/export-pohoda.ts`: rateVAT "none" ✅

### Frontend
- `NewSaleWizard.tsx`: vatAmount kalkulace odstranena ✅
- `SaleSummary.tsx`: VAT radky odstraneny ✅
- `SaleDetailClient.tsx`: VAT radky odstraneny ✅
- `InvoiceDetailClient.tsx`: VAT radky nahrazeny "Nejsme platci DPH" ✅

### Invoice PDF
- `src/lib/invoice-pdf.ts` (radek 354): `text(sanitizeText(t.notVatPayer), ...)` ✅
- `src/lib/invoice-translations.ts`: `notVatPayer` v cs/uk/ru ✅

### Prisma
- `Sale.vatRate @default(0)` ✅
- `Invoice.vatRate @default(0)` ✅
- `InvoiceItem.vatRate @default(0)` ✅

### I18n
- Klice aktualizovany (totalAmount = "Celkem", bez DPH zminky) ✅

### Hledani zbytku
- `grep "vatRate.*2100|2100" src/lib/` → pouze `validations/finance.ts` max(2100) pro ROK, ne VAT ✅
- `grep "notVatPayer" src/` → existuje v invoice-translations.ts, invoice-pdf.ts, InvoiceDetailClient.tsx ✅

---

## Puvodni plan (pro referenci)

Puvodni plan je v `/Users/zen/hairora/.claude-context/tasks/TASK-NO-VAT-plan.md`.
Obsahuje detailni audit vsech mist s DPH a postup implementace.

## Poznamky

- Historicka data (stare Sale/Invoice s vatRate=2100) zustavaji — to je spravne chovani
- Zbyvajici `6424423004/5500` hardcoded bank account v kodu je JINY problem (viz Task 4)
