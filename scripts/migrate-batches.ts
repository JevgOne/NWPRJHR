/**
 * Backfill script: Group existing deliveries by stockedAt date into StockBatch records.
 *
 * Usage: npx tsx scripts/migrate-batches.ts
 *
 * This script:
 * 1. Groups all deliveries without a batchId by their stockedAt date
 * 2. Creates one StockBatch per date (status = CLOSED, since these are historical)
 * 3. Updates all deliveries in each group to point to the new batch
 */
import { prisma } from "../src/lib/db";

const monthNames = [
  "leden", "únor", "březen", "duben", "květen", "červen",
  "červenec", "srpen", "září", "říjen", "listopad", "prosinec",
];

async function main() {
  // Find all deliveries without a batchId
  const deliveries = await prisma.delivery.findMany({
    where: { batchId: null },
    select: { id: true, stockedAt: true },
    orderBy: { stockedAt: "asc" },
  });

  if (deliveries.length === 0) {
    console.log("No deliveries without batchId found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${deliveries.length} deliveries without batchId.`);

  // Group by date (YYYY-MM-DD)
  const groups = new Map<string, string[]>();
  for (const d of deliveries) {
    const dateKey = d.stockedAt.toISOString().slice(0, 10);
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(d.id);
    } else {
      groups.set(dateKey, [d.id]);
    }
  }

  console.log(`Grouped into ${groups.size} date batches.`);

  let batchCount = 0;
  for (const [dateKey, deliveryIds] of groups) {
    const date = new Date(dateKey);
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const day = date.getDate();

    const batch = await prisma.stockBatch.create({
      data: {
        name: `Várka — ${day}. ${monthName} ${year}`,
        status: "CLOSED",
        closedAt: new Date(),
        createdAt: date,
      },
    });

    await prisma.delivery.updateMany({
      where: { id: { in: deliveryIds } },
      data: { batchId: batch.id },
    });

    batchCount++;
    console.log(`  Created batch "${batch.name}" with ${deliveryIds.length} deliveries.`);
  }

  // Verify
  const remaining = await prisma.delivery.count({ where: { batchId: null } });
  console.log(`\nDone. Created ${batchCount} batches. Deliveries without batchId: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
