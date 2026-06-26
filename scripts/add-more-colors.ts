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

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      variants: {
        where: { active: true },
        select: { lengthCm: true, color: true, retailPricePerGram: true, wholesalePricePerGram: true }
      }
    }
  });

  // Add missing colors: 4 (Medová), 5 (Karamelová), 6 (Světle hnědá), 8 (Tmavě hnědá)
  const missing = ["4", "5", "6", "8"];

  // Distribute across products: each product gets 1-2 of the missing colors
  const assignments: [number, string[]][] = [
    [0, ["4", "5"]],    // product 0
    [1, ["5", "6"]],    // product 1
    [2, ["6", "8"]],    // product 2
    [3, ["4", "8"]],    // product 3
    [4, ["5", "6"]],    // product 4
    [5, ["4", "8"]],    // product 5
    [6, ["5", "6"]],    // product 6
    [7, ["4", "8"]],    // product 7
  ];

  for (const [idx, colors] of assignments) {
    if (idx >= products.length) break;
    const p = products[idx];
    const have = new Set(p.variants.map(v => v.color));
    const lengths = [...new Set(p.variants.map(v => v.lengthCm))];
    const ref = p.variants[0];

    for (const c of colors) {
      if (have.has(c)) continue;
      const len = lengths[Math.floor(Math.random() * lengths.length)];
      await prisma.variant.create({
        data: {
          productId: p.id,
          lengthCm: len,
          color: c,
          active: true,
          retailPricePerGram: ref?.retailPricePerGram ?? 0,
          wholesalePricePerGram: ref?.wholesalePricePerGram ?? 0,
        }
      });
      console.log(`  + "${p.name}": color ${c} @ ${len}cm`);
    }
  }

  const all = await prisma.variant.findMany({ where: { active: true }, select: { color: true } });
  const counts: Record<string, number> = {};
  all.forEach(v => { counts[v.color] = (counts[v.color] ?? 0) + 1; });
  console.log("\nFinal colors:", Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0])));
}

main().catch(console.error).finally(() => prisma.$disconnect());
