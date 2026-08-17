import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateProductBio } from "@/lib/product-bio";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { force } = await request.json().catch(() => ({ force: false }));

  const where = force
    ? { archived: false }
    : {
        archived: false,
        OR: [
          { description: null },
          { description: "" },
          { descriptionUk: null },
          { descriptionRu: null },
        ],
      };

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: {
        select: { lengthCm: true, color: true },
      },
    },
  });

  let updated = 0;

  for (const product of products) {
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

    const updates: Record<string, string> = {};

    if (force || !product.description) {
      updates.description = generateProductBio(bioData, "cs");
    }
    if (force || !product.descriptionUk) {
      updates.descriptionUk = generateProductBio(bioData, "uk");
    }
    if (force || !product.descriptionRu) {
      updates.descriptionRu = generateProductBio(bioData, "ru");
    }

    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updates,
      });
      updated++;
    }
  }

  return NextResponse.json({
    total: products.length,
    updated,
    message: `Popisy vygenerovány pro ${updated} produktů`,
  });
}
