# TASK-097: Oddělené číslování faktur (karta vs hotovost)

**Priorita:** P1
**Stav:** IMPLEMENTOVÁNO, ČEKÁ DEPLOY

## Popis
Faktury potřebují oddělené číselné řady: hotovost vs karta/převod.

## Implementace (hotovo)
- Schema: InvoiceCounter má `prefix` field + `@@unique([year, prefix])`
- `invoice-number.ts`: prefix "H" = hotovost, "F" = faktura/karta
- Formát: H2026-0001 (hotovost), F2026-0001 (karta/převod)

## Deploy kroky
- `npx prisma db push` nebo migration na produkci (Turso)
- Verify: InvoiceCounter tabulka má nový `prefix` sloupec
