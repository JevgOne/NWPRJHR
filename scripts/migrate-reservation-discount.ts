/**
 * Add discount columns to product_reservations table in Turso.
 * Safe to run multiple times (uses try/catch for "duplicate column").
 *
 * Usage: npx tsx scripts/migrate-reservation-discount.ts
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

async function addColumn(column: string, type: string) {
  try {
    await client.execute(
      `ALTER TABLE product_reservations ADD COLUMN ${column} ${type}`
    );
    console.log(`  ✓ added ${column}`);
  } catch (e: any) {
    if (e.message?.includes("duplicate column")) {
      console.log(`  · ${column} (already exists)`);
    } else {
      console.error(`  ✗ ${column}: ${e.message}`);
      throw e;
    }
  }
}

async function main() {
  console.log("Adding discount columns to product_reservations...\n");

  await addColumn("discountPercent", "INTEGER");
  await addColumn("discountAmount", "INTEGER");
  await addColumn("discountType", "TEXT");
  await addColumn("discountNote", "TEXT");

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
