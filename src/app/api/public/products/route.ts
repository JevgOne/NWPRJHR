import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const category = sp.get("category");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { archived: false };
  if (category) {
    where.category = category;
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameUk: true,
      nameRu: true,
      description: true,
      descriptionUk: true,
      descriptionRu: true,
      category: true,
      processingType: true,
      origin: true,
      photos: true,
      variants: {
        where: { active: true },
        select: {
          lengthCm: true,
          color: true,
          // NO prices, NO stock levels
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: products });
}
