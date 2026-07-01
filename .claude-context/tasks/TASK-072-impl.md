# TASK-072: CREATE TABLE promo_codes v Turso DB — Implementation

## What was done

Created `promo_codes` table in Turso production database (`hairora-eu`) matching the Prisma `PromoCode` model.

## SQL Executed

```sql
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discountType TEXT NOT NULL DEFAULT 'PERCENT',
  discountValue INTEGER NOT NULL,
  minOrderValue INTEGER,
  maxUses INTEGER,
  usedCount INTEGER NOT NULL DEFAULT 0,
  validFrom DATETIME,
  validTo DATETIME,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(active);
```

## Verification

- Table structure confirmed via `PRAGMA table_info(promo_codes)` — all 13 columns correct
- Indexes confirmed: `idx_promo_codes_code`, `idx_promo_codes_active`, plus 2 auto-indexes (PK + UNIQUE)
- Prisma client regenerated successfully (`npx prisma generate`)
- TASK-070 is now unblocked

## Column mapping (Prisma → SQLite)

| Prisma Field    | SQLite Column   | Type      | Constraints            |
|-----------------|-----------------|-----------|------------------------|
| id              | id              | TEXT      | PK, NOT NULL           |
| code            | code            | TEXT      | NOT NULL, UNIQUE       |
| description     | description     | TEXT      | nullable               |
| discountType    | discountType    | TEXT      | NOT NULL, default 'PERCENT' |
| discountValue   | discountValue   | INTEGER   | NOT NULL               |
| minOrderValue   | minOrderValue   | INTEGER   | nullable               |
| maxUses         | maxUses         | INTEGER   | nullable               |
| usedCount       | usedCount       | INTEGER   | NOT NULL, default 0    |
| validFrom       | validFrom       | DATETIME  | nullable               |
| validTo         | validTo         | DATETIME  | nullable               |
| active          | active          | INTEGER   | NOT NULL, default 1    |
| createdAt       | createdAt       | DATETIME  | NOT NULL, default NOW  |
| updatedAt       | updatedAt       | DATETIME  | NOT NULL               |
