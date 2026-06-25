import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
