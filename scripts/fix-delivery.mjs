/**
 * Create a delivery + stock movement for an already-existing product/variant.
 * Run: node --env-file=.env.production.local scripts/fix-delivery.mjs
 *
 * Edit the constants below before running.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import crypto from "crypto";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL?.replace(/\s+/g, ""),
  authToken: process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, ""),
});
const prisma = new PrismaClient({ adapter });

// ── Edit these ──────────────────────────────────────────────────────────
const VARIANT_ID = "CHANGE_ME";        // variant cuid
const SUPPLIER_ID = "CHANGE_ME";       // supplier cuid
const PURCHASE_PER_100G = 1448;        // CZK per 100g (= haléře per gram)
const TOTAL_GRAMS = 130;
// ────────────────────────────────────────────────────────────────────────

async function main() {
  const batch = await prisma.stockBatch.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!batch) throw new Error("No open batch found");

  const owner = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true },
  });
  if (!owner) throw new Error("No OWNER user found");

  const barcode = "HL" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase();

  const delivery = await prisma.delivery.create({
    data: {
      variantId: VARIANT_ID,
      supplierId: SUPPLIER_ID,
      purchasePricePerGramRaw: PURCHASE_PER_100G,
      purchasePricePerGramCZK: PURCHASE_PER_100G,
      currency: "CZK",
      exchangeRate: 10000,
      initialGrams: TOTAL_GRAMS,
      initialPieces: 0,
      remainingGrams: TOTAL_GRAMS,
      remainingPieces: 0,
      barcode,
      batchId: batch.id,
      stockedAt: new Date(),
      createdByUserId: owner.id,
    },
  });

  await prisma.stockMovement.create({
    data: {
      deliveryId: delivery.id,
      variantId: VARIANT_ID,
      type: "RECEIPT",
      grams: TOTAL_GRAMS,
      userId: owner.id,
      note: "Naskladnění",
    },
  });

  const variant = await prisma.variant.findUnique({
    where: { id: VARIANT_ID },
    select: { sku: true, product: { select: { name: true, slug: true } } },
  });

  console.log("✓ Naskladněno!");
  console.log(`  Produkt: ${variant?.product.name}`);
  console.log(`  SKU: ${variant?.sku}`);
  console.log(`  Delivery: ${delivery.id}`);
  console.log(`  Barcode: ${barcode}`);
  console.log(`  Slug: ${variant?.product.slug}`);
  console.log(`  ${TOTAL_GRAMS}g, ${PURCHASE_PER_100G} Kč/100g`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
