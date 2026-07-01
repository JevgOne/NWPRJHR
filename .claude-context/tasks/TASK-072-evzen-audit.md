# TASK-072 — Evžen Audit: CREATE TABLE promo_codes v Turso DB

**Datum:** 2026-07-01
**Agent:** evzen (kontrolor)
**Výsledek:** SCHVÁLENO

---

## Kontrola proti zadání

### Zadání:
> Prisma schema obsahuje model PromoCode ale tabulka promo_codes neexistuje v Turso DB. Potřeba: 1) Přečíst model PromoCode z prisma/schema.prisma, 2) Vytvořit SQL CREATE TABLE statement, 3) Spustit přes turso db shell.

### Výsledek kontroly:

| Požadavek | Splněno | Poznámka |
|-----------|---------|----------|
| Přečíst PromoCode model z schema.prisma | ANO | Model na řádcích 1495-1513, správně analyzován |
| Vytvořit SQL CREATE TABLE | ANO | Viz TASK-072-impl.md, 13 sloupců odpovídá Prisma modelu |
| Spustit v Turso DB | ANO | Potvrzeno přes PRAGMA table_info, indexy vytvořeny |
| Blokuje TASK-070 | ANO | TASK-070 je nyní odblokován |

### Detailní kontrola SQL vs Prisma model:

- `id TEXT NOT NULL PRIMARY KEY` — odpovídá `@id @default(cuid())` ✅
- `code TEXT NOT NULL UNIQUE` — odpovídá `@unique` ✅
- `discountType TEXT NOT NULL DEFAULT 'PERCENT'` — odpovídá enum PromoDiscountType ✅
- `discountValue INTEGER NOT NULL` — odpovídá Int ✅
- `minOrderValue INTEGER` nullable — odpovídá Int? ✅
- `maxUses INTEGER` nullable — odpovídá Int? ✅
- `usedCount INTEGER NOT NULL DEFAULT 0` — odpovídá @default(0) ✅
- `validFrom DATETIME` nullable — odpovídá DateTime? ✅
- `validTo DATETIME` nullable — odpovídá DateTime? ✅
- `active INTEGER NOT NULL DEFAULT 1` — odpovídá Boolean @default(true) ✅
- `createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` — odpovídá @default(now()) ✅
- `updatedAt DATETIME NOT NULL` — odpovídá @updatedAt ✅
- Indexy: code (unique + idx), active (idx) ✅

### Závěr:
Kompletní a správná implementace. Tabulka odpovídá Prisma modelu, indexy jsou na místě.
