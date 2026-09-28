/**
 * Find and hard-delete a product by variant SKU.
 * Cascade deletes: stockMovements → returns → complaints → deliveries →
 *                  reservations → stockSubscriptions → productReservations →
 *                  sampleRequests → reviews(nullify) → variants → product
 *
 * Run: node --env-file=.env.production.local scripts/delete-product.mjs S-IN-RV-14-45
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const sku = process.argv[2];
if (!sku) { console.error("Usage: node scripts/delete-product.mjs <SKU>"); process.exit(1); }

const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");
const adapter = new PrismaLibSql({ url: remoteUrl, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  const variant = await prisma.variant.findFirst({
    where: { sku: { startsWith: sku } },
    select: { id: true, sku: true, productId: true, product: { select: { name: true, id: true } } },
  });

  if (!variant) { console.log(`No variant found with SKU starting with "${sku}"`); return; }

  console.log(`Found: ${variant.product.name} (SKU: ${variant.sku})`);
  console.log(`Product ID: ${variant.product.id}`);
  console.log(`Variant ID: ${variant.id}`);

  const productId = variant.product.id;

  // Get all variant IDs for this product
  const allVariants = await prisma.variant.findMany({
    where: { productId },
    select: { id: true },
  });
  const variantIds = allVariants.map(v => v.id);

  // Get all delivery IDs
  const deliveries = await prisma.delivery.findMany({
    where: { variantId: { in: variantIds } },
    select: { id: true },
  });
  const deliveryIds = deliveries.map(d => d.id);

  // Cascade delete in correct order
  if (variantIds.length > 0) {
    await prisma.stockMovement.deleteMany({ where: { variantId: { in: variantIds } } });

    if (deliveryIds.length > 0) {
      await prisma.return.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
      await prisma.complaint.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
    }

    await prisma.delivery.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.reservation.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.stockSubscription.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.productReservation.deleteMany({ where: { variantId: { in: variantIds } } });
  }

  await prisma.sampleRequest.deleteMany({ where: { productId } });
  await prisma.review.updateMany({ where: { productId }, data: { productId: null } });
  await prisma.variant.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });

  console.log(`✓ Smazáno: "${variant.product.name}" a všechna related data.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
