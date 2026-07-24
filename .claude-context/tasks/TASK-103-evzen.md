# EVŽEN VERDIKT: TASK-103 — Smazání testovacích zákazníků

**Datum:** 2026-07-23
**Verdikt:** SCHVÁLENO

---

## Shoda se zadáním

**Zadání:** Smazat "Test ApiTest" i "Jitka Zkouška" z produkční DB.

**Ověření:**

| Požadavek | Splněno |
|-----------|---------|
| Hledá "ApiTest" | ANO — `{ name: { contains: "ApiTest" } }` (r20) |
| Hledá "Zkouška" s háčkem | ANO — `{ name: { contains: "Zkouška" } }` (r21) |
| Hledá "Zkouska" bez háčku | ANO — `{ name: { contains: "Zkouska" } }` (r22) |
| Prázdný výsledek → safe exit | ANO — r28-31 vrátí zprávu a skončí |
| SET NULL na sales.customerId | ANO — r60 |
| SET NULL na invoices.customerId | ANO — r61 |
| SET NULL na orders.customerId | ANO — r62 |
| SET NULL na inquiries.customerId | ANO — r63 |
| SET NULL na productReservations.customerId | ANO — r64 |
| SET NULL na referrals.referrerCustomerId | ANO — r65 (správný sloupec!) |
| Delete customera po odpojení FK | ANO — r71 |
| TypeScript kompilace | ANO — PASS dle QA |

## Bezpečnost

- Skript smaže POUZE zákazníky s "ApiTest", "Zkouška" nebo "Zkouska" v jméně
- Normální zákazníci nejsou ohroženi — řetězce jsou dostatečně specifické
- Před smazáním vypíše nalezené zákazníky s ID a emailem (r33-36)
- Před smazáním zobrazí počty navázaných záznamů (r39-52)

## Poznámka z QA

Chybí `prisma.$transaction` pro atomicitu napříč zákazníky. QA hodnotí jako přijatelné pro 2 testovací zákazníky — souhlasím. Plán (TASK-103-plan.md) transakci nespecifikoval.

## Závěr

Skript `scripts/delete-test-customers.ts` přesně odpovídá zadání i plánu. Všech 6 FK relací je správně odpojeno před delete. Kód je čitelný, loguje každý krok, a bezpečně zachází s prázdným výsledkem.

**SCHVÁLENO ke spuštění na produkci.**
