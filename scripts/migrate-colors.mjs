/**
 * Migrate old color codes to industry-standard codes.
 *
 * Old system (light→dark): 1=Platinum, 2=Light Blonde, ... 10=Black
 * New system (dark→light): 1=Jet Black, 1B=Off Black, ... 613=Platinum Blonde
 *
 * Two-phase approach to avoid SKU UNIQUE constraint conflicts:
 *   Phase 1: Update all colors (no SKU changes)
 *   Phase 2: Rename SKUs via temp suffix to avoid ordering conflicts
 *
 * Run: node --env-file=.env.production.local scripts/migrate-colors.mjs
 * Or dry-run: DRY_RUN=1 node --env-file=.env.production.local scripts/migrate-colors.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DRY_RUN = process.env.DRY_RUN === "1";

const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");

const adapter = new PrismaLibSql({ url: remoteUrl, authToken });
const prisma = new PrismaClient({ adapter });

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

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE MIGRATION ===");

  // ── Phase 1: Migrate variant colors ──
  const variants = await prisma.variant.findMany({
    select: { id: true, color: true, sku: true },
  });

  const skuRenames = []; // { id, oldSku, newSku }
  let variantCount = 0;

  for (const v of variants) {
    const newColor = OLD_TO_NEW[v.color];
    if (!newColor) continue;

    console.log(`[Color] Variant ${v.id}: "${v.color}" → "${newColor}"`);

    if (!DRY_RUN) {
      await prisma.variant.update({
        where: { id: v.id },
        data: { color: newColor },
      });
    }

    // Compute new SKU for phase 2
    if (v.sku) {
      const oldPadded = v.color.padStart(2, "0");
      const newPadded = newColor.padStart(2, "0");
      const parts = v.sku.split("-");
      const colorIdx = parts.findIndex((p) => p === oldPadded);
      if (colorIdx >= 0) {
        parts[colorIdx] = newPadded;
        const newSku = parts.join("-");
        if (newSku !== v.sku) {
          skuRenames.push({ id: v.id, oldSku: v.sku, newSku });
        }
      }
    }

    variantCount++;
  }

  // ── Phase 2a: Rename all affected SKUs to temp names ──
  console.log(`\n[SKU] Phase 2a: renaming ${skuRenames.length} SKUs to temp names...`);
  for (const r of skuRenames) {
    const tempSku = r.oldSku + "_MIG";
    console.log(`  "${r.oldSku}" → "${tempSku}"`);
    if (!DRY_RUN) {
      await prisma.variant.update({
        where: { id: r.id },
        data: { sku: tempSku },
      });
    }
  }

  // ── Phase 2b: Rename temp SKUs to final names ──
  console.log(`[SKU] Phase 2b: renaming temp SKUs to final names...`);
  for (const r of skuRenames) {
    console.log(`  "${r.oldSku}_MIG" → "${r.newSku}"`);
    if (!DRY_RUN) {
      await prisma.variant.update({
        where: { id: r.id },
        data: { sku: r.newSku },
      });
    }
  }

  // ── Phase 3: Migrate product colorTone ──
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

  console.log(`\n${DRY_RUN ? "Would update" : "Updated"}: ${variantCount} variants (${skuRenames.length} SKU renames), ${productCount} products`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
