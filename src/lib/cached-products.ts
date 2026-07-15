import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getAllStockNumbers } from "@/lib/stock";

const productSelect = {
  id: true,
  slug: true,
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
  colorTone: true,
  photos: true,
  variants: {
    where: { active: true },
    select: {
      id: true,
      lengthCm: true,
      color: true,
      retailPricePerGram: true,
      wholesalePricePerGram: true,
      sellingMode: true,
      pricePerPiece: true,
      retailPricePerPiece: true,
      availableToOrder: true,
      orderLeadDays: true,
    },
  },
} as const;

/**
 * Fetch ALL active products (no filters) — cached for 60s.
 * Shared between the API route and the server component.
 */
export const getCachedAllProducts = unstable_cache(
  async () => {
    const [products, stockMap] = await Promise.all([
      prisma.product.findMany({
        where: { archived: false, variants: { some: { active: true } } },
        select: productSelect,
        orderBy: { name: "asc" },
      }),
      getAllStockNumbers(),
    ]);

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
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
      colorTone: p.colorTone,
      photos: JSON.parse(p.photos || "[]"),
      variants: p.variants.map((v) => {
        const stock = stockMap.get(v.id);
        return {
          lengthCm: v.lengthCm,
          color: v.color,
          retailPricePerGram: v.retailPricePerGram,
          wholesalePricePerGram: v.wholesalePricePerGram,
          availableGrams: stock?.availableGrams ?? 0,
          sellingMode: (v.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE",
          retailPricePerPiece: v.retailPricePerPiece,
          pricePerPiece: v.pricePerPiece,
          wholesalePricePerPiece: v.pricePerPiece,
          availablePieces: stock?.availablePieces ?? 0,
          exclusivePieces: stock?.exclusivePieces ?? 0,
        };
      }),
    }));
  },
  ["public-products-all"],
  { revalidate: 60, tags: ["products"] }
);

export type CachedProduct = Awaited<ReturnType<typeof getCachedAllProducts>>[number];
