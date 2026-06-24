import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!partner)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dateFilter =
    from || to
      ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {};

  const withdrawals = await prisma.partnerWithdrawal.findMany({
    where: { partnerId: id, ...dateFilter },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const completedAtFilter =
    from || to
      ? {
          completedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {};

  const personalDiscounts = await prisma.discountBearer.findMany({
    where: {
      partnerId: id,
      discount: {
        type: "PERSONAL",
        sale: { status: "COMPLETED", ...completedAtFilter },
      },
    },
    include: {
      discount: {
        select: {
          amountHalere: true,
          percent: true,
          createdAt: true,
          sale: {
            select: {
              id: true,
              completedAt: true,
              salon: { select: { name: true } },
              customer: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { discount: { createdAt: "desc" } },
  });

  return NextResponse.json({
    partner,
    withdrawals,
    personalDiscounts: personalDiscounts.map((db) => ({
      shareAmount: db.shareAmount,
      discountAmount: db.discount.amountHalere,
      discountPercent: db.discount.percent,
      date: db.discount.createdAt,
      saleId: db.discount.sale.id,
      saleDate: db.discount.sale.completedAt,
      salonName: db.discount.sale.salon?.name,
      customerName: db.discount.sale.customer?.name,
    })),
  });
}
