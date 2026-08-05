import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, supplierCode, photoCode, photos, price, leadDays, description } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Název a cena jsou povinné" }, { status: 400 });
  }

  const slug = slugify(name);

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      category: "VIRGIN",
      processingType: "OTHER",
      orderOnly: true,
      supplierCode: supplierCode || null,
      photoCode: photoCode || null,
      photos: JSON.stringify(photos ?? []),
      slug: slug || undefined,
      variants: {
        create: {
          lengthCm: 0,
          color: "0",
          costPricePerGram: 0,
          wholesalePricePerGram: price,
          retailPricePerGram: price,
          sellingMode: "BY_PIECE",
          pricePerPiece: price,
          retailPricePerPiece: price,
          availableToOrder: true,
          orderLeadDays: leadDays || 14,
        },
      },
    },
  });

  revalidateTag("products");

  return NextResponse.json({ id: product.id }, { status: 201 });
}
