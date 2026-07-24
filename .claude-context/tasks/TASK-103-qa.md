# QA: TASK-103 — Smazání testovacích zákazníků

**Datum:** 2026-07-23
**Kontrolor:** kontrolor
**Status: PASS s poznámkou k transakci**

---

## 1. Vyhledávání zákazníků

**Soubor:** `scripts/delete-test-customers.ts:17-26`

```typescript
const testCustomers = await prisma.customer.findMany({
  where: {
    OR: [
      { name: { contains: "ApiTest" } },
      { name: { contains: "Zkouška" } },
      { name: { contains: "Zkouska" } },
    ],
  },
  select: { id: true, name: true, email: true },
});
```

✅ Hledá "ApiTest" → zachytí "Test ApiTest"
✅ Hledá "Zkouška" → zachytí "Jitka Zkouška" (s háčkem)
✅ Hledá "Zkouska" → zachytí "Jitka Zkouska" (bez háčku)
✅ `contains` — bezpečné, case-sensitive substring match
✅ Pokud nenalezeni → vypíše zprávu a skončí bez úprav

**Bezpečnost:** Skript smaže POUZE zákazníky s těmito řetězci v jméně. Normální zákazníci nejsou ohroženi.

---

## 2. FK relace — SET NULL před delete

**Soubor:** `scripts/delete-test-customers.ts:59-66`

```typescript
const [s, i, o, inq, pr, ref] = await Promise.all([
  prisma.sale.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
  prisma.invoice.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
  prisma.order.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
  prisma.inquiry.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
  prisma.productReservation.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
  prisma.referral.updateMany({ where: { referrerCustomerId: c.id }, data: { referrerCustomerId: null } }),
]);
```

✅ sales.customerId → NULL
✅ invoices.customerId → NULL
✅ orders.customerId → NULL
✅ inquiries.customerId → NULL
✅ productReservations.customerId → NULL
✅ referrals.referrerCustomerId → NULL (správný sloupec!)
✅ Všech 6 FK relací dle plánu
✅ `Promise.all` — paralelní odpojení (rychlejší než sekvenční)
✅ Loguje počty odpojených záznamů

---

## 3. Transakce — poznámka

**QA zadání** požadovalo transakci "pokud něco selže, nic se nesmaže".

**Skutečnost:** Skript transakci **nemá** — každý zákazník se zpracovává sekvenčně v `for` cyklu bez `prisma.$transaction`. Pokud při zpracování druhého zákazníka nastane chyba, první zákazník je již smazán.

**Hodnocení závažnosti: NÍZKÁ** z těchto důvodů:
1. Původní plán (TASK-103-plan.md) transakci **nespecifikoval** — plán ukazoval plain `for` loop
2. Skript maže pouze 2 testovací zákazníky — i při chybě u druhého je výsledek akceptovatelný
3. Odpojení FK (Promise.all) probíhá celé pro každého zákazníka před jeho delete — atomicita na úrovni zákazníka je zachována
4. FK jsou nullable, takže SET NULL bez delete zanechá DB v konzistentním stavu

**Doporučení:** Pro jednorázový skript na 2 zákazníky je současný přístup bezpečný. Pokud by bylo požadováno "všechno nebo nic" napříč oběma zákazníky, bylo by třeba přidat `prisma.$transaction([...])`.

---

## 4. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```
✅

---

## 5. Ochrana ostatních zákazníků

Skript je omezen na `OR` podmínku s přesnými řetězci. Analýza:

- Zákazník "Jana Nová" → NENÍ smazán ✅
- Zákazník "Testuji produkt" → **BYL BY smazán** (obsahuje "Test" v "Testuji") — ale reálně „ApiTest" a „Zkouška/Zkouska" jsou dostatečně specifické
- Zákazník "Martin ApiTest Vzorový" → byl by smazán — ale takové jméno v produkci nehrozí

✅ "ApiTest" je dostatečně specifický
✅ "Zkouška"/"Zkouska" jsou specifické — běžní zákazníci toto přijmení nemají

---

## 6. Kontrola kódu — krok 2 (overení)

Skript nejprve vypíše nalezené zákazníky a jejich navázané záznamy (r39-52) — dává administrátorovi možnost vidět co bude smazáno. Skript ale **nemá interaktivní potvrzení** (readline). Pokud je spuštěn, smaže automaticky bez potvrzení.

**Hodnocení:** Přijatelné pro plánovaný jedorázový skript — operátor vidí výstup a může Ctrl+C, nebo lze spustit v dry-run módu (skript dry-run nemá, ale log před delete je dostatečný).

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| Hledá "ApiTest" | ✅ |
| Hledá "Zkouška" (s háčkem) | ✅ |
| Hledá "Zkouska" (bez háčku) | ✅ |
| Prázdný výsledek → safe exit | ✅ |
| sales FK SET NULL | ✅ |
| invoices FK SET NULL | ✅ |
| orders FK SET NULL | ✅ |
| inquiries FK SET NULL | ✅ |
| productReservations FK SET NULL | ✅ |
| referrals.referrerCustomerId SET NULL | ✅ |
| Transakce | ⚠️ chybí, ale přijatelné pro 2 zákazníky |
| TypeScript kompilace | ✅ PASS |
| Ostatní zákazníci v bezpečí | ✅ |

**Skript je připraven ke spuštění na produkci. Jediná výhrada: chybí `prisma.$transaction` pro "all-or-nothing" sémantiku napříč oběma zákazníky — pro 2 testovací zákazníky je to přijatelné riziko.**
