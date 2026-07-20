/**
 * Sprint 1+3 production migration for Turso.
 * Adds all missing columns/tables for e-shop Order expansion.
 * Safe to run multiple times (catches "duplicate column" errors).
 *
 * Usage: npx tsx scripts/migrate-sprint3-production.ts
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
      e.message?.includes("already exists") ||
      e.message?.includes("duplicate")
    ) {
      console.log(`  · ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}: ${e.message}`);
    }
  }
}

async function main() {
  console.log("=== Hairland Sprint 1+3 Production Migration ===\n");
  console.log(`DB: ${process.env.TURSO_DATABASE_URL}\n`);

  // ──────────────────────────────────────────────
  // 1. Make orders.salonId nullable (was NOT NULL)
  // SQLite doesn't support ALTER COLUMN, so we need to check current state
  // ──────────────────────────────────────────────
  console.log("1. Orders — new columns (Sprint 1 expansion):");

  // Customer (retail)
  await safeExec(`ALTER TABLE orders ADD COLUMN customerId TEXT REFERENCES customers(id)`, "orders.customerId");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId)`, "orders.customerId index");

  // Contact info
  await safeExec(`ALTER TABLE orders ADD COLUMN contactEmail TEXT`, "orders.contactEmail");
  await safeExec(`ALTER TABLE orders ADD COLUMN contactPhone TEXT`, "orders.contactPhone");
  await safeExec(`ALTER TABLE orders ADD COLUMN contactName TEXT`, "orders.contactName");

  // Order number
  await safeExec(`ALTER TABLE orders ADD COLUMN orderNumber TEXT UNIQUE`, "orders.orderNumber");

  // Pricing
  await safeExec(`ALTER TABLE orders ADD COLUMN shippingCost INTEGER NOT NULL DEFAULT 0`, "orders.shippingCost");
  await safeExec(`ALTER TABLE orders ADD COLUMN totalAmount INTEGER`, "orders.totalAmount");

  // Shipping
  await safeExec(`ALTER TABLE orders ADD COLUMN shippingMethod TEXT`, "orders.shippingMethod");
  await safeExec(`ALTER TABLE orders ADD COLUMN packetaPointId TEXT`, "orders.packetaPointId");
  await safeExec(`ALTER TABLE orders ADD COLUMN packetaPointName TEXT`, "orders.packetaPointName");
  await safeExec(`ALTER TABLE orders ADD COLUMN packetaPointCity TEXT`, "orders.packetaPointCity");
  await safeExec(`ALTER TABLE orders ADD COLUMN packetaPacketId TEXT`, "orders.packetaPacketId");
  await safeExec(`ALTER TABLE orders ADD COLUMN packetaBarcode TEXT`, "orders.packetaBarcode");
  await safeExec(`ALTER TABLE orders ADD COLUMN shippingTrackingId TEXT`, "orders.shippingTrackingId");

  // Payment
  await safeExec(`ALTER TABLE orders ADD COLUMN paymentMethod TEXT`, "orders.paymentMethod");
  await safeExec(`ALTER TABLE orders ADD COLUMN comgateTransId TEXT`, "orders.comgateTransId");
  await safeExec(`ALTER TABLE orders ADD COLUMN paidAt DATETIME`, "orders.paidAt");

  // Sale link
  await safeExec(`ALTER TABLE orders ADD COLUMN saleId TEXT UNIQUE REFERENCES sales(id)`, "orders.saleId");

  // Promo
  await safeExec(`ALTER TABLE orders ADD COLUMN promoCode TEXT`, "orders.promoCode");
  await safeExec(`ALTER TABLE orders ADD COLUMN promoDiscount INTEGER`, "orders.promoDiscount");

  // Locale
  await safeExec(`ALTER TABLE orders ADD COLUMN locale TEXT NOT NULL DEFAULT 'cs'`, "orders.locale");

  // Follow-up
  await safeExec(`ALTER TABLE orders ADD COLUMN followUpSent INTEGER NOT NULL DEFAULT 0`, "orders.followUpSent");
  await safeExec(`ALTER TABLE orders ADD COLUMN followUpSentAt DATETIME`, "orders.followUpSentAt");

  // ──────────────────────────────────────────────
  // 2. OrderItem — snapshot columns
  // ──────────────────────────────────────────────
  console.log("\n2. OrderItem — snapshot columns:");
  await safeExec(`ALTER TABLE order_items ADD COLUMN productName TEXT`, "order_items.productName");
  await safeExec(`ALTER TABLE order_items ADD COLUMN lengthCm INTEGER`, "order_items.lengthCm");
  await safeExec(`ALTER TABLE order_items ADD COLUMN color TEXT`, "order_items.color");
  await safeExec(`ALTER TABLE order_items ADD COLUMN sku TEXT`, "order_items.sku");

  // ──────────────────────────────────────────────
  // 3. Reservations table (e-shop order stock reservations)
  // ──────────────────────────────────────────────
  console.log("\n3. Reservations table (e-shop):");
  await safeExec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY NOT NULL,
      orderId TEXT NOT NULL REFERENCES orders(id),
      variantId TEXT NOT NULL REFERENCES variants(id),
      grams INTEGER NOT NULL,
      pieces INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME
    )
  `, "reservations table");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_reservations_variantId_active ON reservations(variantId, active)`, "reservations [variantId,active] index");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_reservations_orderId ON reservations(orderId)`, "reservations.orderId index");

  // ──────────────────────────────────────────────
  // 4. Handle salonId nullable (SQLite workaround)
  // ──────────────────────────────────────────────
  console.log("\n4. Fix salonId nullable:");
  // SQLite doesn't support ALTER COLUMN to change NOT NULL → nullable.
  // We need to recreate the table. However, this is risky with existing data.
  // Instead, let's check if salonId allows NULL:
  try {
    // Try inserting a test with NULL salonId to check constraint
    const tableInfo = await client.execute(`PRAGMA table_info(orders)`);
    const salonIdCol = tableInfo.rows.find((r: any) => r.name === "salonId");
    if (salonIdCol && salonIdCol.notnull === 1) {
      console.log("  ! salonId is NOT NULL — needs table rebuild");
      console.log("  ! Running table rebuild to make salonId nullable...");

      // Get current table DDL
      const ddlResult = await client.execute(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'`
      );
      const currentDdl = (ddlResult.rows[0] as any)?.sql as string;
      console.log(`  Current DDL: ${currentDdl?.substring(0, 100)}...`);

      // Step 1: Rename old table
      await client.execute(`ALTER TABLE orders RENAME TO orders_old`);
      console.log("  ✓ Renamed orders → orders_old");

      // Step 2: Create new table with salonId nullable
      // Get all column info
      const cols = tableInfo.rows.map((r: any) => {
        let def = `${r.name} ${r.type}`;
        if (r.name === "id") def += " PRIMARY KEY";
        if (r.name === "salonId") {
          // Make nullable — no NOT NULL
          def = "salonId TEXT REFERENCES salons(id)";
        } else if (r.notnull === 1 && r.dflt_value != null) {
          def += ` NOT NULL DEFAULT ${r.dflt_value}`;
        } else if (r.notnull === 1) {
          def += " NOT NULL";
        }
        if (r.dflt_value != null && r.notnull !== 1) {
          def += ` DEFAULT ${r.dflt_value}`;
        }
        return def;
      });

      const createSql = `CREATE TABLE orders (${cols.join(", ")})`;
      await client.execute(createSql);
      console.log("  ✓ Created new orders table (salonId nullable)");

      // Step 3: Copy data
      const colNames = tableInfo.rows.map((r: any) => r.name).join(", ");
      await client.execute(`INSERT INTO orders (${colNames}) SELECT ${colNames} FROM orders_old`);
      console.log("  ✓ Copied data from orders_old");

      // Step 4: Drop old table
      await client.execute(`DROP TABLE orders_old`);
      console.log("  ✓ Dropped orders_old");

      // Step 5: Recreate indexes
      await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_salonId ON orders(salonId)`, "orders.salonId index");
      await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId)`, "orders.customerId index");
      await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`, "orders.status index");
    } else {
      console.log("  · salonId already nullable (OK)");
    }
  } catch (e: any) {
    console.error(`  ✗ salonId nullable check failed: ${e.message}`);
    console.error("  ! You may need to manually fix salonId constraint");
  }

  // ──────────────────────────────────────────────
  // 5. Customer relation on Order
  // ──────────────────────────────────────────────
  console.log("\n5. Indexes:");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_salonId ON orders(salonId)`, "orders.salonId index");
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`, "orders.status index");
  await safeExec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber)`, "orders.orderNumber unique index");

  console.log("\n=== Sprint 1+3 Migration complete! ===");
}

main().catch(console.error);
