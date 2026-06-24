import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { roundHalereUp } from "@/lib/rounding";
import { getStockNumbers } from "@/lib/stock";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SALON" || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: session.user.salonId },
  });

  const loyaltyDiscount = await getLoyaltyDiscount(salon.tier);

  const products = await prisma.product.findMany({
    where: { archived: false },
    include: {
      variants: {
        where: { active: true },
        orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  // Add salon-specific prices and stock availability
  const result = await Promise.all(
    products.map(async (product) => {
      const variants = await Promise.all(
        product.variants.map(async (v) => {
          const stock = await getStockNumbers(v.id);
          const salonPrice =
            loyaltyDiscount > 0
              ? roundHalereUp(
                  (v.wholesalePricePerGram * (10000 - loyaltyDiscount)) / 10000
                )
              : v.wholesalePricePerGram;

          return {
            id: v.id,
            lengthCm: v.lengthCm,
            color: v.color,
            pricePerGram: salonPrice,
            availableGrams: stock.availableGrams,
            availablePieces: stock.availablePieces,
          };
        })
      );

      return {
        id: product.id,
        name: product.name,
        nameUk: product.nameUk,
        nameRu: product.nameRu,
        category: product.category,
        processingType: product.processingType,
        photos: product.photos,
        variants,
      };
    })
  );

  return NextResponse.json(result);
}
