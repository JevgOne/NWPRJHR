import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const prisma = new PrismaClient({ adapter });

const TARGET_MARKUP = 100;

function calculateRetailPrice(costHalere: number, markupPercent: number): number {
  const raw = costHalere * (1 + markupPercent / 100);
  return Math.ceil(raw / 100) * 100;
}

async function main() {
  const settings = await prisma.priceSettings.findMany();
  console.log("Price settings:", settings.map(s => `${s.category}=${s.markupPercent}%`).join(", "));

  // Fix all non-override variants across all categories
  const categories = ["VIRGIN", "LUXE", "STANDARD", "SALE"] as const;
  let totalFixed = 0;

  for (const cat of categories) {
    const setting = settings.find(s => s.category === cat);
    const markup = setting?.markupPercent ?? TARGET_MARKUP;

    const variants = await prisma.variant.findMany({
      where: { product: { category: cat }, retailManualOverride: false },
      include: { product: { select: { slug: true } } },
    });

    let fixed = 0;
    for (const v of variants) {
      const expected = calculateRetailPrice(v.costPricePerGram, markup);
      if (v.retailPricePerGram !== expected) {
        await prisma.variant.update({
          where: { id: v.id },
          data: { retailPricePerGram: expected, wholesalePricePerGram: expected },
        });
        fixed++;
        console.log(`  [FIXED] ${cat} ${v.product.slug} len=${v.lengthCm} color=${v.color}: cost=${v.costPricePerGram} retail ${v.retailPricePerGram} → ${expected}`);
      }
    }

    console.log(`${cat}: ${fixed}/${variants.length} fixed`);
    totalFixed += fixed;
  }

  console.log(`\nDone! Fixed ${totalFixed} variants total. All retail = ceil((1 + markup/100) × cost) rounded up to whole CZK.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
