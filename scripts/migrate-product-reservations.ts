/**
 * Create product_reservations table in Turso.
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * Usage: npx tsx scripts/migrate-product-reservations.ts
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.production.local
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.production.local") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!.replace(/\\n/g, ""),
});

async function safeExec(sql: string, label: string) {
  try {
    await client.execute(sql);
    console.log(`  ✓ ${label}`);
  } catch (e: any) {
    if (
      e.message?.includes("already exists")
    ) {
      console.log(`  · ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}: ${e.message}`);
      throw e;
    }
  }
}

async function main() {
  console.log("Creating product_reservations table...\n");

  await safeExec(
    `CREATE TABLE IF NOT EXISTS product_reservations (
  id TEXT PRIMARY KEY,
  reservationNumber TEXT UNIQUE,
  customerType TEXT NOT NULL,
  salonId TEXT REFERENCES salons(id),
  customerId TEXT REFERENCES customers(id),
  contactName TEXT,
  contactEmail TEXT,
  contactPhone TEXT,
  variantId TEXT NOT NULL REFERENCES variants(id),
  grams INTEGER NOT NULL,
  pieces INTEGER NOT NULL,
  pricePerUnit INTEGER NOT NULL,
  lineTotal INTEGER NOT NULL,
  sellingMode TEXT NOT NULL DEFAULT 'BY_GRAM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  paymentDueDate DATETIME NOT NULL,
  paidAt DATETIME,
  paymentNote TEXT,
  saleId TEXT UNIQUE,
  invoiceId TEXT UNIQUE,
  note TEXT,
  internalNote TEXT,
  createdByUserId TEXT NOT NULL REFERENCES users(id),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
    "product_reservations table"
  );

  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_status ON product_reservations(status)`,
    "index: status"
  );
  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_salonId ON product_reservations(salonId)`,
    "index: salonId"
  );
  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_customerId ON product_reservations(customerId)`,
    "index: customerId"
  );
  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_variantId ON product_reservations(variantId)`,
    "index: variantId"
  );
  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_paymentDueDate ON product_reservations(paymentDueDate)`,
    "index: paymentDueDate"
  );
  await safeExec(
    `CREATE INDEX IF NOT EXISTS idx_product_reservations_createdAt ON product_reservations(createdAt)`,
    "index: createdAt"
  );

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
