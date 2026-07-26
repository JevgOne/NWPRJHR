import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { customerSchema } from "@/lib/validations/sale";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          saleNumber: true,
          totalAmount: true,
          completedAt: true,
          paymentType: true,
          items: {
            select: {
              grams: true,
              pieces: true,
              lineTotal: true,
              variant: {
                select: {
                  color: true,
                  lengthCm: true,
                  sellingMode: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
        take: 50,
      },
      inquiries: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          items: { select: { id: true } },
        },
        take: 50,
      },
      productReservations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reservationNumber: true,
          status: true,
          lineTotal: true,
          grams: true,
          pieces: true,
          sellingMode: true,
          paymentDueDate: true,
          paidAt: true,
          createdAt: true,
          variant: {
            select: {
              color: true,
              lengthCm: true,
              product: { select: { name: true } },
            },
          },
          invoices: {
            where: { type: "DEPOSIT" },
            select: {
              id: true,
              number: true,
              total: true,
              status: true,
            },
          },
        },
        take: 50,
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          number: true,
          type: true,
          total: true,
          status: true,
          issueDate: true,
        },
        take: 50,
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        take: 50,
      },
      referrals: {
        select: {
          id: true,
          code: true,
          usedCount: true,
          maxUses: true,
          active: true,
        },
      },
    },
  });

  if (!customer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalSpent = customer.sales.reduce((s, sale) => s + sale.totalAmount, 0);
  const totalGramsBought = customer.sales.reduce(
    (s, sale) => s + sale.items.reduce((g, item) => g + item.grams, 0),
    0
  );
  const totalPiecesBought = customer.sales.reduce(
    (s, sale) => s + sale.items.reduce((p, item) => p + item.pieces, 0),
    0
  );
  const averageOrderValue =
    customer.sales.length > 0
      ? Math.round(totalSpent / customer.sales.length)
      : 0;
  const firstPurchaseDate =
    customer.sales.length > 0
      ? customer.sales[customer.sales.length - 1]?.completedAt
      : null;
  const lastPurchaseDate =
    customer.sales.length > 0 ? customer.sales[0]?.completedAt : null;
  const activeReservations = customer.productReservations.filter(
    (r) => r.status === "PENDING" || r.status === "PAID"
  ).length;

  return NextResponse.json({
    ...customer,
    totalSpent,
    totalGramsBought,
    totalPiecesBought,
    averageOrderValue,
    firstPurchaseDate,
    lastPurchaseDate,
    salesCount: customer.sales.length,
    inquiriesCount: customer.inquiries.length,
    reservationsCount: customer.productReservations.length,
    activeReservations,
    ordersCount: customer.orders.length,
    invoicesCount: customer.invoices.length,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const customer = await prisma.customer.update({
    where: { id },
    data: { ...parsed.data, name },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Customer",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(customer);
}
