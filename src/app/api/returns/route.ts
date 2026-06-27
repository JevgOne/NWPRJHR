import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateReturn } from "@/lib/returns";
import { initiateReturnSchema } from "@/lib/validations/returns";
import { createNotificationForRole } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const salonId = sp.get("salonId");
  const from = sp.get("from");
  const to = sp.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (salonId) where.salonId = salonId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const returns = await prisma.return.findMany({
    where,
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
      creditNote: { select: { id: true, number: true } },
      createdByUser: { select: { name: true } },
      approvedByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(returns);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = initiateReturnSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const ret = await initiateReturn(parsed.data, session.user.id);

    // Notify owners about return request
    const sale = await prisma.sale.findUnique({
      where: { id: parsed.data.saleId },
      select: { salon: { select: { name: true } } },
    });
    createNotificationForRole({
      role: "OWNER",
      type: "RETURN_REQUEST",
      title: `Vratka ke schvaleni`,
      message: `Nova vratka ke schvaleni od salonu ${sale?.salon?.name ?? ""}.`,
      data: { returnId: ret.id, salonName: sale?.salon?.name },
    }).catch(() => {});

    return NextResponse.json(ret, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
