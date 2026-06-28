import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStockNumbers } from "@/lib/stock";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const category = sp.get("category");

    const origin = sp.get("origin");
    const color = sp.get("color");
    const lengthCm = sp.get("lengthCm");
    const search = sp.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { archived: false };
    if (category) {
      where.category = category;
    }
    if (origin) {
      where.origin = origin;
    }
    const texture = sp.get("texture");
    if (texture) where.texture = texture;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameUk: { contains: search } },
        { nameRu: { contains: search } },
        { origin: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (color || lengthCm) {
      where.variants = {
        some: {
          active: true,
          ...(color ? { color } : {}),
          ...(lengthCm ? { lengthCm: parseInt(lengthCm, 10) } : {}),
        },
      };
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
        texture: true,
        photos: true,
        variants: {
          where: { active: true },
          select: {
            id: true,
            lengthCm: true,
            color: true,
            retailPricePerGram: true,
            wholesalePricePerGram: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const withStock = await Promise.all(
      products.map(async (p) => {
        const variantsWithStock = await Promise.all(
          p.variants.map(async (v) => {
            const stock = await getStockNumbers(v.id);
            return {
              lengthCm: v.lengthCm,
              color: v.color,
              retailPricePerGram: v.retailPricePerGram,
              wholesalePricePerGram: v.wholesalePricePerGram,
              availableGrams: stock.availableGrams,
            };
          })
        );

        const inStock = variantsWithStock.filter((v) => v.availableGrams > 0);
        if (inStock.length === 0) return null;

        return {
          id: p.id,
          name: p.name,
          nameUk: p.nameUk,
          nameRu: p.nameRu,
          description: p.description,
          descriptionUk: p.descriptionUk,
          descriptionRu: p.descriptionRu,
          category: p.category,
          processingType: p.processingType,
          origin: p.origin,
          texture: p.texture,
          photos: JSON.parse(p.photos || "[]"),
          variants: inStock,
        };
      })
    );

    const parsed = withStock.filter(Boolean);

    return NextResponse.json(
      { data: parsed },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Public products API error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
