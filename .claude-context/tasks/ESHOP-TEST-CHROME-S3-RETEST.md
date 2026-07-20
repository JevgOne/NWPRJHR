# Browser Test: Sprint 3 Re-test po rate limit fixu (Task #14)

**Datum:** 2026-07-20
**Tester:** test-chrome
**Commit testován:** 503949a (rate limit 20/h)
**Výsledek: BLOKOVÁNO — Schema migrace chybí**

---

## Výsledky scénářů

| # | Scénář | Status | Detail |
|---|--------|--------|--------|
| S1 | Add to cart | PASS | Přidáno do košíku |
| S3 | Summary (krok 4) | PASS | Celkem + Objednat visible |
| S4 | Submit objednávky | **FAIL** | HTTP 500 WalConflict — schema chybí |
| S5 | Admin login | PASS | testchrome@hairland.cz → /dashboard |
| S6 | Admin /orders | WARN | Stránka načtena, ale žádné objednávky (API 500) |
| S7-S9 | Order detail + Mark Paid + Ship | SKIP | Žádná objednávka nevznikla |
| S10 | Status check (IN_TRANSIT) | PASS | IN_TRANSIT v UI nenalezen |

**Celkem: 4 PASS / 1 FAIL / 1 WARN / 3 SKIP**

---

## Kritické chyby v server logu

### CHYBA 1: `POST /api/public/orders` — HTTP 500 WalConflict

```
ERROR libsql::sync: insert error (frame=48) : WalConflict
Error [DriverAdapterError]: WalConflict
  at async POST (src/app/api/public/orders/route.ts:141:22)
POST /api/public/orders 500 in 2.6s
```

UI zobrazí: **"Chyba při odesílání objednávky. Zkuste to prosím znovu."**

### CHYBA 2: `GET /api/orders` — HTTP 500 Schema mismatch

```
Error [DriverAdapterError]: SQLITE_ERROR: no such column: main.orders.customerId
  at async GET (src/app/api/orders/route.ts:35:27)
GET /api/orders?page=1&limit=20 500 in 105ms
```

---

## Příčina: prisma db push neproběhlo

Remote Turso DB (`libsql://hairora-eu-jevgone.aws-eu-west-1.turso.io`) má **STAROU schéma** bez Sprint 3 sloupců:

**Skutečná schéma v Turso:**
```sql
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT,
    "salonId" TEXT NOT NULL,  ← musí být nullable
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "estimatedTotal" INTEGER NOT NULL,
    ...pouze staré sloupce...
)
```

**Chybí tyto sloupce:**
- `customerId TEXT` (nullable)
- `contactEmail TEXT`
- `contactPhone TEXT`
- `contactName TEXT`
- `shippingMethod TEXT`
- `shippingCost INTEGER`
- `paymentMethod TEXT`
- `totalAmount INTEGER`
- `packetaPointId TEXT`
- `packetaPointName TEXT`
- `packetaPointCity TEXT`
- `comgateTransId TEXT`
- `paidAt DATETIME`
- `locale TEXT`
- `cancelledAt DATETIME`
- `cancelReason TEXT`

**Navíc** `salonId TEXT NOT NULL` musí být `salonId TEXT` (nullable pro retail objednávky).

---

## Potřebná akce

**Implementátor musí spustit `prisma db push` na remote Turso:**

```bash
cd /Users/zen/NWPRJHR
npx prisma db push
```

Toto aplikuje `prisma/schema.prisma` na remote Turso DB.

Po migraci restartovat dev server a test znovu spustit:
```bash
node /Users/zen/NWPRJHR/.claude-context/test-sprint3-final.js
```

---

## Rate limit fix — OVĚŘENO

Rate limit fix (commit 503949a, RATE_LIMIT_MAX=20) byl v kódu potvrzen. Server byl restartován — in-memory Map je čistá. Test nenarazil na 429.

Rate limit NENÍ příčinou selhání — příčina je výhradně chybějící schema v Turso.

---

## Screenshoty

- `/Users/zen/NWPRJHR/.claude-context/screenshots/s3-summary.png` — checkout krok 4 Summary
- `/Users/zen/NWPRJHR/.claude-context/screenshots/s4-thankyou.png` — chybová zpráva po submit
- `/Users/zen/NWPRJHR/.claude-context/screenshots/s5-login.png` — admin login OK
- `/Users/zen/NWPRJHR/.claude-context/screenshots/s6-admin-orders.png` — admin orders prázdné
