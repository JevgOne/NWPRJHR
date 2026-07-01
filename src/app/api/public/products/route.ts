import { NextRequest, NextResponse } from "next/server";
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
    },
  },
} as const;

/**
 * Fetch ALL active products (no filters) — cached for 60s.
 * Used for both the unfiltered "allProducts" call and as
 * the base data that gets filtered client-side.
 */
const getCachedAllProducts = unstable_cache(
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
          sellingMode: v.sellingMode ?? "BY_GRAM",
          retailPricePerPiece: v.retailPricePerPiece,
          pricePerPiece: v.pricePerPiece,
          wholesalePricePerPiece: v.pricePerPiece,
          availablePieces: stock?.availablePieces ?? 0,
        };
      }),
    }));
  },
  ["public-products-all"],
  { revalidate: 60, tags: ["products"] }
);

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const category = sp.get("category");
    const origin = sp.get("origin");
    const color = sp.get("color");
    const lengthCm = sp.get("lengthCm") ? parseInt(sp.get("lengthCm")!, 10) : null;
    const search = sp.get("search")?.toLowerCase();
    const texture = sp.get("texture");
    const colorTone = sp.get("colorTone");

    // Always fetch from cache — single DB hit shared across requests
    const allProducts = await getCachedAllProducts();

    // Apply filters in-memory (fast, no extra DB queries)
    const filtered = allProducts.filter((p) => {
      if (category && p.category !== category) return false;
      if (origin && p.origin !== origin) return false;
      if (texture && p.texture !== texture) return false;
      if (colorTone && p.colorTone !== colorTone) return false;
      if (color || lengthCm) {
        const hasMatch = p.variants.some(
          (v) =>
            (!color || v.color === color) &&
            (!lengthCm || v.lengthCm === lengthCm)
        );
        if (!hasMatch) return false;
      }
      if (search) {
        const haystack = [p.name, p.nameUk, p.nameRu, p.origin, p.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    return NextResponse.json(
      { data: filtered },
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
