# PLAN: TASK-103 — Smazani testovacich zakazniku z DB

## Kontext
V produkcni DB (Turso) jsou testovaci zakaznici, ktere je treba odstranit:
- "Test ApiTest" — jednoznacne testovaci
- "Jitka Zkouska" — prijmeni "Zkouska" = test

## Databaze
- **Produkce:** Turso (libsql) — `libsql://hairora-eu-jevgone.aws-eu-west-1.turso.io`
- **Embedded replica:** `TURSO_EMBEDDED_REPLICA=true` na Vercelu
- **Lokalni dev:** `prisma/dev.db` (SQLite)

## Customer model — FK zavislosti

Tabulka `customers` ma nasledujici relace (vsechny `customerId` jsou nullable `String?`):

| Relace | Tabulka | Sloupec | Akce pri smazani |
|--------|---------|---------|-----------------|
| sales | `sales` | `customerId` | SET NULL |
| invoices | `invoices` | `customerId` | SET NULL |
| orders | `orders` | `customerId` | SET NULL |
| inquiries | `inquiries` | `customerId` | SET NULL |
| productReservations | `product_reservations` | `customerId` | SET NULL |
| referrals | `referrals` | `referrerCustomerId` | SET NULL |

**DULEZITE:** Vsechny FK jsou nullable — nemusime mazat navazane zaznamy, staci nastavit `customerId = NULL` na navazanych zaznamech pred smazanim customera, nebo pouzit Prisma cascade logiku.

## KROK 1: Identifikace zakazniku

Spustit na produkcni DB (Turso CLI nebo Prisma script):

```sql
SELECT id, name, email, phone, createdAt
FROM customers
WHERE name LIKE '%Test%' OR name LIKE '%Zkouska%' OR name LIKE '%Zkouška%'
   OR name LIKE '%ApiTest%' OR name LIKE '%test%';
```

Ocekavane vysledky:
- "Test ApiTest" — SMAZAT
- "Jitka Zkouška" / "Jitka Zkouska" — OVERIT (pokud ma nakupy, neni testovaci?)

## KROK 2: Overeni navazanych zaznamu

Pro kazdeho kandidata overit:

```sql
-- Prodeje
SELECT COUNT(*) FROM sales WHERE customerId = '<ID>';

-- Faktury
SELECT COUNT(*) FROM invoices WHERE customerId = '<ID>';

-- Objednavky
SELECT COUNT(*) FROM orders WHERE customerId = '<ID>';

-- Poptavky
SELECT COUNT(*) FROM inquiries WHERE customerId = '<ID>';

-- Rezervace
SELECT COUNT(*) FROM product_reservations WHERE customerId = '<ID>';

-- Referraly
SELECT COUNT(*) FROM referrals WHERE referrerCustomerId = '<ID>';
```

**Rozhodovaci strom:**
- Pokud ma 0 navazanych zaznamu → mazat rovnou
- Pokud ma navazane zaznamy → SET NULL pred smazanim

## KROK 3: Smazani

### Varianta A: Prisma skript (doporuceno)

Vytvorit jednorazovy skript `scripts/delete-test-customers.ts`:

```typescript
import { prisma } from "../src/lib/db";

async function main() {
  // Najdi testovaci zakazniky
  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: "ApiTest" } },
        { name: { contains: "Test ApiTest" } },
        // Pridat "Jitka Zkouska" az po overeni
      ],
    },
    select: { id: true, name: true },
  });

  console.log("Found test customers:", testCustomers);

  for (const c of testCustomers) {
    // Odpoj navazane zaznamy (SET NULL)
    await prisma.sale.updateMany({
      where: { customerId: c.id },
      data: { customerId: null },
    });
    await prisma.invoice.updateMany({
      where: { customerId: c.id },
      data: { customerId: null },
    });
    await prisma.order.updateMany({
      where: { customerId: c.id },
      data: { customerId: null },
    });
    await prisma.inquiry.updateMany({
      where: { customerId: c.id },
      data: { customerId: null },
    });
    await prisma.productReservation.updateMany({
      where: { customerId: c.id },
      data: { customerId: null },
    });
    await prisma.referral.updateMany({
      where: { referrerCustomerId: c.id },
      data: { referrerCustomerId: null },
    });

    // Smaz customera
    await prisma.customer.delete({ where: { id: c.id } });
    console.log(`Deleted: ${c.name} (${c.id})`);
  }
}

main().catch(console.error).finally(() => process.exit());
```

### Varianta B: Primo SQL na Turso (rychlejsi, ale riskantnejsi)

```sql
-- 1. Najdi ID
SELECT id, name FROM customers WHERE name = 'Test ApiTest';

-- 2. Odpoj navazane zaznamy
UPDATE sales SET customerId = NULL WHERE customerId = '<ID>';
UPDATE invoices SET customerId = NULL WHERE customerId = '<ID>';
UPDATE orders SET customerId = NULL WHERE customerId = '<ID>';
UPDATE inquiries SET customerId = NULL WHERE customerId = '<ID>';
UPDATE product_reservations SET customerId = NULL WHERE customerId = '<ID>';
UPDATE referrals SET referrerCustomerId = NULL WHERE referrerCustomerId = '<ID>';

-- 3. Smaz
DELETE FROM customers WHERE id = '<ID>';
```

### Varianta C: Pridat DELETE endpoint do API (nejbezpecnejsi)

Pridat `DELETE` handler do `src/app/api/customers/[id]/route.ts` — momentalne neexistuje. Toto by bylo vhodne pro budouci pouziti, ale pro jednorazovou akci je overkill.

## DOPORUCENI

1. **Pouzit Variantu A** (Prisma skript) — bezpecnejsi nez primo SQL, validace Prismou
2. **"Test ApiTest"** — smazat bez pochyb
3. **"Jitka Zkouska"** — NEJDRIVE overit s uzivatelem jestli je to skutecne test. Pokud ma realne nakupy, ponechat
4. **Nezapomenout:** Po smazani overit dashboard — mohl by ukazovat phantom data (viz TASK-027 cache)

## PORADI

1. Spustit identifikacni SQL (krok 1)
2. Overit navazane zaznamy (krok 2)
3. Zeptat se uzivatele ohledne "Jitka Zkouska"
4. Spustit smazani (krok 3, varianta A)
5. Overit ze zakaznik zmizel z admin panelu

## RIZIKA

- **Nizke** — FK jsou nullable, smazani je bezpecne
- Jedine riziko: smazat realneho zakaznika omylem (proto overeni "Jitka Zkouska")
- Cache: po smazani muze dashboard ukazovat stare data (revalidate: 10s)
