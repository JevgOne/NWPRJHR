import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";

async function main() {
  // Regenerate ALL slugs (name only, no processing type)
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${products.length} products to update`);

  // First pass: clear all slugs to avoid conflicts
  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: { slug: null },
    });
  }

  // Second pass: set new slugs
  for (const product of products) {
    let slug = slugify(product.name);

    // Ensure uniqueness
    let suffix = 0;
    let candidate = slug;
    while (await prisma.product.findUnique({ where: { slug: candidate } })) {
      suffix++;
      candidate = `${slug}-${suffix}`;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { slug: candidate },
    });
    console.log(`  ${product.name}: ${product.slug} -> ${candidate}`);
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
