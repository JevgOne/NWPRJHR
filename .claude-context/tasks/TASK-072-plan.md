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

## Kroky implementace

1. **Spustit SQL v Turso DB** — buď přes `turso db shell <db-name>` nebo přes Turso Dashboard
2. **Ověřit** — zkontrolovat že tabulka existuje: `SELECT name FROM sqlite_master WHERE type='table' AND name='promo_codes';`
3. **Test** — otevřít `/promo-codes` v admin panelu a zkusit vytvořit testovací kód

## Poznámky

- Turso nepodporuje `prisma db push` ani `prisma migrate` — nutná manuální SQL migrace
- UNIQUE constraint na `code` je klíčový — validace v API (`route.ts:31`) na něm závisí
- `discountType` přijímá hodnoty `PERCENT` nebo `FIXED` (text)
- Tabulka BLOKUJE TASK-070 (integrace slevového kódu do objednávek/poptávek)
