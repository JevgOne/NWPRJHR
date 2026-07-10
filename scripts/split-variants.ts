/**
 * One-time migration: split multi-variant products into individual products.
 * Each variant (length+color) becomes its own product with its own slug.
 *
 * Run: npx tsx scripts/split-variants.ts
 *
 * Safe: does NOT delete anything. Creates new products + reassigns variants.
 */
import { createClient } from "@libsql/client";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^(\w+)="?([^"]*)"?$/);
  if (match) process.env[match[1]] = match[2];
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function cuid(): string {
  return randomBytes(16).toString("hex").slice(0, 25);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  // Get all non-archived products with their active variants
  const products = await client.execute(
    `SELECT id, name, "nameUk", "nameRu", description, "descriptionUk", "descriptionRu",
            category, "processingType", origin, texture, "colorTone", photos, video,
            slug, "metaTitle", "metaDescription", "ogImage"
     FROM products WHERE archived = 0`
  );

  for (const product of products.rows) {
    const variants = await client.execute({
      sql: `SELECT id, "lengthCm", color, "costPricePerGram", "wholesalePricePerGram",
                   "retailPricePerGram", "retailManualOverride", "sellingMode",
                   "pricePerPiece", "retailPricePerPiece", active
            FROM variants WHERE "productId" = ? AND active = 1
            ORDER BY "lengthCm" ASC, color ASC`,
      args: [product.id as string],
    });

    if (variants.rows.length <= 1) {
      console.log(`  ✓ ${product.name} — already 1 variant, skipping`);
      continue;
    }

    console.log(`\n  Splitting: ${product.name} (${variants.rows.length} variants)`);

    // Keep the FIRST variant on the original product, update its name/slug
    const firstVariant = variants.rows[0];
    const baseName = product.name as string;
    const firstName = `${baseName} ${firstVariant.lengthCm}cm`;
    const firstSlug = slugify(firstName);

    await client.execute({
      sql: `UPDATE products SET name = ?, slug = ? WHERE id = ?`,
      args: [firstName, firstSlug, product.id as string],
    });
    console.log(`    → Kept: ${firstName} [${firstSlug}]`);

    // Create new products for remaining variants
    for (let i = 1; i < variants.rows.length; i++) {
      const variant = variants.rows[i];
      const newId = cuid();
      const newName = `${baseName} ${variant.lengthCm}cm`;
      const newSlug = slugify(newName);

      // Check if slug already exists, add color suffix if needed
      const existing = await client.execute({
        sql: `SELECT id FROM products WHERE slug = ?`,
        args: [newSlug],
      });
      const finalSlug = existing.rows.length > 0
        ? `${newSlug}-${slugify(variant.color as string)}`
        : newSlug;

      await client.execute({
        sql: `INSERT INTO products (id, name, "nameUk", "nameRu", description, "descriptionUk", "descriptionRu",
                                    category, "processingType", origin, texture, "colorTone", photos, video,
                                    archived, slug, "metaTitle", "metaDescription", "ogImage",
                                    "createdAt", "updatedAt")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, NULL, NULL, datetime('now'), datetime('now'))`,
        args: [
          newId,
          newName,
          product.nameUk as string | null,
          product.nameRu as string | null,
          product.description as string | null,
          product.descriptionUk as string | null,
          product.descriptionRu as string | null,
          product.category as string,
          product.processingType as string,
          product.origin as string | null,
          product.texture as string | null,
          product.colorTone as string | null,
          product.photos as string,
          product.video as string | null,
          finalSlug,
        ],
      });

      // Move the variant to the new product
      await client.execute({
        sql: `UPDATE variants SET "productId" = ? WHERE id = ?`,
        args: [newId, variant.id as string],
      });

      console.log(`    → Created: ${newName} [${finalSlug}] (variant ${variant.id})`);
    }
  }

  console.log("\n✅ Migration complete!");
}

main().catch(console.error);
