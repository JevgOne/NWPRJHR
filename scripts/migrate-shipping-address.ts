/**
 * Add shipping address columns to orders table.
 * Safe to run multiple times (catches "duplicate column" errors).
 *
 * Usage: npx tsx scripts/migrate-shipping-address.ts
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
      e.message?.includes("duplicate column") ||
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
  console.log("Adding shipping address columns to orders...\n");

  await safeExec(
    `ALTER TABLE orders ADD COLUMN "shippingStreet" TEXT`,
    "orders.shippingStreet"
  );
  await safeExec(
    `ALTER TABLE orders ADD COLUMN "shippingCity" TEXT`,
    "orders.shippingCity"
  );
  await safeExec(
    `ALTER TABLE orders ADD COLUMN "shippingZip" TEXT`,
    "orders.shippingZip"
  );

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
