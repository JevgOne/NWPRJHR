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

  const ret = await prisma.return.findUnique({
    where: { id },
    include: {
      sale: { select: { saleNumber: true } },
      saleItem: {
        include: {
          variant: {
            select: {
              lengthCm: true,
              color: true,
              product: { select: { name: true } },
            },
          },
        },
      },
      salon: { select: { id: true, name: true } },
      delivery: { select: { id: true, barcode: true } },
      creditNote: { select: { id: true, number: true } },
      createdByUser: { select: { name: true } },
      approvedByUser: { select: { name: true } },
    },
  });

  if (!ret)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(ret);
}
