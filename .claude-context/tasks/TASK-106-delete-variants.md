# TASK-106: Mazání variant — "Unknown error"

**Priorita:** P0
**Stav:** čeká

## Popis problému
V Skladu při pokusu o smazání varianty se zobrazí "Smazání se nezdařilo: Unknown error".

## Analýza
- Purge endpoint: `src/app/api/variants/[id]/purge/route.ts`
- Cascade delete v transakci: stockMovement → reservation → productReservation → stockSubscription → saleItem → orderItem → delivery (returns+complaints) → variant → product
- Možné příčiny: FK constraint, chybějící tabulka, transaction timeout
- Endpoint vrací generic "Unknown error" z catch bloku — přidat lepší error logging

## Plán opravy
1. Přidat detailní error logging do catch bloku
2. Ověřit FK constraints v Prisma schema vs Turso DB
3. Otestovat cascade delete pořadí
4. Ošetřit edge cases (variant s aktivními rezervacemi, prodeje atd.)
