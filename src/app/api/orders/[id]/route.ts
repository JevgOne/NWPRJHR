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
import { createSalonNotification } from "@/lib/notifications";

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

  if ((session.user.role === "SALON" || session.user.role === "HAIRDRESSER") && order.salonId !== session.user.salonId)
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

        // Notify salon about confirmation
        createSalonNotification({
          salonId: order.salonId,
          type: "ORDER_CONFIRMED",
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

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

        // Notify salon about rejection
        createSalonNotification({
          salonId: order.salonId,
          type: "ORDER_REJECTED",
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

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

        // Notify salon about status change
        const notifType = body.status === "READY" ? "ORDER_READY" as const : "ORDER_IN_TRANSIT" as const;
        createSalonNotification({
          salonId: order.salonId,
          type: notifType,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

        return NextResponse.json(order);
      }

      case "complete": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUniqueOrThrow({
            where: { id },
            include: { items: true, salon: true },
          });

          if (
            !["CONFIRMED", "READY", "IN_TRANSIT"].includes(order.status)
          ) {
            throw new Error(`Cannot complete order in status ${order.status}`);
          }

          // Release reservations
          await tx.reservation.updateMany({
            where: { orderId: id, active: true },
            data: { active: false },
          });

          // Update order status
          const updated = await tx.order.update({
            where: { id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });

          return { order: updated, orderItems: order.items, salonId: order.salonId };
        }, { timeout: 15000 });

        // Create sale from order items (has its own transaction)
        const sale = await completeSale(
          {
            customerType: "SALON",
            salonId: result.salonId,
            items: result.orderItems.map((item) => ({
              variantId: item.variantId,
              grams: item.grams,
              pieces: item.pieces,
            })),
            orderId: id,
          },
          session.user.id
        );

        // Link sale to order
        await prisma.order.update({
          where: { id },
          data: { saleId: sale.id },
        });

        // Create invoice (has its own transaction)
        const invoice = await createInvoiceFromSale(
          sale.id,
          body.companyId
        );

        // Notify salon about issued invoice
        createSalonNotification({
          salonId: result.salonId,
          type: "INVOICE_ISSUED",
          data: { invoiceId: invoice.id, invoiceNumber: invoice.number },
        }).catch(() => {});

        return NextResponse.json({
          order: result.order,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
          invoice: { id: invoice.id, number: invoice.number },
        });
      }

      case "cancel": {
        const orderCheck = await prisma.order.findUniqueOrThrow({
          where: { id },
        });

        // SALON/HAIRDRESSER can only cancel their own NEW orders
        if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
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

        // Notify salon about cancellation
        createSalonNotification({
          salonId: orderCheck.salonId,
          type: "ORDER_REJECTED",
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

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
