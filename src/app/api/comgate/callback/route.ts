import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/comgate";
import { createSaleFromOrder } from "@/lib/order-to-sale";
import { sendNotificationEmail } from "@/lib/email";
import { getOrderConfirmationEmail } from "@/lib/email-templates";
import { loadEmailAttachments } from "@/lib/email-attachments";

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

    const expectedMerchant = (process.env.COMGATE_MERCHANT || "").replace(/\s+/g, "");
    if (expectedMerchant && merchant?.replace(/\s+/g, "") !== expectedMerchant) {
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
      include: {
        invoice: {
          select: {
            id: true, status: true, number: true,
            type: true, reservationId: true,
          },
        },
      },
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
              revalidateTag("dashboard", { expire: 0 });
            } catch (e) {
              console.error("[comgate/callback] Sale invoice creation failed:", e);
            }

            // Send Email 1 (legal confirmation) for admin CARD sales
            try {
              const saleForEmail = await prisma.sale.findUnique({
                where: { id: sale.id },
                select: {
                  saleNumber: true,
                  totalAmount: true,
                  subtotal: true,
                  shippingCost: true,
                  customerType: true,
                  salon: { select: { email: true, name: true, language: true } },
                  customer: { select: { email: true, name: true } },
                  items: {
                    select: {
                      grams: true,
                      pieces: true,
                      lineTotal: true,
                      variant: {
                        select: {
                          lengthCm: true,
                          color: true,
                          product: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              });

              if (saleForEmail) {
                const recipientEmail = saleForEmail.customerType === "SALON"
                  ? saleForEmail.salon?.email
                  : saleForEmail.customer?.email;

                if (recipientEmail) {
                  const recipientName = saleForEmail.customerType === "SALON"
                    ? saleForEmail.salon?.name ?? ""
                    : saleForEmail.customer?.name ?? "";
                  const lang = saleForEmail.customerType === "SALON"
                    ? saleForEmail.salon?.language ?? "cs"
                    : "cs";
                  const isB2B = saleForEmail.customerType === "SALON";

                  const emailData = getOrderConfirmationEmail(lang, {
                    customerName: recipientName,
                    orderNumber: saleForEmail.saleNumber ?? "",
                    items: saleForEmail.items.map((i) => ({
                      productName: i.variant.product.name,
                      lengthCm: i.variant.lengthCm,
                      color: i.variant.color,
                      grams: i.grams,
                      pieces: i.pieces,
                      lineTotal: i.lineTotal,
                    })),
                    subtotal: saleForEmail.subtotal,
                    shippingCost: saleForEmail.shippingCost,
                    totalAmount: saleForEmail.totalAmount,
                    paymentMethod: "CARD",
                    isB2B,
                    isPersonalSale: false,
                    careGuideUrl: `https://www.hairland.cz/${lang}/pece-o-vlasy`,
                  });

                  const attachments = await loadEmailAttachments(isB2B);

                  sendNotificationEmail({
                    to: recipientEmail,
                    toName: recipientName,
                    subject: emailData.subject,
                    body: emailData.text,
                    html: emailData.html,
                    attachments,
                  }).catch((e) => console.error("[comgate/callback] Sale Email 1 failed:", e));
                }
              }
            } catch (e) {
              console.error("[comgate/callback] Sale Email 1 error:", e);
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
          revalidateTag("dashboard", { expire: 0 });
        } catch (e) {
          console.error("[comgate/callback] createSaleFromOrder failed:", { orderId: order.id, error: e });
        }

        // Send Email 1 (order confirmation with legal blocks + PDF attachments)
        if (order.contactEmail) {
          try {
            const updatedOrder = await prisma.order.findUnique({
              where: { id: order.id },
              select: {
                totalAmount: true,
                shippingCost: true,
                locale: true,
                contactName: true,
                orderNumber: true,
                billingIco: true,
                promoCode: true,
                promoDiscount: true,
                items: {
                  select: {
                    productName: true,
                    lengthCm: true,
                    color: true,
                    grams: true,
                    pieces: true,
                    lineTotal: true,
                  },
                },
              },
            });

            if (updatedOrder) {
              const isB2B = Boolean(updatedOrder.billingIco);
              const locale = updatedOrder.locale ?? "cs";

              const emailData = getOrderConfirmationEmail(locale, {
                customerName: updatedOrder.contactName ?? "",
                orderNumber: updatedOrder.orderNumber ?? order.id,
                items: (updatedOrder.items ?? []).map((i) => ({
                  productName: i.productName ?? "",
                  lengthCm: i.lengthCm ?? 0,
                  color: i.color ?? "",
                  grams: i.grams,
                  pieces: i.pieces,
                  lineTotal: i.lineTotal,
                })),
                subtotal: (updatedOrder.totalAmount ?? 0) - (updatedOrder.shippingCost ?? 0) + (updatedOrder.promoDiscount ?? 0),
                shippingCost: updatedOrder.shippingCost ?? 0,
                promoCode: updatedOrder.promoCode ?? undefined,
                promoDiscount: updatedOrder.promoDiscount ?? undefined,
                totalAmount: updatedOrder.totalAmount ?? 0,
                paymentMethod: "CARD",
                isB2B,
                careGuideUrl: `https://www.hairland.cz/${locale}/pece-o-vlasy`,
              });

              const attachments = await loadEmailAttachments(isB2B);

              sendNotificationEmail({
                to: order.contactEmail,
                toName: updatedOrder.contactName ?? undefined,
                subject: emailData.subject,
                body: emailData.text,
                html: emailData.html,
                attachments,
              }).catch((e) => console.error("[comgate/callback] Email 1 failed:", e));
            }
          } catch (e) {
            console.error("[comgate/callback] Email 1 error:", e);
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

        // If deposit invoice for a reservation, auto mark reservation as paid
        if (payment.invoice.type === "DEPOSIT" && payment.invoice.reservationId) {
          try {
            const { markReservationPaid } = await import("@/lib/reservations");
            await markReservationPaid(
              payment.invoice.reservationId,
              "system",
              `Zaplaceno online kartou (Comgate ${transId})`
            );
            console.log("[comgate/callback] Reservation marked as paid:", payment.invoice.reservationId);
          } catch (e) {
            console.error("[comgate/callback] markReservationPaid failed:", e);
          }
        }

        // If settlement invoice for a reservation (balance payment), auto-complete reservation
        if (payment.invoice.type === "INVOICE" && payment.invoice.reservationId) {
          try {
            const reservation = await prisma.productReservation.findUnique({
              where: { id: payment.invoice.reservationId },
            });

            if (reservation && reservation.status === "PAID") {
              const systemUser = await prisma.user.findFirst({
                where: { role: "OWNER" },
                select: { id: true },
              });

              if (systemUser) {
                const { completeSale } = await import("@/lib/sales");
                const { completeReservation } = await import("@/lib/reservations");

                const sale = await completeSale(
                  {
                    customerType: reservation.customerType,
                    salonId: reservation.salonId ?? undefined,
                    customerId: reservation.customerId ?? undefined,
                    items: [{
                      variantId: reservation.variantId,
                      grams: reservation.grams,
                      pieces: reservation.pieces,
                    }],
                    note: `Reservation ${reservation.reservationNumber} — online balance payment`,
                    paymentType: "CARD",
                    discount: reservation.discountPercent
                      ? {
                          percent: reservation.discountPercent,
                          type: (reservation.discountType ?? "STANDARD") as "STANDARD" | "MARKETING" | "PERSONAL",
                          counterPerformanceNote: reservation.discountNote ?? undefined,
                        }
                      : undefined,
                  },
                  systemUser.id
                );

                // Link sale to reservation and invoice
                await prisma.productReservation.update({
                  where: { id: reservation.id },
                  data: { saleId: sale.id },
                });
                await prisma.invoice.update({
                  where: { id: payment.invoice.id },
                  data: { saleId: sale.id },
                });

                // Complete reservation
                await completeReservation(reservation.id);

                // Send invoice email
                const { sendInvoiceEmail } = await import("@/lib/invoice-email");
                sendInvoiceEmail(payment.invoice.id).catch((e) =>
                  console.error("[comgate/callback] Balance invoice email failed:", e)
                );

                console.log("[comgate/callback] Balance payment completed for reservation:", reservation.id, "sale:", sale.id);
                revalidateTag("dashboard", { expire: 0 });
              }
            }
          } catch (e) {
            console.error("[comgate/callback] Balance completion failed:", e);
          }
        }

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
