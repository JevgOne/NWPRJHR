# TASK-072: CREATE TABLE promo_codes v Turso DB

## Cíl
Vytvořit tabulku `promo_codes` v Turso DB, která odpovídá Prisma modelu `PromoCode` ze `schema.prisma:1495-1513`. Tabulka neexistuje v produkční DB, takže admin stránka `/promo-codes` a API endpointy `/api/promo-codes/*` nefungují.

## Analýza Prisma modelu

```prisma
model PromoCode {
  id            String    @id @default(cuid())
  code          String    @unique
  description   String?
  discountType  PromoDiscountType          // enum: PERCENT | FIXED → TEXT v SQLite
  discountValue Int                        // basis points (3000 = 30%) nebo halere pro FIXED
  minOrderValue Int?                       // minimum order amount v halere
  maxUses       Int?                       // null = unlimited
  usedCount     Int       @default(0)
  validFrom     DateTime?
  validTo       DateTime?
  active        Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([code])
  @@index([active])
  @@map("promo_codes")
}
```

## SQL migrace

Turso používá SQLite syntax. Enums jsou uloženy jako TEXT, Boolean jako INTEGER (0/1), DateTime jako TEXT (ISO 8601).

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minOrderValue" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Indexy

```sql
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");
CREATE INDEX "promo_codes_active_idx" ON "promo_codes"("active");
```

## Existující migrační skript

Soubor `scripts/create-promo-codes-table.ts` už existuje a je připravený ke spuštění:
- Používá `@libsql/client` + dotenv pro připojení přes `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
- Vytváří tabulku `promo_codes` s `CREATE TABLE IF NOT EXISTS` (bezpečné pro opakované spuštění)
- Vytváří indexy `idx_promo_codes_code` a `idx_promo_codes_active`

**POZOR:** Skript nevytváří UNIQUE index na `code` — vytváří jen běžný index. UNIQUE constraint ale chybí i v CREATE TABLE (nemá `UNIQUE` u `code TEXT NOT NULL`). **Je třeba přidat `UNIQUE` na sloupec `code`** — Prisma model to vyžaduje (`@unique`) a API na to spoléhá.

## Kroky implementace

### Varianta A: Spustit existující skript (doporučeno)
1. **Opravit skript** `scripts/create-promo-codes-table.ts`:
   - Změnit `code TEXT NOT NULL` na `code TEXT NOT NULL UNIQUE`
   - Nebo přidat `CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_key ON promo_codes(code)` 
2. **Spustit:** `npx tsx scripts/create-promo-codes-table.ts`
3. **Ověřit:** Spustit `npx tsx -e "...SELECT name FROM sqlite_master..."` nebo přes Turso Dashboard

### Varianta B: Přímý SQL přes Turso CLI
1. Spustit CREATE TABLE + indexy z SQL migrace výše přes `turso db shell <db-name>`

### Verifikace
- `SELECT name FROM sqlite_master WHERE type='table' AND name='promo_codes';` → musí vrátit řádek
- `PRAGMA table_info(promo_codes);` → ověřit všechny sloupce
- Otevřít `/promo-codes` v admin panelu → stránka se musí načíst bez chyby
- Zkusit vytvořit testovací promo kód → musí se uložit

## Poznámky

- Turso nepodporuje `prisma db push` ani `prisma migrate` — nutná manuální SQL migrace
- UNIQUE constraint na `code` je KRITICKÝ — validace v API (`src/app/api/promo-codes/route.ts:31`) na něm závisí
- `discountType` přijímá hodnoty `PERCENT` nebo `FIXED` (text)
- Tabulka BLOKUJE TASK-070 (integrace slevového kódu do objednávek/poptávek)
- Script pattern viz `scripts/create-inquiry-tables.ts` pro referenci
