import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  confirmOrder,
  rejectOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/lib/order-workflow";
import { completeSale } from "@/lib/sales";
import { createInvoiceFromSale } from "@/lib/invoicing";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      salon: { select: { id: true, name: true, tier: true } },
      items: {
        include: {
          variant: {
            select: {
              id: true,
              lengthCm: true,
              color: true,
              product: { select: { name: true, nameUk: true, nameRu: true } },
            },
          },
        },
      },
      sale: { select: { id: true, saleNumber: true } },
    },
  });

  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "SALON" && order.salonId !== session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(order);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string;

  try {
    switch (action) {
      case "confirm": {
        if (session.user.role !== "OWNER")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const order = await confirmOrder(id, session.user.id);
        return NextResponse.json(order);
      }

      case "reject": {
        if (session.user.role !== "OWNER")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (!body.reason)
          return NextResponse.json(
            { error: "Reason required" },
            { status: 400 }
          );
        const order = await rejectOrder(id, body.reason);
        return NextResponse.json(order);
      }

      case "status": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (!["READY", "IN_TRANSIT"].includes(body.status))
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 }
          );
        const order = await updateOrderStatus(id, body.status);
        return NextResponse.json(order);
      }

      case "complete": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Release reservations
        await prisma.reservation.updateMany({
          where: { orderId: id, active: true },
          data: { active: false },
        });

        const order = await prisma.order.findUniqueOrThrow({
          where: { id },
          include: { items: true, salon: true },
        });

        if (
          !["CONFIRMED", "READY", "IN_TRANSIT"].includes(order.status)
        ) {
          return NextResponse.json(
            { error: `Cannot complete order in status ${order.status}` },
            { status: 400 }
          );
        }

        // Create sale from order items
        const sale = await completeSale(
          {
            customerType: "SALON",
            salonId: order.salonId,
            items: order.items.map((item) => ({
              variantId: item.variantId,
              grams: item.grams,
              pieces: item.pieces,
            })),
            orderId: order.id,
          },
          session.user.id
        );

        // Create invoice
        const invoice = await createInvoiceFromSale(
          sale.id,
          body.companyId
        );

        // Update order
        const updated = await prisma.order.update({
          where: { id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            saleId: sale.id,
          },
        });

        return NextResponse.json({
          order: updated,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
          invoice: { id: invoice.id, number: invoice.number },
        });
      }

      case "cancel": {
        const orderCheck = await prisma.order.findUniqueOrThrow({
          where: { id },
        });

        // SALON can only cancel their own NEW orders
        if (session.user.role === "SALON") {
          if (orderCheck.salonId !== session.user.salonId)
            return NextResponse.json(
              { error: "Forbidden" },
              { status: 403 }
            );
          if (orderCheck.status !== "NEW")
            return NextResponse.json(
              { error: "Can only cancel NEW orders" },
              { status: 400 }
            );
        } else if (!["OWNER", "EMPLOYEE"].includes(session.user.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const order = await cancelOrder(id);
        return NextResponse.json(order);
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
