# TASK-1: Skladové pohyby crash + culíky neviditelné

## Root Cause

**Oba problémy mají stejnou příčinu:** V Prisma schématu je na modelu `Delivery` sloupec `createdByUserId String?`, ale v produkční Turso DB tento sloupec neexistoval (chyběla migrace).

### Proč padají movements (/inventory/movements)
- `page.tsx` dělá `prisma.stockMovement.findMany({ include: { delivery: ... } })`
- Prisma při include delivery čte VŠECHNY sloupce deliveries tabulky
- Prisma klient očekává `createdByUserId` (je v generated clientu), ale DB ho nemá
- → `SQLITE_ERROR: no such column: main.deliveries.createdByUserId`

### Proč culíky neviditelné (/inventory)
- `stockIn()` v `stock-in.ts:43` vytváří delivery s `createdByUserId: userId`
- Celá transakce (delivery + stockMovement) failne na stejné chybě
- → Data se nikdy nezapsala, DB má 0 deliveries a 0 variants

## Fix

Přidán chybějící sloupec přímo do Turso DB:
```sql
ALTER TABLE deliveries ADD COLUMN createdByUserId TEXT;
CREATE INDEX deliveries_createdByUserId_idx ON deliveries(createdByUserId);
```

## Verifikace
- `npx tsc --noEmit` — OK, žádné TS chyby
- `next build` — OK, kompilace prošla
- Movements query test — OK, vrací prázdný array (žádné movements v DB)
- Deliveries query — OK, funguje bez erroru
- Stock-in by měl teď fungovat — uživatel musí znovu naskladnit culíky

## Poznámka
DB nemá žádné deliveries/variants/movements — všechno co uživatel zkoušel naskladnit se ztratilo kvůli rollbacku transakce. Po fixu je třeba znovu provést naskladnění.
