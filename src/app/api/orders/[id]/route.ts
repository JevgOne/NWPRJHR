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
import { createSalonNotification, createNotificationForRole } from "@/lib/notifications";
import { notifyOrderCancelled } from "@/lib/telegram";
import { logAudit, getClientIp } from "@/lib/audit";
import { sendNotificationEmail } from "@/lib/email";
import { getOrderConfirmationEmail, getOrderShippedEmail } from "@/lib/email-templates";

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

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "CONFIRM",
          entity: "Order",
          entityId: id,
          detail: { orderNumber: order.orderNumber },
          ipAddress: getClientIp(request),
        });

        // Notify salon about confirmation
        createSalonNotification({
          salonId: order.salonId,
          type: "ORDER_CONFIRMED",
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

        // Send order confirmation email
        prisma.order.findUnique({
          where: { id },
          include: {
            salon: { select: { email: true, name: true, language: true } },
            items: {
              include: {
                variant: {
                  select: { lengthCm: true, color: true, product: { select: { name: true } } },
                },
              },
            },
          },
        }).then((fullOrder) => {
          if (!fullOrder?.salon?.email) return;
          const lang = fullOrder.salon.language || "cs";
          const emailData = getOrderConfirmationEmail(lang, {
            salonName: fullOrder.salon.name,
            orderNumber: fullOrder.orderNumber ?? id.slice(0, 8),
            items: fullOrder.items.map((i) => ({
              productName: i.variant.product.name,
              lengthCm: i.variant.lengthCm,
              color: i.variant.color,
              grams: i.grams,
              pieces: i.pieces,
            })),
            estimatedTotal: fullOrder.estimatedTotal,
            promoCode: fullOrder.promoCode ?? undefined,
            promoDiscount: fullOrder.promoDiscount ?? undefined,
          });
          sendNotificationEmail({ to: fullOrder.salon.email, subject: emailData.subject, body: emailData.text, html: emailData.html }).catch(() => {});
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

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "REJECT",
          entity: "Order",
          entityId: id,
          detail: { reason: body.reason, orderNumber: order.orderNumber },
          ipAddress: getClientIp(request),
        });

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

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "STATUS_CHANGE",
          entity: "Order",
          entityId: id,
          detail: { newStatus: body.status, orderNumber: order.orderNumber },
          ipAddress: getClientIp(request),
        });

        // Notify salon about status change
        const notifType = body.status === "READY" ? "ORDER_READY" as const : "ORDER_IN_TRANSIT" as const;
        createSalonNotification({
          salonId: order.salonId,
          type: notifType,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        }).catch(() => {});

        // Send shipped email when status changes to IN_TRANSIT
        if (body.status === "IN_TRANSIT") {
          prisma.salon.findUnique({
            where: { id: order.salonId },
            select: { email: true, name: true, language: true },
          }).then((salon) => {
            if (!salon?.email) return;
            const lang = salon.language || "cs";
            const emailData = getOrderShippedEmail(lang, {
              salonName: salon.name,
              orderNumber: order.orderNumber ?? id.slice(0, 8),
              estimatedTotal: order.estimatedTotal,
            });
            sendNotificationEmail({ to: salon.email, subject: emailData.subject, body: emailData.text, html: emailData.html }).catch(() => {});
          }).catch(() => {});
        }

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

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "COMPLETE",
          entity: "Order",
          entityId: id,
          detail: { saleId: sale.id, saleNumber: sale.saleNumber, invoiceNumber: invoice.number },
          ipAddress: getClientIp(request),
        });

        return NextResponse.json({
          order: result.order,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
          invoice: { id: invoice.id, number: invoice.number },
        });
      }

      case "cancel": {
        const orderCheck = await prisma.order.findUniqueOrThrow({
          where: { id },
          include: {
            salon: { select: { name: true } },
            _count: { select: { items: true } },
          },
        });

        const isSalonCancel = session.user.role === "SALON" || session.user.role === "HAIRDRESSER";

        // SALON/HAIRDRESSER can only cancel their own NEW orders
        if (isSalonCancel) {
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

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "CANCEL",
          entity: "Order",
          entityId: id,
          detail: { orderNumber: order.orderNumber, cancelledBy: isSalonCancel ? "salon" : "admin" },
          ipAddress: getClientIp(request),
        });

        if (isSalonCancel) {
          // Notify admin that salon cancelled their order
          createNotificationForRole({
            role: "OWNER",
            type: "ORDER_REJECTED",
            title: `Objednávka zrušena salonem`,
            message: `Salon ${orderCheck.salon.name} zrušil objednávku ${order.orderNumber ?? id.slice(0, 8)}`,
            data: { orderId: order.id, orderNumber: order.orderNumber, salonName: orderCheck.salon.name },
          }).catch(() => {});
        } else {
          // Notify salon that admin cancelled their order
          createSalonNotification({
            salonId: orderCheck.salonId,
            type: "ORDER_REJECTED",
            data: { orderId: order.id, orderNumber: order.orderNumber },
          }).catch(() => {});
        }

        // Telegram notification
        notifyOrderCancelled({
          orderNumber: order.orderNumber,
          orderId: order.id,
          salonName: orderCheck.salon.name,
          cancelledBy: isSalonCancel ? "salon" : "admin",
          itemCount: orderCheck._count.items,
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
