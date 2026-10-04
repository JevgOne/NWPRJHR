import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * One-time cleanup: remove "(Exkluziv)" from product names + change origin "Írán" → "Indie".
 * DELETE this route after running it once.
 */
export async function POST(request: NextRequest) {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const authHeader = request.headers.get("authorization");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results: string[] = [];

  // 1. Strip "(Exkluziv)" / "(Ексклюзив)" / "(Эксклюзив)" from product names
  const exkluzivProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "(Exkluziv)" } },
        { nameUk: { contains: "(Ексклюзив)" } },
        { nameRu: { contains: "(Эксклюзив)" } },
      ],
    },
    select: { id: true, name: true, nameUk: true, nameRu: true },
  });

  for (const p of exkluzivProducts) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        name: p.name.replace(" (Exkluziv)", ""),
        nameUk: p.nameUk?.replace(" (Ексклюзив)", "") ?? p.nameUk,
        nameRu: p.nameRu?.replace(" (Эксклюзив)", "") ?? p.nameRu,
      },
    });
    results.push(`Cleaned name: "${p.name}" → "${p.name.replace(" (Exkluziv)", "")}"`);
  }

  // 2. Change origin "Írán" → "Indie"
  const iranProducts = await prisma.product.findMany({
    where: { origin: "Írán" },
    select: { id: true, name: true },
  });

  if (iranProducts.length > 0) {
    await prisma.product.updateMany({
      where: { origin: "Írán" },
      data: { origin: "Indie" },
    });
    results.push(`Changed origin "Írán" → "Indie" for ${iranProducts.length} products: ${iranProducts.map(p => p.name).join(", ")}`);
  }

  return NextResponse.json({
    cleaned: exkluzivProducts.length,
    originFixed: iranProducts.length,
    details: results,
  });
}
