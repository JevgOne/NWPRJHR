import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const deliveries = await prisma.delivery.findMany({
    where: { variant: { productId: id } },
    include: {
      supplier: true,
      variant: { select: { id: true, lengthCm: true, color: true, sellingMode: true } },
    },
    orderBy: { stockedAt: "desc" },
  });

  return NextResponse.json(deliveries);
}
