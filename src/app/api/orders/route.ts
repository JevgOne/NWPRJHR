import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validations/salon";
import { createOrder } from "@/lib/order-workflow";
import { createNotificationForRole } from "@/lib/notifications";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const salonId = sp.get("salonId");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "20"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (salonId) where.salonId = salonId;

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        salon: { select: { name: true } },
        items: {
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
        _count: { select: { items: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  // SALON/HAIRDRESSER can only create orders for their own salon
  let salonId: string;
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salon account not linked. Contact support." }, { status: 403 });
    }
    salonId = session.user.salonId;
  } else if (["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    if (!parsed.data.salonId) {
      return NextResponse.json({ error: "salonId is required for staff orders" }, { status: 400 });
    }
    salonId = parsed.data.salonId;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const order = await createOrder(salonId, parsed.data.items, parsed.data.note);

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "CREATE",
      entity: "Order",
      entityId: order.id,
      detail: { salonId, itemCount: parsed.data.items.length, orderNumber: order.orderNumber },
      ipAddress: getClientIp(request),
    });

    // Notify owners about new order
    const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { name: true } });
    createNotificationForRole({
      role: "OWNER",
      type: "NEW_ORDER",
      title: `Nova objednavka: ${salon?.name ?? ""}`,
      message: `Salon "${salon?.name ?? ""}" vytvoril novou objednavku (${parsed.data.items.length} polozek).`,
      data: { orderId: order.id, salonName: salon?.name, itemCount: parsed.data.items.length },
    }).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error("Order creation failed:", { salonId, items: parsed.data.items, error: e });
    if (e instanceof Error && e.message.startsWith("Insufficient stock")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Order creation failed" },
      { status: 500 }
    );
  }
}
