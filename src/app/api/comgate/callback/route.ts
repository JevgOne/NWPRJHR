import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/comgate";
import { createSaleFromOrder } from "@/lib/order-to-sale";
import { sendNotificationEmail } from "@/lib/email";
import { getRetailPaymentReceivedEmail } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transId = formData.get("transId") as string;
    const status = formData.get("status") as string;
    const merchant = formData.get("merchant") as string;

    console.log("[comgate/callback] Received:", { transId, status, merchant });

    if (!transId || !status) {
      console.error("[comgate/callback] Missing params:", { transId, status });
      return new NextResponse("OK", { status: 200 });
    }

    const expectedMerchant = (process.env.COMGATE_MERCHANT || "").trim();
    if (expectedMerchant && merchant !== expectedMerchant) {
      console.error("[comgate/callback] Invalid merchant:", merchant, "expected:", expectedMerchant);
      return new NextResponse("OK", { status: 200 });
    }

    // CRITICAL: Never trust push notification — always verify via status API
    const verified = await getPaymentStatus(transId);

    if (!verified.success) {
      console.error("[comgate/callback] Status verify failed:", verified.error);
      return new NextResponse("OK", { status: 200 });
    }

    console.log("[comgate/callback] Verified status:", verified.status, "for transId:", transId);

    const payment = await prisma.payment.findFirst({
      where: { comgateTransId: transId },
      include: { invoice: true },
    });

    if (!payment) {
      // Fallback: check if this transId belongs to an e-shop Order
      let order = await prisma.order.findFirst({
        where: { comgateTransId: transId },
      });

      // Second fallback: find order by refId (orderNumber) from Comgate status
      if (!order && verified.refId) {
        order = await prisma.order.findFirst({
          where: { orderNumber: verified.refId },
        });
        if (order) {
          console.log("[comgate/callback] Found order by refId fallback:", order.id, "orderNumber:", verified.refId);
          // Save the transId we were missing
          if (!order.comgateTransId) {
            await prisma.order.update({
              where: { id: order.id },
              data: { comgateTransId: transId },
            });
          }
        }
      }

      if (!order) {
        // Check if this transId belongs to a QR Sale (unified payment flow)
        const sale = await prisma.sale.findFirst({
          where: { comgateTransId: transId },
        });

        if (sale) {
          if (verified.status === "PAID" && sale.status === "COMPLETED") {
            try {
              const { createInvoiceFromSale } = await import("@/lib/invoicing");
              const { sendInvoiceEmail } = await import("@/lib/invoice-email");
              const inv = await createInvoiceFromSale(sale.id);
              sendInvoiceEmail(inv.id).catch((e) =>
                console.error("[comgate/callback] Sale invoice email failed:", e)
              );
              revalidateTag("dashboard", "max");
            } catch (e) {
              console.error("[comgate/callback] Sale invoice creation failed:", e);
            }
          }
          return new NextResponse("OK", { status: 200 });
        }

        console.error("[comgate/callback] Payment/Order/Sale not found for transId:", transId);
        return new NextResponse("OK", { status: 200 });
      }

      console.log("[comgate/callback] Found order:", order.id, "status:", order.status);

      // Handle e-shop Order payment
      if (verified.status === "PAID" && order.status === "AWAITING_PAYMENT") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

        console.log("[comgate/callback] Order updated to PAID:", order.id);

        // Get system user (OWNER) for createSaleFromOrder
        const systemUser = await prisma.user.findFirst({
          where: { role: "OWNER" },
          select: { id: true },
        });

        if (!systemUser) {
          console.error("[comgate/callback] No OWNER user found — cannot create Sale for order", order.id);
          return new NextResponse("OK", { status: 200 });
        }

        try {
          await createSaleFromOrder(order.id, systemUser.id);
          console.log("[comgate/callback] Sale created for order:", order.id);
          revalidateTag("dashboard", "max");
        } catch (e) {
          console.error("[comgate/callback] createSaleFromOrder failed:", { orderId: order.id, error: e });
        }

        // Send payment received email
        if (order.contactEmail) {
          try {
            const updatedOrder = await prisma.order.findUnique({
              where: { id: order.id },
              select: { totalAmount: true, locale: true, contactName: true, orderNumber: true },
            });
            const emailData = getRetailPaymentReceivedEmail(updatedOrder?.locale ?? "cs", {
              customerName: updatedOrder?.contactName ?? "",
              orderNumber: updatedOrder?.orderNumber ?? order.id,
              totalAmount: updatedOrder?.totalAmount ?? 0,
            });
            sendNotificationEmail({
              to: order.contactEmail,
              subject: emailData.subject,
              body: emailData.text,
              html: emailData.html,
            }).catch((e) => console.error("[comgate/callback] Payment email failed:", e));
          } catch (e) {
            console.error("[comgate/callback] Payment email template error:", e);
          }
        }
      } else if (verified.status === "CANCELLED") {
        if (order.status === "AWAITING_PAYMENT") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
          // Release reservations
          await prisma.reservation.updateMany({
            where: { orderId: order.id, active: true },
            data: { active: false },
          });
          console.log("[comgate/callback] Order cancelled:", order.id);
        }
      }

      return new NextResponse("OK", { status: 200 });
    }

    if (verified.status === "PAID") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { matchedAt: new Date() },
      });

      if (payment.invoice && payment.invoice.status !== "PAID") {
        await prisma.invoice.update({
          where: { id: payment.invoice.id },
          data: {
            status: "PAID",
            note: `Zaplaceno online kartou (Comgate ${transId})`,
          },
        });

        // Notify owners
        const owners = await prisma.user.findMany({
          where: { role: "OWNER" },
          select: { id: true },
        });
        if (owners.length > 0) {
          await prisma.notification.createMany({
            data: owners.map((o) => ({
              recipientId: o.id,
              type: "INVOICE_PAID" as const,
              title: `Platba kartou přijata: ${payment.invoice!.number}`,
              message: `Faktura ${payment.invoice!.number} byla zaplacena online kartou (${(payment.amount / 100).toFixed(0)} CZK).`,
              data: JSON.stringify({
                invoiceId: payment.invoice!.id,
                transId,
              }),
            })),
          });
        }
      }
    } else if (verified.status === "CANCELLED") {
      console.log(`[comgate/callback] Payment ${transId} cancelled`);
    }

    // Return 200 OK — Comgate expects HTTP 2xx
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    // CRITICAL: Always return 200 to Comgate, even on errors
    // Otherwise Comgate keeps retrying and sends error emails
    console.error("[comgate/callback] UNHANDLED ERROR:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
