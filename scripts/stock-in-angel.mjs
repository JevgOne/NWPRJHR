/**
 * Stock in Angel Enterprises product directly via Prisma.
 * Replicates what POST /api/deliveries does with the new naming/SKU logic.
 *
 * Run: node --env-file=.env.production.local scripts/stock-in-angel.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import crypto from "crypto";

const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");
const adapter = new PrismaLibSql({ url: remoteUrl, authToken });
const prisma = new PrismaClient({ adapter });

// ── Product details ─────────────────────────────────────────────────────
const CATEGORY = "STANDARD";
const ORIGIN = "Indie";
const TEXTURE = "Rovné";
const COLOR = "14";       // Dark Blonde
const LENGTH_CM = 45;
const TOTAL_GRAMS = 130;
const COLOR_LABEL = "tmavá blond";
const COLOR_TONE = "Tmavá blond";

// Angel Enterprises price table: blond 45cm
const PURCHASE_PER_100G = 1448;  // CZK per 100g = haléře per gram
const RETAIL_PER_100G = 4634;
const B2B_PER_100G = 3186;
// ────────────────────────────────────────────────────────────────────────

async function main() {
  // Find supplier
  const supplier = await prisma.supplier.findFirst({
    where: { name: { contains: "Angel" } },
    select: { id: true, name: true },
  });
  if (!supplier) throw new Error("Supplier Angel Enterprises not found");
  console.log(`Supplier: ${supplier.name} (${supplier.id})`);

  // Find owner user for createdByUserId
  const owner = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true, name: true },
  });
  if (!owner) throw new Error("No OWNER user found");

  // Generate unique slug
  const slugBase = `standard-indie-rovne-14-45cm`;
  let slug = slugBase;
  let slugSeq = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slugSeq++;
    slug = `${slugBase}-${slugSeq}`;
  }

  // Product name
  const productName = `${ORIGIN} ${TEXTURE} ${COLOR_LABEL} ${LENGTH_CM} cm`;

  // Create product
  const product = await prisma.product.create({
    data: {
      name: productName,
      nameUk: productName,
      nameRu: productName,
      category: CATEGORY,
      processingType: "OTHER",
      origin: ORIGIN,
      texture: TEXTURE,
      colorTone: COLOR_TONE,
      slug,
      photos: "[]",
    },
  });
  console.log(`Product: ${product.name} (${product.id})`);

  // Generate SKU with origin and sequence
  const variants = await prisma.variant.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });
  let maxSeq = 0;
  for (const v of variants) {
    const match = v.sku?.match(/-(\d{5})$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = maxSeq + 1;
  const sku = `S-IN-RV-${COLOR.padStart(2, "0")}-${LENGTH_CM}-${String(nextSeq).padStart(5, "0")}`;

  // Create variant
  const variant = await prisma.variant.create({
    data: {
      productId: product.id,
      sku,
      lengthCm: LENGTH_CM,
      color: COLOR,
      sellingMode: "BY_GRAM",
      costPricePerGram: PURCHASE_PER_100G,
      wholesalePricePerGram: B2B_PER_100G,
      retailPricePerGram: RETAIL_PER_100G,
      active: true,
    },
  });
  console.log(`Variant: ${sku} (${variant.id})`);

  // Find or create open batch
  let batch = await prisma.stockBatch.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
  if (!batch) {
    batch = await prisma.stockBatch.create({
      data: { name: `Várka — ${new Date().toLocaleDateString("cs-CZ")}`, status: "OPEN" },
    });
  }

  // Generate barcode
  const barcode = `HL${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // Create delivery
  const delivery = await prisma.delivery.create({
    data: {
      variantId: variant.id,
      supplierId: supplier.id,
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
  console.log(`Delivery: ${delivery.id}, ${TOTAL_GRAMS}g, barcode: ${barcode}`);

  // Create stock movement
  await prisma.stockMovement.create({
    data: {
      deliveryId: delivery.id,
      variantId: variant.id,
      type: "RECEIPT",
      grams: TOTAL_GRAMS,
      userId: owner.id,
      note: "Naskladnění",
    },
  });

  console.log(`\n✓ Naskladněno: ${productName}`);
  console.log(`  SKU: ${sku}`);
  console.log(`  Nákup: ${PURCHASE_PER_100G} Kč/100g`);
  console.log(`  Retail: ${RETAIL_PER_100G} Kč/100g`);
  console.log(`  B2B: ${B2B_PER_100G} Kč/100g`);
  console.log(`  Sklad: ${TOTAL_GRAMS}g`);
  console.log(`  Batch: ${batch.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
