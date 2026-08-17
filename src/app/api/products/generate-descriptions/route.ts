import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateProductBio } from "@/lib/product-bio";

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base);
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!existing || existing.id === excludeId) return slug;
  for (let i = 2; i <= 100; i++) {
    const candidate = `${slug}-${i}`;
    const found = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === excludeId) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { force } = await request.json().catch(() => ({ force: false }));

  // Fetch ALL non-archived products (for slug fix + descriptions)
  const products = await prisma.product.findMany({
    where: { archived: false },
    include: {
      variants: {
        select: { lengthCm: true, color: true },
      },
    },
  });

  let updatedDescriptions = 0;
  let updatedSlugs = 0;

  for (const product of products) {
    const updates: Record<string, string | null> = {};

    // --- Descriptions ---
    const needsDesc = force || !product.description;
    const needsUk = force || !product.descriptionUk;
    const needsRu = force || !product.descriptionRu;

    if (needsDesc || needsUk || needsRu) {
      const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b);
      const colorCount = new Set(product.variants.map((v) => v.color)).size;
      const bioData = {
        name: product.name,
        category: product.category,
        processingType: product.processingType,
        origin: product.origin,
        texture: product.texture,
        colorTone: product.colorTone,
        lengths,
        colorCount,
      };

      if (needsDesc) updates.description = generateProductBio(bioData, "cs");
      if (needsUk) updates.descriptionUk = generateProductBio(bioData, "uk");
      if (needsRu) updates.descriptionRu = generateProductBio(bioData, "ru");
      updatedDescriptions++;
    }

    // --- Slug regeneration ---
    const idealSlug = slugify(product.name);
    const currentSlug = product.slug;
    // Fix if: no slug, slug contains timestamp (13+ digit number), or slug doesn't match name
    const hasTimestamp = currentSlug && /\d{10,}/.test(currentSlug);
    if (!currentSlug || hasTimestamp) {
      const newSlug = await uniqueSlug(product.name, product.id);
      if (newSlug !== currentSlug) {
        updates.slug = newSlug;
        updatedSlugs++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updates,
      });
    }
  }

  return NextResponse.json({
    total: products.length,
    updatedDescriptions,
    updatedSlugs,
    message: `Popisy: ${updatedDescriptions}, slugy: ${updatedSlugs} z ${products.length} produktů`,
  });
}
