import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/slugify";

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true, processingType: true },
  });

  console.log(`Found ${products.length} products without slugs`);

  for (const product of products) {
    const baseName = `${product.name} ${product.processingType.replace(/_/g, "-")}`;
    let slug = slugify(baseName);

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
    console.log(`  ${product.name} (${product.processingType}) -> ${candidate}`);
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
