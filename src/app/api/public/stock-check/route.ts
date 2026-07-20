import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStockNumbers } from "@/lib/stock";
import { prisma } from "@/lib/db";

const stockCheckSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        grams: z.number().int().min(0),
        pieces: z.number().int().min(0),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = stockCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items } = parsed.data;
  const variantIds = items.map((i) => i.variantId);

  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      availableToOrder: true,
      orderLeadDays: true,
      sellingMode: true,
    },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const results = await Promise.all(
    items.map(async (item) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        return {
          variantId: item.variantId,
          requested: { grams: item.grams, pieces: item.pieces },
          available: false,
          inStock: { grams: 0, pieces: 0 },
          availableToOrder: false,
          estimatedLeadDays: null,
        };
      }

      const stock = await getStockNumbers(item.variantId);
      const isByPiece = variant.sellingMode === "BY_PIECE";
      const inStockGrams = stock.availableGrams;
      const inStockPieces = stock.availablePieces;

      const available = isByPiece
        ? item.pieces > 0
          ? inStockPieces >= item.pieces
          : inStockGrams >= item.grams
        : inStockGrams >= item.grams;

      return {
        variantId: item.variantId,
        requested: { grams: item.grams, pieces: item.pieces },
        available,
        inStock: { grams: inStockGrams, pieces: inStockPieces },
        availableToOrder: variant.availableToOrder,
        estimatedLeadDays: variant.availableToOrder
          ? variant.orderLeadDays
          : null,
      };
    })
  );

  return NextResponse.json({
    allAvailable: results.every((r) => r.available),
    items: results,
  });
}
