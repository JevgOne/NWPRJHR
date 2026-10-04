import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * REVERT: change origin back for products mistakenly changed + diagnose ceník.
 * DELETE after use.
 */
export async function POST(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as Record<string, string>).action ?? "diagnose";

  if (action === "diagnose") {
    // List ALL products with origin "Indie" so we can see what's there
    const indieProducts = await prisma.product.findMany({
      where: { origin: "Indie" },
      select: {
        id: true, name: true, archived: true,
        variants: { select: { id: true, active: true, lengthCm: true, retailPricePerGram: true, sellingMode: true } },
      },
    });
    // Also list products with origin "Írán"
    const iranProducts = await prisma.product.findMany({
      where: { origin: "Írán" },
      select: {
        id: true, name: true, archived: true,
        variants: { select: { id: true, active: true, lengthCm: true, retailPricePerGram: true, sellingMode: true } },
      },
    });
    return NextResponse.json({ indie: indieProducts, iran: iranProducts });
  }

  if (action === "revert") {
    // Revert the 6 products that were Luxe/Panenské with origin "Indie" back to "Írán"
    const ids = (body as Record<string, string[]>).ids;
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Provide ids array" }, { status: 400 });
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { origin: "Írán" },
    });
    return NextResponse.json({ reverted: result.count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
