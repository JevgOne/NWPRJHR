# PLAN: TASK-027 — Dashboard cache phantom data

## Kontext

Dashboard ukazuje neexistující pohyby (stock movements, možná i rezervace). Data jsou cachovány přes `unstable_cache` s `revalidate: 30` a `tags: ["dashboard"]`.

---

## Analyza — příčiny phantom dat

### Architektura cache — DVE VRSTVY

```
Request → unstable_cache (30s TTL, tags: ["dashboard"])
            → Prisma → PrismaLibSql adapter
                → Turso Embedded Replica (syncInterval: 60s, readYourWrites: true)
                    → Remote Turso DB (master)
```

**Obe vrstvy mohou servovat stale data:**
1. **Next.js `unstable_cache`** — 30s TTL, invalidated přes `revalidateTag("dashboard")`
2. **Turso embedded replica** — 60s sync interval, local SQLite file na `/tmp/turso-replica.db`

---

## NALEZENE PROBLEMY

### PROBLEM 1: Turso replica sync delay — az 60s stale data (CRITICAL)

**Soubor:** `src/lib/db.ts:19-25`

```typescript
const adapter = new PrismaLibSql({
  url: "file:/tmp/turso-replica.db",
  syncInterval: 60,        // ← data mohou byt az 60s stara
  readYourWrites: true,     // ← nepomuze mezi ruznymi requesty
});
```

**Scenar phantom dat:**
1. Admin smaze delivery → stock movements se smazou z REMOTE DB
2. `revalidateTag("dashboard")` se zavola → Next.js cache se invaliduje
3. Dashboard se reloadne → Prisma cte z LOCAL REPLIKY ktera se NESYNCHRONIZOVALA
4. Local replica vraci SMAZANE stock movements
5. Next.js CACHNE tyto stale data na dalsich 30s
6. **Vysledek: phantom data az ~90 sekund (60s replica + 30s cache)**

**Proc `readYourWrites: true` nepomuze:** Garantuje konzistenci jen ve STEJNEM request/connection. Dashboard cteni je v JINEM requestu nez zapis.

**FIX:**

```typescript
// src/lib/db.ts — snizit syncInterval
syncInterval: 10,  // z 60 na 10 sekund
```

Snizi phantom window z ~90s na ~40s. Pro uplnou eliminaci by bylo treba manualni sync po zapisu, ale to vyzaduje overeni API `@prisma/adapter-libsql`.

**Obtiznost:** Trivialni — 1 cislo

---

### PROBLEM 2: Chybejici revalidateTag v 3 API routes (CRITICAL)

Tyto API routes meni data zobrazena na dashboardu ale NEVOLAJI `revalidateTag("dashboard")`:

#### 2a: Returns — `src/app/api/returns/[id]/route.ts`

Zmena statusu returnu (APPROVED → stock movement se vytvori, COMPLETED → stock se vrati) ovlivnuje:
- `recentMovements` widget na dashboardu
- `pendingReturns` badge

**Chybi:** `revalidateTag("dashboard")` po zmene statusu + `revalidateTag("badges")` pro badge.

#### 2b: Reservations — `src/app/api/reservations/[id]/route.ts`

Zmena statusu rezervace (cancel, complete) ovlivnuje:
- `activeReservations` tabulka na dashboardu
- `pendingReservationsCount` badge

**Chybi:** `revalidateTag("dashboard")` po zmene statusu.

#### 2c: Cron expire-reservations — `src/app/api/cron/expire-reservations/route.ts`

Expirace rezervaci a objednavek ovlivnuje:
- `activeReservations` widget
- `pendingReservationsCount`
- `newOrders` count (pokud se ruší AWAITING_PAYMENT objednávky)

**Chybi:** `revalidateTag("dashboard")` po expiraci.

**FIX pro vsechny 3:**

```typescript
import { revalidateTag } from "next/cache";

// Na konci kazdeho mutacniho handleru:
revalidateTag("dashboard", "max");
```

**Obtiznost:** Jednoducha — 3 soubory, 1 radek v kazdem

---

### PROBLEM 3: Stock cache nekoreluje s dashboard cache (LOW)

**Soubor:** `src/lib/stock.ts:159-161`

```typescript
// stock cache:
{ revalidate: 60, tags: ["stock"] }

// dashboard cache:
{ revalidate: 30, tags: ["dashboard"] }
```

Dashboard pouziva `stockByCategory` a `lowStockVariants` z raw SQL (NE pres `getAllStockNumbers`). Takze stock cache neovlivnuje dashboard primo. Ale pokud by se v budoucnu dashboard prepsal na pouziti `getAllStockNumbers`, mohly by vzniknout phantom data kvuli ruznym TTL.

**FIX:** Zatim neni treba — jen informativni poznamka.

---

## SHRNUTY — PRIORITIZOVANE OPRAVY

| # | Problem | Dopad | Obtiznost | Priorita |
|---|---------|-------|-----------|----------|
| 1 | Turso syncInterval 60→10 | Snizi phantom window z 90s na 40s | Trivialni | P0 |
| 2a | Returns chybi revalidateTag("dashboard") | Phantom pohyby po vratkach | Jednoducha | P0 |
| 2b | Reservations chybi revalidateTag("dashboard") | Phantom rezervace | Jednoducha | P0 |
| 2c | Cron expire chybi revalidateTag("dashboard") | Phantom po expiraci | Jednoducha | P0 |

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena |
|---|--------|-------|
| 1 | `src/lib/db.ts:23` | `syncInterval: 60` → `syncInterval: 10` |
| 2 | `src/app/api/returns/[id]/route.ts` | Pridat `revalidateTag("dashboard", "max")` po zmene statusu |
| 3 | `src/app/api/reservations/[id]/route.ts` | Pridat `revalidateTag("dashboard", "max")` po zmene statusu |
| 4 | `src/app/api/cron/expire-reservations/route.ts` | Pridat `revalidateTag("dashboard", "max")` na konec |

### Overit pred implementaci:
- `returns/[id]/route.ts` — najit kde se meni status a kde se vytvari stock movement
- `reservations/[id]/route.ts` — najit kde se meni status (cancel, complete)
- Overit ze `revalidateTag` je importovan v techto souborech

---

## PORADI IMPLEMENTACE

1. **db.ts** — snizit syncInterval (1 cislo)
2. **returns/[id]/route.ts** — pridat import + revalidateTag
3. **reservations/[id]/route.ts** — pridat import + revalidateTag
4. **cron/expire-reservations/route.ts** — pridat import + revalidateTag

**Celkem: 4 soubory, ~6 radku zmeny**

---

## VERIFIKACE

1. Smazat delivery → overit ze "posledni pohyby" na dashboardu se aktualizuji do 15 sekund
2. Zmenit status returnu → overit ze dashboard se aktualizuje
3. Zrusit rezervaci → overit ze zmizi z "aktivni rezervace" widgetu
4. Pockovat na expiraci → overit ze dashboard reflektuje zmenu

---

## RIZIKA

- **Nizke:** `syncInterval: 10` zvysi pocet Turso sync volani 6× — ale Turso sync je efektivni (differential), nema vliv na performance
- **Nizke:** Pridani `revalidateTag` je neblokujici a bezpecne
- **Stredni:** Nelze uplne eliminovat phantom data — Turso replica bude VZDY mit nejakou latenci (i s `syncInterval: 10`). Pro 100% real-time by bylo treba cist primo z remote DB, coz by zpomalilo dashboard
- **DOPORUCENI:** Akceptovat ~10-15s "phantom window" jako kompromis mezi performance a freshness
