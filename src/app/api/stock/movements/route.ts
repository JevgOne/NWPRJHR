import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const variantId = searchParams.get("variantId");
  const deliveryId = searchParams.get("deliveryId");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const userId = searchParams.get("userId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {};
  if (variantId) where.variantId = variantId;
  if (deliveryId) where.deliveryId = deliveryId;
  if (type) where.type = type;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        delivery: { select: { id: true, barcode: true } },
        variant: {
          select: {
            id: true,
            lengthCm: true,
            color: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return NextResponse.json({ movements, total, limit, offset });
}
