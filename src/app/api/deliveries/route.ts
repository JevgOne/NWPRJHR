import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stockInSchema } from "@/lib/validations/delivery";
import { serializeDeliveryForRole } from "@/lib/api/delivery-serializer";
import { stockIn } from "@/lib/stock-in";
import { generateBarcode } from "@/lib/barcode";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "SALON")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const variantId = searchParams.get("variantId");
  const supplierId = searchParams.get("supplierId");
  const hasStock = searchParams.get("hasStock");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (variantId) where.variantId = variantId;
  if (supplierId) where.supplierId = supplierId;
  if (hasStock === "true") where.remainingGrams = { gt: 0 };
  if (from || to) {
    where.stockedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const deliveries = await prisma.delivery.findMany({
    where,
    include: { supplier: true },
    orderBy: { stockedAt: "desc" },
  });

  const serialized = deliveries
    .map((d) => serializeDeliveryForRole(d, session.user.role))
    .filter(Boolean);

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = stockInSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const delivery = await stockIn(
    {
      variantId: data.variantId,
      supplierId: data.supplierId,
      purchasePricePerGramRaw: data.purchasePricePerGramRaw,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      totalGrams: data.totalGrams,
      totalPieces: data.totalPieces,
      pieceWeightGrams: data.pieceWeightGrams,
      barcode: data.barcode || generateBarcode(),
      batchCode: data.batchCode,
      stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
      note: data.note,
    },
    session.user.id
  );

  return NextResponse.json(delivery, { status: 201 });
}
