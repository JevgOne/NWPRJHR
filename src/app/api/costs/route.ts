import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOperatingCostSchema } from "@/lib/validations/finance";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
  );

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.operatingCost.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdByUser: { select: { name: true } },
      },
    }),
    prisma.operatingCost.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createOperatingCostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const cost = await prisma.operatingCost.create({
    data: {
      category: parsed.data.category,
      amountHalere: parsed.data.amountHalere,
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      note: parsed.data.note,
      createdByUserId: session.user.id,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "OperatingCost",
    entityId: cost.id,
    detail: { category: parsed.data.category, amountHalere: parsed.data.amountHalere },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(cost, { status: 201 });
}
