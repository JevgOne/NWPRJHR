/**
 * Migrate old color codes to industry-standard codes.
 *
 * Old system (light→dark): 1=Platinum, 2=Light Blonde, ... 10=Black
 * New system (dark→light): 1=Jet Black, 1B=Off Black, ... 613=Platinum Blonde
 *
 * Run: node scripts/migrate-colors.mjs
 * Or dry-run: DRY_RUN=1 node scripts/migrate-colors.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

const OLD_TO_NEW = {
  "1":  "613",   // Platinová blond → 613 Platinum Blonde
  "2":  "24",    // Světlá blond → 24 Golden Blonde
  "3":  "16",    // Zlatá blond → 16 Honey Blonde
  "4":  "14",    // Medová blond → 14 Dark Blonde
  "5":  "10",    // Karamelová → 10 Medium Golden Brown
  // "6" stays "6" — Light Brown in both systems
  "7":  "5",     // Středně hnědá → 5 Medium Brown
  "8":  "3",     // Tmavě hnědá → 3 Dark Brown
  "9":  "1B",    // Kaštanová → 1B Off Black
  "10": "1",     // Černá → 1 Jet Black
};

// Old "9" doesn't exist in new system, needs special handling
// Old "6", "ombre", "grey" don't change

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE MIGRATION ===");

  // 1. Migrate variant colors
  const variants = await prisma.variant.findMany({
    select: { id: true, color: true, sku: true },
  });

  let variantCount = 0;
  for (const v of variants) {
    const newColor = OLD_TO_NEW[v.color];
    if (!newColor) continue; // no mapping needed (already new code, or "6"/"ombre"/"grey")

    console.log(`Variant ${v.id}: color "${v.color}" → "${newColor}" (SKU: ${v.sku})`);

    // Update SKU if it contains the old color code
    let newSku = v.sku;
    if (v.sku) {
      // SKU format: CAT-TEX-COLOR-LENGTH-SEQ or OBJ-CAT-ORIG-TEX-COLOR-LENGTH
      // Color is padded to 2 chars (e.g., "01", "10")
      const oldPadded = v.color.padStart(2, "0");
      const newPadded = newColor.padStart(2, "0");
      // Replace the color segment in SKU (careful: only replace the right part)
      const parts = v.sku.split("-");
      const colorIdx = parts.findIndex((p) => p === oldPadded);
      if (colorIdx >= 0) {
        parts[colorIdx] = newPadded;
        newSku = parts.join("-");
        console.log(`  SKU: "${v.sku}" → "${newSku}"`);
      }
    }

    if (!DRY_RUN) {
      await prisma.variant.update({
        where: { id: v.id },
        data: { color: newColor, ...(newSku !== v.sku ? { sku: newSku } : {}) },
      });
    }
    variantCount++;
  }

  // 2. Migrate product colorTone (if stored as old code)
  const products = await prisma.product.findMany({
    where: { colorTone: { not: null } },
    select: { id: true, colorTone: true },
  });

  let productCount = 0;
  for (const p of products) {
    if (!p.colorTone) continue;
    const newColor = OLD_TO_NEW[p.colorTone];
    if (!newColor) continue;

    console.log(`Product ${p.id}: colorTone "${p.colorTone}" → "${newColor}"`);
    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: p.id },
        data: { colorTone: newColor },
      });
    }
    productCount++;
  }

  console.log(`\n${DRY_RUN ? "Would update" : "Updated"}: ${variantCount} variants, ${productCount} products`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
