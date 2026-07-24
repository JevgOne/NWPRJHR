# TASK-071 P1: Performance paginace + cache — Implementace

**Stav:** HOTOVO
**Datum:** 2026-07-22
**TypeScript:** 0 chyb

---

## Změněné soubory

### 1. `src/app/(app)/inventory/page.tsx`

- **Smazán** `export const dynamic = "force-dynamic"` (řádek 8)
- **Přidán** import `unstable_cache` z `next/cache`
- **Přidán** `getCachedInventoryData` wrapper — zabaluje 3 DB queries (variants, allStock, latestBarcodes) do `unstable_cache` s `revalidate: 60` a `tags: ["stock", "products"]`
- **Map→Array serialization:** `allStock` (Map) se serializuje jako `Array.from(allStock.entries())` v cache wrapperu a rekonstruuje zpět jako `new Map(stockEntries)` v komponentě
- `InventoryPage` nyní volá `getCachedInventoryData()` místo přímých DB queries

### 2. `src/app/api/inquiries/route.ts`

- **Přidáno** parsování `page` a `limit` z query parametrů (`Math.max(1, ...)`, `Math.min(100, ...)`)
- **Přidáno** `prisma.inquiry.count({ where })` v `Promise.all` s `findMany`
- **Přidáno** `skip: (page - 1) * limit` a `take: limit` na `findMany`
- **Response formát změněn** z plain array na `{ data, total, page, totalPages }` — konzistentní s orders/sales API
- Promo code a variant price follow-up queries operují pouze na aktuální stránce (správné chování)

### 3. `src/app/(app)/inquiries/InquiriesClient.tsx`

- **Přidány** state: `page`, `totalPages`, `total`
- **Upravena** `fetchInquiries` — posílá `page` a `limit` params, parsuje `json.data`/`json.totalPages`/`json.total`
- **Filter reset:** při změně filtru se page resetuje na 1 (`setPage(1)`)
- **Přidána** paginace UI — `< page / totalPages >` s disabled stavy, text "Zobrazeno X z Y"

### 4. `messages/cs.json`

- Přidán `inquiry.showingOf`: `"Zobrazeno {count} z {total}"`

### 5. `messages/uk.json`

- Přidán `inquiry.showingOf`: `"Показано {count} з {total}"`

### 6. `messages/ru.json`

- Přidán `inquiry.showingOf`: `"Показано {count} из {total}"`

## Co NEBYLO změněno
- Žádné nové závislosti
- Žádná DB migrace
- `revalidateTag("stock")` už se volá v relevantních API routes (ověřeno v P0)
- Follow-up queries pro promo codes a variant prices neupraveny (operují na stránce)
