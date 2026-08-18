import { prisma } from "../src/lib/db";
import { generateSku } from "../src/lib/sku";

async function main() {
  const variants = await prisma.variant.findMany({
    where: { sku: null },
    include: {
      product: {
        select: { category: true, texture: true, origin: true, orderOnly: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${variants.length} variants without SKU`);

  const usedSkus = new Set<string>();

  // Pre-load existing SKUs (in case some already have one)
  const existing = await prisma.variant.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });
  for (const v of existing) {
    if (v.sku) usedSkus.add(v.sku);
  }

  let updated = 0;
  for (const v of variants) {
    let sku = generateSku(v.product.category, v.product.texture, v.color, v.lengthCm, {
      orderOnly: v.product.orderOnly,
      origin: v.product.origin,
    });

    if (usedSkus.has(sku)) {
      let found = false;
      for (let i = 2; i <= 100; i++) {
        const candidate = `${sku}-${i}`;
        if (!usedSkus.has(candidate)) {
          sku = candidate;
          found = true;
          break;
        }
      }
      if (!found) {
        sku = `${sku}-${Date.now()}`;
      }
    }

    usedSkus.add(sku);
    await prisma.variant.update({ where: { id: v.id }, data: { sku } });
    updated++;

    if (updated % 50 === 0) {
      console.log(`  Updated ${updated}/${variants.length}...`);
    }
  }

  console.log(`Done. Updated ${updated} variants with SKU.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
