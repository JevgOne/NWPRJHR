/**
 * Comprehensive production migration script.
 * Adds all missing tables and columns to Turso DB.
 * Safe to run multiple times (uses IF NOT EXISTS / catches duplicates).
 *
 * Usage: npx tsx scripts/migrate-all-production.ts
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load production env
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
    if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
      console.log(`  · ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}: ${e.message}`);
    }
  }
}

async function main() {
  console.log("=== Hairland Production Migration ===\n");
  console.log(`DB: ${process.env.TURSO_DATABASE_URL}\n`);

  // 1. User.color
  console.log("1. User color field:");
  await safeExec(`ALTER TABLE users ADD COLUMN color TEXT`, "users.color");

  // 2. Customer firstName/lastName/city
  console.log("\n2. Customer fields:");
  await safeExec(`ALTER TABLE customers ADD COLUMN firstName TEXT`, "customers.firstName");
  await safeExec(`ALTER TABLE customers ADD COLUMN lastName TEXT`, "customers.lastName");
  await safeExec(`ALTER TABLE customers ADD COLUMN city TEXT`, "customers.city");

  // 3. Inquiry firstName/lastName/city/customerId
  console.log("\n3. Inquiry fields:");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN firstName TEXT`, "inquiries.firstName");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN lastName TEXT`, "inquiries.lastName");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN city TEXT`, "inquiries.city");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN customerId TEXT REFERENCES customers(id)`, "inquiries.customerId");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_inquiries_customerId ON inquiries(customerId)`, "inquiries.customerId index");

  // 4. Inquiry promoCode/promoDiscount/estimatedTotal
  console.log("\n4. Inquiry promo fields:");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN promoCode TEXT`, "inquiries.promoCode");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN promoDiscount TEXT`, "inquiries.promoDiscount");
  await safeExec(`ALTER TABLE inquiries ADD COLUMN estimatedTotal INTEGER NOT NULL DEFAULT 0`, "inquiries.estimatedTotal");

  // 5. Inquiry items pricePerGram/itemTotal
  console.log("\n5. Inquiry item price fields:");
  await safeExec(`ALTER TABLE inquiry_items ADD COLUMN pricePerGram INTEGER NOT NULL DEFAULT 0`, "inquiry_items.pricePerGram");
  await safeExec(`ALTER TABLE inquiry_items ADD COLUMN itemTotal INTEGER NOT NULL DEFAULT 0`, "inquiry_items.itemTotal");

  // 6. StockBatch table
  console.log("\n6. Stock batches table:");
  await safeExec(`
    CREATE TABLE IF NOT EXISTS stock_batches (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      note TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closedAt DATETIME,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `, "stock_batches table");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_stock_batches_status ON stock_batches(status)`, "stock_batches.status index");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_stock_batches_createdAt ON stock_batches(createdAt)`, "stock_batches.createdAt index");

  // 7. Delivery.batchId
  console.log("\n7. Delivery batch field:");
  await safeExec(`ALTER TABLE deliveries ADD COLUMN batchId TEXT REFERENCES stock_batches(id)`, "deliveries.batchId");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_deliveries_batchId ON deliveries(batchId)`, "deliveries.batchId index");

  // 8. Promo codes table
  console.log("\n8. Promo codes table:");
  await safeExec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY NOT NULL,
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
  `, "promo_codes table");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`, "promo_codes.code index");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active)`, "promo_codes.active index");

  // 9. Sale composite index
  console.log("\n9. Sale index:");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_sales_status_completedAt ON sales(status, completedAt)`, "sales [status,completedAt] index");

  // 10. Set user colors
  console.log("\n10. User colors:");
  const colors: [string, string][] = [
    ["inga@hairland.cz", "#e91e8a"],
    ["jevgenij@hairland.cz", "#dc2626"],
    ["martin@hairland.cz", "#2563eb"],
  ];
  for (const [email, color] of colors) {
    const result = await client.execute({
      sql: `UPDATE users SET color = ? WHERE email = ?`,
      args: [color, email],
    });
    console.log(`  ${result.rowsAffected > 0 ? "✓" : "·"} ${email} → ${color} (${result.rowsAffected} rows)`);
  }

  console.log("\n=== Migration complete! ===");
}

main().catch(console.error);
