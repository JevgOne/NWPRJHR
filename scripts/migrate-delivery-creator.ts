/**
 * Add createdByUserId column to deliveries table in Turso.
 * Then backfill from stock_movements (RECEIPT type).
 * Safe to run multiple times.
 *
 * Usage: npx tsx scripts/migrate-delivery-creator.ts
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

async function main() {
  console.log("Adding createdByUserId to deliveries...\n");

  // Add column
  try {
    await client.execute(
      `ALTER TABLE deliveries ADD COLUMN createdByUserId TEXT`
    );
    console.log("  ✓ added createdByUserId");
  } catch (e: any) {
    if (e.message?.includes("duplicate column")) {
      console.log("  · createdByUserId (already exists)");
    } else {
      console.error("  ✗ createdByUserId:", e.message);
      throw e;
    }
  }

  // Backfill from stock_movements (RECEIPT)
  console.log("\nBackfilling from stock_movements...");
  const result = await client.execute(`
    UPDATE deliveries SET createdByUserId = (
      SELECT sm.userId FROM stock_movements sm
      WHERE sm.deliveryId = deliveries.id AND sm.type = 'RECEIPT'
      LIMIT 1
    )
    WHERE createdByUserId IS NULL
  `);
  console.log(`  ✓ updated ${result.rowsAffected} rows`);

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
