import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discountType TEXT NOT NULL,
      discountValue INTEGER NOT NULL,
      minOrderValue INTEGER,
      maxUses INTEGER,
      usedCount INTEGER NOT NULL DEFAULT 0,
      validFrom DATETIME,
      validTo DATETIME,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active)`);

  console.log("promo_codes table created!");
}

main().catch(console.error);
