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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const givenByUserId = searchParams.get("givenByUserId");
  const partnerId = searchParams.get("partnerId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (type) where.type = type;
  if (givenByUserId) where.givenByUserId = givenByUserId;
  if (partnerId) {
    where.bearers = { some: { partnerId } };
  }

  const [discounts, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            customerType: true,
            totalAmount: true,
            completedAt: true,
          },
        },
        givenByUser: { select: { id: true, name: true, email: true } },
        bearers: { include: { partner: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discount.count({ where }),
  ]);

  return NextResponse.json({
    data: discounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
