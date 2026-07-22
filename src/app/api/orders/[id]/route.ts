import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  confirmOrder,
  rejectOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/lib/order-workflow";
import { completeSale } from "@/lib/sales";
import { createSaleFromOrder } from "@/lib/order-to-sale";

import { createSalonNotification, createNotificationForRole, deleteNotificationsForEntity } from "@/lib/notifications";
import { notifyOrderCancelled } from "@/lib/telegram";
import { logAudit, getClientIp } from "@/lib/audit";
import { sendNotificationEmail } from "@/lib/email";
import {
  getOrderConfirmationEmail,
  getOrderShippedEmail,
  getRetailOrderShippedEmail,
  getRetailPaymentReceivedEmail,
} from "@/lib/email-templates";

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
      customer: { select: { id: true, name: true, email: true } },
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["CANCELLED", "REJECTED"].includes(order.status))
    return NextResponse.json(
      { error: "Lze smazat pouze zrušené nebo zamítnuté objednávky" },
      { status: 400 }
    );

  await prisma.$transaction(async (tx) => {
    await tx.reservation.deleteMany({ where: { orderId: id } });
    await tx.orderItem.deleteMany({ where: { orderId: id } });
    await tx.order.delete({ where: { id } });
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "Order",
    entityId: id,
    detail: { orderNumber: order.orderNumber },
    ipAddress: getClientIp(_request),
  });

  return NextResponse.json({ ok: true });
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
        if (order.salonId) {
          createSalonNotification({
            salonId: order.salonId,
            type: "ORDER_CONFIRMED",
            data: { orderId: order.id, orderNumber: order.orderNumber },
          }).catch(() => {});
        }

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
        if (order.salonId) {
          createSalonNotification({
            salonId: order.salonId,
            type: "ORDER_REJECTED",
            data: { orderId: order.id, orderNumber: order.orderNumber },
          }).catch(() => {});
        }

        return NextResponse.json(order);
      }

      case "status": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (!["READY", "SHIPPED", "PROCESSING", "DELIVERED"].includes(body.status))
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

        // Notify salon about status change (keep ORDER_IN_TRANSIT NotificationType for SHIPPED — enums are independent)
        const notifType = body.status === "READY" ? "ORDER_READY" as const : "ORDER_IN_TRANSIT" as const;
        if (order.salonId) {
          createSalonNotification({
            salonId: order.salonId,
            type: notifType,
            data: { orderId: order.id, orderNumber: order.orderNumber },
          }).catch(() => {});
        }

        // Send shipped email when status changes to SHIPPED
        if (body.status === "SHIPPED" && order.salonId) {
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

      case "mark-paid": {
        if (session.user.role !== "OWNER")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const orderToPay = await prisma.order.findUniqueOrThrow({ where: { id } });
        if (orderToPay.status !== "AWAITING_PAYMENT")
          return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 400 });

        await prisma.order.update({
          where: { id },
          data: { status: "PAID", paidAt: new Date() },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "MARK_PAID",
          entity: "Order",
          entityId: id,
          detail: { orderNumber: orderToPay.orderNumber },
          ipAddress: getClientIp(request),
        });

        // Trigger createSaleFromOrder (FIFO + invoice)
        try {
          await createSaleFromOrder(id, session.user.id);
          revalidateTag("dashboard", "max");
        } catch (e) {
          console.error("[mark-paid] createSaleFromOrder failed:", e);
          // Revert to AWAITING_PAYMENT so admin can retry
          await prisma.order.update({
            where: { id },
            data: { status: "AWAITING_PAYMENT", paidAt: null },
          });
          const message = e instanceof Error ? e.message : "Sale creation failed";
          return NextResponse.json({ error: message }, { status: 400 });
        }

        // Send payment received email (fire-and-forget)
        if (orderToPay.contactEmail) {
          const lang = (orderToPay.locale as "cs" | "uk" | "ru") || "cs";
          const emailData = getRetailPaymentReceivedEmail(lang, {
            customerName: orderToPay.contactName || "customer",
            orderNumber: orderToPay.orderNumber ?? id.slice(0, 8),
            totalAmount: orderToPay.totalAmount ?? orderToPay.estimatedTotal,
          });
          sendNotificationEmail({ to: orderToPay.contactEmail, subject: emailData.subject, body: emailData.text, html: emailData.html }).catch(() => {});
        }

        return NextResponse.json({ success: true });
      }

      case "ship-packeta": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const orderToShip = await prisma.order.findUniqueOrThrow({
          where: { id },
          include: { items: true, customer: true },
        });

        if (!["PAID", "PROCESSING"].includes(orderToShip.status))
          return NextResponse.json({ error: "Order must be PAID or PROCESSING" }, { status: 400 });
        if (orderToShip.shippingMethod !== "PACKETA" || !orderToShip.packetaPointId)
          return NextResponse.json({ error: "Not a Packeta order" }, { status: 400 });

        const { createPacket } = await import("@/lib/packeta");

        const totalGrams = orderToShip.items.reduce((sum, item) => sum + item.grams, 0);
        const weightKg = Math.max(0.5, totalGrams / 1000);
        const valueCzk = (orderToShip.totalAmount ?? orderToShip.estimatedTotal) / 100;

        const nameParts = (orderToShip.contactName || orderToShip.customer?.name || "Customer").split(" ");
        const firstName = nameParts[0] || "Customer";
        const surname = nameParts.slice(1).join(" ") || firstName;

        const packetResult = await createPacket({
          number: orderToShip.orderNumber || id.slice(-8),
          name: firstName,
          surname,
          email: orderToShip.contactEmail || orderToShip.customer?.email || "",
          phone: orderToShip.contactPhone || undefined,
          addressId: parseInt(orderToShip.packetaPointId),
          weight: weightKg,
          value: valueCzk,
        });

        if (!packetResult.success) {
          return NextResponse.json({ error: packetResult.error || "Packeta API error" }, { status: 500 });
        }

        await prisma.order.update({
          where: { id },
          data: {
            packetaPacketId: packetResult.packetId,
            packetaBarcode: packetResult.barcode,
            shippingTrackingId: packetResult.barcode,
            status: "SHIPPED",
          },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "SHIP_PACKETA",
          entity: "Order",
          entityId: id,
          detail: { packetId: packetResult.packetId, barcode: packetResult.barcode, orderNumber: orderToShip.orderNumber },
          ipAddress: getClientIp(request),
        });

        // Send shipped email (fire-and-forget)
        const shipEmail = orderToShip.contactEmail || orderToShip.customer?.email;
        if (shipEmail) {
          const lang = (orderToShip.locale as "cs" | "uk" | "ru") || "cs";
          const emailData = getRetailOrderShippedEmail(lang, {
            customerName: orderToShip.contactName || orderToShip.customer?.name || "customer",
            orderNumber: orderToShip.orderNumber ?? id.slice(0, 8),
            shippingMethod: "PACKETA",
            trackingId: packetResult.barcode,
            packetaPointName: orderToShip.packetaPointName ?? undefined,
          });
          sendNotificationEmail({ to: shipEmail, subject: emailData.subject, body: emailData.text, html: emailData.html }).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          packetId: packetResult.packetId,
          barcode: packetResult.barcode,
        });
      }

      case "ship-manual": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const orderManual = await prisma.order.findUniqueOrThrow({
          where: { id },
          include: { customer: true },
        });
        if (!["PAID", "PROCESSING"].includes(orderManual.status))
          return NextResponse.json({ error: "Order must be PAID or PROCESSING" }, { status: 400 });

        await prisma.order.update({
          where: { id },
          data: {
            status: "SHIPPED",
            shippingTrackingId: body.trackingId || null,
          },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "SHIP_MANUAL",
          entity: "Order",
          entityId: id,
          detail: { trackingId: body.trackingId, orderNumber: orderManual.orderNumber },
          ipAddress: getClientIp(request),
        });

        // Send shipped email (fire-and-forget)
        const manualEmail = orderManual.contactEmail || orderManual.customer?.email;
        if (manualEmail) {
          const lang = (orderManual.locale as "cs" | "uk" | "ru") || "cs";
          const emailData = getRetailOrderShippedEmail(lang, {
            customerName: orderManual.contactName || orderManual.customer?.name || "customer",
            orderNumber: orderManual.orderNumber ?? id.slice(0, 8),
            shippingMethod: orderManual.shippingMethod || "PERSONAL_DELIVERY",
            trackingId: body.trackingId || undefined,
          });
          sendNotificationEmail({ to: manualEmail, subject: emailData.subject, body: emailData.text, html: emailData.html }).catch(() => {});
        }

        return NextResponse.json({ success: true });
      }

      case "complete": {
        if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const orderToComplete = await prisma.order.findUniqueOrThrow({
          where: { id },
          include: { items: true, salon: true },
        });

        if (!["CONFIRMED", "READY", "SHIPPED", "DELIVERED"].includes(orderToComplete.status))
          return NextResponse.json({ error: `Cannot complete order in status ${orderToComplete.status}` }, { status: 400 });

        // Skip sale creation if order already has one (e.g. retail orders via createSaleFromOrder)
        if (orderToComplete.saleId) {
          await prisma.order.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          await prisma.reservation.updateMany({
            where: { orderId: id, active: true },
            data: { active: false },
          });

          logAudit({
            userId: session.user.id,
            userEmail: session.user.email ?? undefined,
            action: "COMPLETE",
            entity: "Order",
            entityId: id,
            detail: { saleId: orderToComplete.saleId, orderNumber: orderToComplete.orderNumber },
            ipAddress: getClientIp(request),
          });

          return NextResponse.json({ order: { ...orderToComplete, status: "COMPLETED" } });
        }

        // Retail order without sale — use createSaleFromOrder
        if (!orderToComplete.salonId) {
          // Ensure order is in PAID status for createSaleFromOrder
          if (orderToComplete.status !== "PAID" && !orderToComplete.saleId) {
            // Set to PAID temporarily for createSaleFromOrder flow
            await prisma.order.update({ where: { id }, data: { status: "PAID" } });
          }
          try {
            const sale = await createSaleFromOrder(id, session.user.id);
            await prisma.order.update({
              where: { id },
              data: { status: "COMPLETED", completedAt: new Date() },
            });
            revalidateTag("dashboard", "max");
            logAudit({
              userId: session.user.id,
              userEmail: session.user.email ?? undefined,
              action: "COMPLETE",
              entity: "Order",
              entityId: id,
              detail: { saleId: sale.id, saleNumber: sale.saleNumber, orderNumber: orderToComplete.orderNumber },
              ipAddress: getClientIp(request),
            });
            return NextResponse.json({ order: { ...orderToComplete, status: "COMPLETED" }, sale: { id: sale.id, saleNumber: sale.saleNumber } });
          } catch (e) {
            // Revert status
            await prisma.order.update({ where: { id }, data: { status: orderToComplete.status } });
            const message = e instanceof Error ? e.message : "Sale creation failed";
            return NextResponse.json({ error: message }, { status: 400 });
          }
        }

        // B2B order — existing flow with completeSale
        const result = await prisma.$transaction(async (tx) => {
          await tx.reservation.updateMany({
            where: { orderId: id, active: true },
            data: { active: false },
          });
          const updated = await tx.order.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          return { order: updated, orderItems: orderToComplete.items, salonId: orderToComplete.salonId };
        }, { timeout: 15000 });

        let sale;
        try {
          sale = await completeSale(
            {
              customerType: "SALON",
              salonId: result.salonId ?? undefined,
              items: result.orderItems.map((item) => ({
                variantId: item.variantId,
                grams: item.grams,
                pieces: item.pieces,
              })),
              orderId: id,
            },
            session.user.id
          );
        } catch (e) {
          console.error("[Order Complete] completeSale failed:", { orderId: id, error: e });
          await prisma.order.update({
            where: { id },
            data: { status: "CONFIRMED", completedAt: null },
          });
          const message = e instanceof Error ? e.message : "Sale creation failed";
          return NextResponse.json({ error: message }, { status: 400 });
        }

        await prisma.order.update({
          where: { id },
          data: { saleId: sale.id },
        });

        revalidateTag("dashboard", "max");

        if (result.salonId) {
          createSalonNotification({
            salonId: result.salonId,
            type: "ORDER_READY",
            data: { saleId: sale.id, saleNumber: sale.saleNumber },
          }).catch(() => {});
        }

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "COMPLETE",
          entity: "Order",
          entityId: id,
          detail: { saleId: sale.id, saleNumber: sale.saleNumber },
          ipAddress: getClientIp(request),
        });

        return NextResponse.json({
          order: result.order,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
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

        if (isSalonCancel && orderCheck.salon) {
          // Notify admin that salon cancelled their order
          createNotificationForRole({
            role: "OWNER",
            type: "ORDER_REJECTED",
            title: `Objednávka zrušena salonem`,
            message: `Salon ${orderCheck.salon.name} zrušil objednávku ${order.orderNumber ?? id.slice(0, 8)}`,
            data: { orderId: order.id, orderNumber: order.orderNumber, salonName: orderCheck.salon.name },
          }).catch(() => {});
        } else if (orderCheck.salonId) {
          // Notify salon that admin cancelled their order
          createSalonNotification({
            salonId: orderCheck.salonId,
            type: "ORDER_REJECTED",
            data: { orderId: order.id, orderNumber: order.orderNumber },
          }).catch(() => {});
        }

        // Clean up old notifications for this order
        deleteNotificationsForEntity("orderId", id).catch(() => {});

        // Telegram notification
        notifyOrderCancelled({
          orderNumber: order.orderNumber,
          orderId: order.id,
          salonName: orderCheck.salon?.name ?? "E-shop",
          cancelledBy: isSalonCancel ? "salon" : "admin",
          itemCount: orderCheck._count.items,
        }).catch(() => {});

        revalidateTag("badges", "max");
        revalidateTag("dashboard", "max");
        return NextResponse.json(order);
      }

      case "edit-item": {
        if (session.user.role !== "OWNER")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { orderItemId, newVariantId, newGrams } = body as {
          orderItemId: string;
          newVariantId: string;
          newGrams?: number;
        };

        if (!orderItemId || !newVariantId)
          return NextResponse.json({ error: "orderItemId and newVariantId required" }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
          const orderCheck = await tx.order.findUniqueOrThrow({
            where: { id },
            include: { items: true },
          });

          if (["COMPLETED", "CANCELLED", "REJECTED"].includes(orderCheck.status))
            throw new Error("Cannot edit items on a finalized order");

          const item = orderCheck.items.find((i) => i.id === orderItemId);
          if (!item) throw new Error("Order item not found");

          const newVariant = await tx.variant.findUniqueOrThrow({
            where: { id: newVariantId },
            include: { product: { select: { name: true } } },
          });

          const grams = newGrams ?? item.grams;
          const isByPiece = newVariant.sellingMode === "BY_PIECE";
          const pricePerUnit = isByPiece
            ? (newVariant.retailPricePerPiece ?? newVariant.pricePerPiece ?? 0)
            : newVariant.retailPricePerGram;
          const lineTotal = isByPiece
            ? pricePerUnit * item.pieces
            : pricePerUnit * grams;

          // Update the order item
          await tx.orderItem.update({
            where: { id: orderItemId },
            data: {
              variantId: newVariantId,
              grams,
              pricePerGram: pricePerUnit,
              lineTotal,
            },
          });

          // Update reservation if exists
          const reservation = await tx.reservation.findFirst({
            where: { orderId: id, variantId: item.variantId, active: true },
          });
          if (reservation) {
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { variantId: newVariantId, grams },
            });
          }

          // Recalculate order totals
          const allItems = await tx.orderItem.findMany({ where: { orderId: id } });
          const newEstimatedTotal = allItems.reduce((sum, i) => sum + i.lineTotal, 0);

          const shippingCost = orderCheck.shippingCost ?? 0;
          const promoDiscount = orderCheck.promoDiscount ?? 0;
          const cashSurcharge = orderCheck.paymentMethod === "CASH" ? 5000 : 0;
          const newTotalAmount = Math.max(0, newEstimatedTotal - promoDiscount) + shippingCost + cashSurcharge;

          await tx.order.update({
            where: { id },
            data: {
              estimatedTotal: Math.max(0, newEstimatedTotal - promoDiscount),
              totalAmount: newTotalAmount,
            },
          });

          return { variantName: newVariant.product.name, color: newVariant.color, lengthCm: newVariant.lengthCm };
        }, { timeout: 15000 });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "EDIT_ITEM",
          entity: "Order",
          entityId: id,
          detail: { orderItemId, newVariantId, newVariant: result },
          ipAddress: getClientIp(request),
        });

        // Reload and return full order
        const updated = await prisma.order.findUnique({
          where: { id },
          include: {
            salon: { select: { id: true, name: true, tier: true } },
            customer: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                variant: {
                  select: {
                    id: true, lengthCm: true, color: true,
                    product: { select: { name: true, nameUk: true, nameRu: true } },
                  },
                },
              },
            },
            sale: { select: { id: true, saleNumber: true } },
          },
        });

        return NextResponse.json(updated);
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
