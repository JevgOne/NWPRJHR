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

  const salonType = salon.type as "SALON" | "HAIRDRESSER";

  // Parallel fetch: discount + products + stock (3 queries at once)
  const [loyaltyDiscount, products, stockMap] = await Promise.all([
    getLoyaltyDiscount(salon.tier, salonType),
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

  // Add role-specific prices, filter to in-stock variants only
  // Both salon and hairdresser: loyalty discount applied to retail price
  const allProducts = products.map((product) => {
    const variants = product.variants
      .map((v) => {
        const stock = stockMap.get(v.id);
        const isByPiece = v.sellingMode === "BY_PIECE";

        let price: number;
        let pricePerPiece: number | undefined;

        if (isByPiece) {
          const retailPiece = v.retailPricePerPiece ?? v.pricePerPiece ?? 0;
          pricePerPiece = loyaltyDiscount > 0
            ? roundHalereUp((retailPiece * (10000 - loyaltyDiscount)) / 10000)
            : retailPiece;
          price = 0; // not used for BY_PIECE
        } else {
          price = loyaltyDiscount > 0
            ? roundHalereUp((v.retailPricePerGram * (10000 - loyaltyDiscount)) / 10000)
            : v.retailPricePerGram;
        }

        return {
          id: v.id,
          lengthCm: v.lengthCm,
          color: v.color,
          pricePerGram: price,
          availableGrams: stock?.availableGrams ?? 0,
          availablePieces: stock?.availablePieces ?? 0,
          sellingMode: v.sellingMode ?? "BY_GRAM",
          pricePerPiece,
        };
      })
      .filter((v) => v.sellingMode === "BY_PIECE" ? v.availablePieces > 0 : v.availableGrams > 0);

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
