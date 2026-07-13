import { NextRequest, NextResponse } from "next/server";
import { getCachedAllProducts } from "@/lib/cached-products";

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
    const slugs = sp.get("slugs")?.split(",").filter(Boolean);

    // Always fetch from cache — single DB hit shared across requests
    const allProducts = await getCachedAllProducts();

    // Slug filter — return matching products in any order
    if (slugs && slugs.length > 0) {
      const slugSet = new Set(slugs);
      const matched = allProducts.filter((p) => p.slug && slugSet.has(p.slug));
      return NextResponse.json(
        { data: matched },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      );
    }

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
