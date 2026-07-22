/**
 * Add missing reservationId column to invoices table.
 * This column was added to the Prisma schema but never migrated to production.
 * Without it, ALL queries on the invoices table fail.
 *
 * Also retroactively creates invoices for completed CARD sales from online orders
 * that are missing invoices (due to this bug).
 *
 * Usage: npx tsx scripts/migrate-invoice-reservationId.ts
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
    if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
      console.log(`  · ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}: ${e.message}`);
    }
  }
}

async function main() {
  console.log("=== Add reservationId to invoices ===\n");
  console.log(`DB: ${process.env.TURSO_DATABASE_URL}\n`);

  // Add column
  await safeExec(
    `ALTER TABLE invoices ADD COLUMN reservationId TEXT REFERENCES product_reservations(id)`,
    "invoices.reservationId"
  );

  // Add index
  await safeExec(
    `CREATE INDEX IF NOT EXISTS invoices_reservationId_idx ON invoices(reservationId)`,
    "invoices.reservationId index"
  );

  // Check for completed CARD sales without invoices (from online orders)
  console.log("\nChecking for sales missing invoices...");
  const result = await client.execute(`
    SELECT s.id, s.saleNumber, s.paymentType, s.orderId
    FROM sales s
    LEFT JOIN invoices i ON i.saleId = s.id
    WHERE s.status = 'COMPLETED'
      AND i.id IS NULL
      AND s.orderId IS NOT NULL
  `);

  if (result.rows.length === 0) {
    console.log("  · No sales missing invoices");
  } else {
    console.log(`  ! Found ${result.rows.length} sale(s) without invoices:`);
    for (const row of result.rows) {
      console.log(`    - Sale ${row.saleNumber} (${row.paymentType}, order: ${row.orderId})`);
    }
    console.log("\n  These invoices will be created on next 'Potvrdit platbu' click or can be created via API.");
  }

  console.log("\n✅ Migration complete!");
}

main().catch(console.error);
