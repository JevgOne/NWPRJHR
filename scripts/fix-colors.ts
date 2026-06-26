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
  // 1. Fix origins
  for (const [old, rep] of [["Východní Evropa", "Ukrajina"], ["Evropa", "Bělorusko"]] as const) {
    const r = await prisma.product.updateMany({ where: { origin: old }, data: { origin: rep } });
    console.log(`Origin "${old}" → "${rep}": ${r.count}`);
  }

  // 2. Remap color codes to 1-10 scale
  // New: 1=Platinová, 2=Světlá blond, 3=Zlatá blond, 4=Medová,
  //   5=Karamelová, 6=Světle hnědá, 7=Středně hnědá, 8=Tmavě hnědá, 9=Tmavá, 10=Černá
  const colorMap: [string, string][] = [
    ["613", "1"],
    ["27", "4"],
    ["4", "7"],
    ["2", "9"],
    ["1B", "10"],
  ];

  for (const [oldColor, newColor] of colorMap) {
    const r = await prisma.variant.updateMany({ where: { color: oldColor }, data: { color: newColor } });
    if (r.count > 0) console.log(`Color "${oldColor}" → "${newColor}": ${r.count} variants`);
  }

  // 3. Add extra colors so palette is richer
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

  const extraColors = ["2", "3", "5", "6", "8"];
  for (const p of products) {
    const have = new Set(p.variants.map(v => v.color));
    const lengths = [...new Set(p.variants.map(v => v.lengthCm))];
    const ref = p.variants[0];
    let added = 0;
    for (const c of extraColors) {
      if (have.has(c) || added >= 2) continue;
      await prisma.variant.create({
        data: {
          productId: p.id,
          lengthCm: lengths[added % lengths.length],
          color: c,
          active: true,
          retailPricePerGram: ref?.retailPricePerGram ?? 0,
          wholesalePricePerGram: ref?.wholesalePricePerGram ?? 0,
        }
      });
      console.log(`  + "${p.name}": color ${c}`);
      added++;
    }
  }

  // Final state
  const all = await prisma.variant.findMany({ where: { active: true }, select: { color: true } });
  const counts: Record<string, number> = {};
  all.forEach(v => { counts[v.color] = (counts[v.color] ?? 0) + 1; });
  console.log("\nFinal colors:", counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
