import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/comgate";
import { createSaleFromOrder } from "@/lib/order-to-sale";
import { sendNotificationEmail } from "@/lib/email";
import { getRetailPaymentReceivedEmail } from "@/lib/email-templates";

/**
 * POST /api/admin/orders/check-payments
 * Checks ALL "AWAITING_PAYMENT" CARD orders against Comgate status API
 * and processes any that have been paid.
 */
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      paymentMethod: "CARD",
      comgateTransId: { not: null },
    },
    select: {
      id: true,
      orderNumber: true,
      comgateTransId: true,
      contactEmail: true,
      contactName: true,
      totalAmount: true,
      locale: true,
    },
  });

  if (orders.length === 0) {
    return NextResponse.json({ message: "No pending CARD orders found", checked: 0 });
  }

  const results: { orderNumber: string; transId: string; comgateStatus: string; action: string }[] = [];

  const systemUser = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true },
  });

  for (const order of orders) {
    const transId = order.comgateTransId!;
    try {
      const verified = await getPaymentStatus(transId);

      if (!verified.success) {
        results.push({
          orderNumber: order.orderNumber ?? order.id,
          transId,
          comgateStatus: "VERIFY_FAILED",
          action: `Error: ${verified.error}`,
        });
        continue;
      }

      if (verified.status === "PAID") {
        // Update order to PAID
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

        let saleAction = "order_marked_paid";

        // Create sale
        if (systemUser) {
          try {
            await createSaleFromOrder(order.id, systemUser.id);
            saleAction = "sale_created";
          } catch (e) {
            saleAction = `sale_failed: ${e instanceof Error ? e.message : String(e)}`;
          }
        }

        // Send email
        if (order.contactEmail) {
          try {
            const emailData = getRetailPaymentReceivedEmail(order.locale ?? "cs", {
              customerName: order.contactName ?? "",
              orderNumber: order.orderNumber ?? order.id,
              totalAmount: order.totalAmount ?? 0,
            });
            await sendNotificationEmail({
              to: order.contactEmail,
              subject: emailData.subject,
              body: emailData.text,
              html: emailData.html,
            });
          } catch {
            // email failed, not critical
          }
        }

        results.push({
          orderNumber: order.orderNumber ?? order.id,
          transId,
          comgateStatus: "PAID",
          action: saleAction,
        });
      } else if (verified.status === "CANCELLED") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        await prisma.reservation.updateMany({
          where: { orderId: order.id, active: true },
          data: { active: false },
        });
        results.push({
          orderNumber: order.orderNumber ?? order.id,
          transId,
          comgateStatus: "CANCELLED",
          action: "order_cancelled_reservations_released",
        });
      } else {
        results.push({
          orderNumber: order.orderNumber ?? order.id,
          transId,
          comgateStatus: verified.status ?? "UNKNOWN",
          action: "no_action",
        });
      }
    } catch (e) {
      results.push({
        orderNumber: order.orderNumber ?? order.id,
        transId,
        comgateStatus: "ERROR",
        action: `exception: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  revalidateTag("dashboard", "max");
  return NextResponse.json({ checked: results.length, results });
}
