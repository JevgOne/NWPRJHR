import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stockBatchSchema } from "@/lib/validations/delivery";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  const batches = await prisma.stockBatch.findMany({
    where,
    include: {
      deliveries: {
        include: {
          variant: {
            select: {
              lengthCm: true,
              color: true,
              retailPricePerGram: true,
              retailPricePerPiece: true,
              sellingMode: true,
              product: { select: { name: true, category: true, texture: true } },
            },
          },
          supplier: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(batches);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = stockBatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  let name = data.name;
  if (!name) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = [
      "leden", "únor", "březen", "duben", "květen", "červen",
      "červenec", "srpen", "září", "říjen", "listopad", "prosinec",
    ];
    const existingCount = await prisma.stockBatch.count({
      where: {
        createdAt: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      },
    });
    const seq = existingCount + 1;
    name = `Várka ${seq} — ${monthNames[month]} ${year}`;
  }

  const batch = await prisma.stockBatch.create({
    data: { name, note: data.note },
  });

  return NextResponse.json(batch, { status: 201 });
}
