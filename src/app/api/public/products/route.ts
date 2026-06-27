import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
            lengthCm: true,
            color: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const parsed = products.map((p) => ({
      ...p,
      photos: JSON.parse(p.photos || "[]"),
    }));

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
