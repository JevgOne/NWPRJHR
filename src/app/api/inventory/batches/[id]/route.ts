import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stockBatchUpdateSchema } from "@/lib/validations/delivery";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const batch = await prisma.stockBatch.findUnique({
    where: { id },
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
  });

  if (!batch)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(batch);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const body = await request.json();
  const parsed = stockBatchUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.stockBatch.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "CLOSED" && existing.status !== "CLOSED") {
      updateData.closedAt = new Date();
    }
  }

  const batch = await prisma.stockBatch.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(batch);
}
