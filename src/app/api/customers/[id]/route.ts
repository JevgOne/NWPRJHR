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
          items: {
            select: {
              grams: true,
              pieces: true,
              lineTotal: true,
            },
          },
        },
        take: 50,
      },
    },
  });

  if (!customer)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalSpent = customer.sales.reduce((s, sale) => s + sale.totalAmount, 0);

  return NextResponse.json({
    ...customer,
    totalSpent,
    salesCount: customer.sales.length,
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

  const customer = await prisma.customer.update({
    where: { id },
    data: parsed.data,
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
