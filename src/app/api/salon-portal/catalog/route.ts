import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyDiscount } from "@/lib/loyalty";
import { roundHalereUp } from "@/lib/rounding";
import { getAllStockNumbers } from "@/lib/stock";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") ||
    !session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: session.user.salonId },
  });

  const isHairdresser = session.user.role === "HAIRDRESSER";

  // Parallel fetch: discount + products + stock (3 queries at once)
  const [discountData, products, stockMap] = await Promise.all([
    isHairdresser
      ? prisma.b2BSettings.findFirst().then(s => ({ hairdresserDiscountPct: s?.hairdresserDiscountPct ?? 2000, loyaltyDiscount: 0 }))
      : getLoyaltyDiscount(salon.tier).then(d => ({ hairdresserDiscountPct: 0, loyaltyDiscount: d })),
    prisma.product.findMany({
      where: { archived: false },
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    getAllStockNumbers(),
  ]);

  const { hairdresserDiscountPct, loyaltyDiscount } = discountData;

  // Add role-specific prices, filter to in-stock variants only
  const allProducts = products.map((product) => {
    const variants = product.variants
      .map((v) => {
        const stock = stockMap.get(v.id);

        let price: number;
        if (isHairdresser) {
          price = roundHalereUp(
            (v.retailPricePerGram * (10000 - hairdresserDiscountPct)) / 10000
          );
        } else {
          price =
            loyaltyDiscount > 0
              ? roundHalereUp(
                  (v.wholesalePricePerGram * (10000 - loyaltyDiscount)) /
                    10000
                )
              : v.wholesalePricePerGram;
        }

        return {
          id: v.id,
          lengthCm: v.lengthCm,
          color: v.color,
          pricePerGram: price,
          availableGrams: stock?.availableGrams ?? 0,
          availablePieces: stock?.availablePieces ?? 0,
        };
      })
      .filter((v) => v.availableGrams > 0);

    if (variants.length === 0) return null;

    return {
      id: product.id,
      name: product.name,
      nameUk: product.nameUk,
      nameRu: product.nameRu,
      category: product.category,
      processingType: product.processingType,
      origin: product.origin,
      texture: product.texture,
      photos: JSON.parse(product.photos || "[]") as string[],
      variants,
    };
  });

  // Filter out products with no in-stock variants
  const result = allProducts.filter(Boolean);

  return NextResponse.json(result);
}
