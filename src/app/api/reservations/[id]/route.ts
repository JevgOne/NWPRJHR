import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  markReservationPaid,
  completeReservation,
  cancelReservation,
} from "@/lib/reservations";
import { completeSale } from "@/lib/sales";
import { createInvoiceFromSale, createSettlementInvoice, createDepositCreditNote, createDepositInvoice } from "@/lib/invoicing";
import { createNotificationForRole, deleteNotificationsForEntity } from "@/lib/notifications";
import { logAudit, getClientIp } from "@/lib/audit";
import { revalidateTag } from "next/cache";
import { roundHalereUp } from "@/lib/rounding";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const reservation = await prisma.productReservation.findUnique({
    where: { id },
    include: {
      variant: {
        select: {
          id: true,
          lengthCm: true,
          color: true,
          sellingMode: true,
          product: {
            select: {
              id: true,
              name: true,
              nameUk: true,
              nameRu: true,
              category: true,
              texture: true,
              origin: true,
              photos: true,
              slug: true,
            },
          },
        },
      },
      salon: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      createdByUser: { select: { name: true, email: true } },
      invoices: {
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
          type: true,
          variableSymbol: true,
          payments: {
            select: { comgateTransId: true, matchedAt: true },
          },
        },
        orderBy: { issueDate: "asc" },
      },
    },
  });

  if (!reservation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") &&
    reservation.salonId !== session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(reservation);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string;

  try {
    switch (action) {
      case "mark_paid": {
        const reservation = await markReservationPaid(
          id,
          session.user.id,
          body.paymentNote
        );

        // Mark deposit invoice as paid if it exists
        await prisma.invoice.updateMany({
          where: { reservationId: id, type: "DEPOSIT", status: "AWAITING" },
          data: { status: "PAID" },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "MARK_PAID",
          entity: "ProductReservation",
          entityId: id,
          detail: { reservationNumber: reservation.reservationNumber },
          ipAddress: getClientIp(request),
        });

        createNotificationForRole({
          role: "OWNER",
          type: "RESERVATION_PAID",
          title: `Rezervace zaplacena: ${reservation.reservationNumber}`,
          message: `Rezervace ${reservation.reservationNumber} byla oznacena jako zaplacena.`,
          data: { reservationId: reservation.id },
        }).catch(() => {});

        return NextResponse.json(reservation);
      }

      case "complete": {
        const res = await prisma.productReservation.findUniqueOrThrow({
          where: { id },
        });

        if (res.status !== "PAID") {
          return NextResponse.json(
            { error: `Cannot complete — status is ${res.status}` },
            { status: 400 }
          );
        }

        // Create a sale from reservation
        const sale = await completeSale(
          {
            customerType: res.customerType,
            salonId: res.salonId ?? undefined,
            customerId: res.customerId ?? undefined,
            items: [
              {
                variantId: res.variantId,
                grams: res.grams,
                pieces: res.pieces,
              },
            ],
            note: `Reservation ${res.reservationNumber}`,
            paymentType: body.paymentType ?? "CASH",
            discount: res.discountPercent
              ? {
                  percent: res.discountPercent,
                  type: (res.discountType ?? "STANDARD") as "STANDARD" | "MARKETING" | "PERSONAL",
                  counterPerformanceNote: res.discountNote ?? undefined,
                }
              : undefined,
          },
          session.user.id
        );

        // Link sale to reservation
        await prisma.productReservation.update({
          where: { id },
          data: { saleId: sale.id },
        });

        // Complete reservation
        const reservation = await completeReservation(id);

        // Create invoice: settlement if deposit exists, otherwise regular
        let invoice = null;
        try {
          const hasDeposit = await prisma.invoice.findFirst({
            where: { reservationId: id, type: "DEPOSIT" },
          });
          if (hasDeposit) {
            const isPaidNow = sale.paymentType === "CASH" || sale.paymentType === "CARD";
            invoice = await createSettlementInvoice(id, sale.id, body.companyId, {
              paid: isPaidNow,
            });
          } else {
            invoice = await createInvoiceFromSale(sale.id, body.companyId);
          }
        } catch {
          // Invoice creation is optional
        }

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "COMPLETE",
          entity: "ProductReservation",
          entityId: id,
          detail: {
            reservationNumber: reservation.reservationNumber,
            saleId: sale.id,
            saleNumber: sale.saleNumber,
          },
          ipAddress: getClientIp(request),
        });

        revalidateTag("dashboard", { expire: 0 });
        return NextResponse.json({
          reservation,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
          invoice: invoice
            ? { id: invoice.id, number: invoice.number }
            : null,
        });
      }

      case "create_deposit": {
        // Create deposit invoice for existing reservation (if none exists)
        const existing = await prisma.invoice.findFirst({
          where: { reservationId: id, type: "DEPOSIT" },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Deposit invoice already exists", invoiceId: existing.id },
            { status: 400 }
          );
        }

        const depositInvoice = await createDepositInvoice(id);

        const resForDeposit = await prisma.productReservation.findUniqueOrThrow({
          where: { id },
          include: { salon: true, customer: true },
        });

        const depositEmail =
          resForDeposit.contactEmail ||
          resForDeposit.customer?.email ||
          resForDeposit.salon?.email;

        if (depositEmail && depositInvoice) {
          const { createPayment } = await import("@/lib/comgate");
          const comgateResult = await createPayment({
            price: depositInvoice.total,
            label: `Zaloha ${(resForDeposit.reservationNumber ?? "").slice(-8)}`.slice(0, 16),
            refId: depositInvoice.variableSymbol || depositInvoice.id.slice(-8),
            email: depositEmail,
            fullName: resForDeposit.contactName || "",
          });

          let comgateUrl: string | undefined;
          if (comgateResult.success && comgateResult.transId && comgateResult.redirect) {
            await prisma.payment.create({
              data: {
                invoiceId: depositInvoice.id,
                amount: depositInvoice.total,
                date: new Date(),
                matchedVS: depositInvoice.variableSymbol,
                source: "COMGATE",
                comgateTransId: comgateResult.transId,
                note: "Záloha - čeká na platbu",
              },
            });
            comgateUrl = comgateResult.redirect;
          }

          if (comgateUrl) {
            const { sendDepositEmail } = await import("@/lib/invoice-email");
            await sendDepositEmail({
              recipientEmail: depositEmail,
              recipientName: resForDeposit.contactName || resForDeposit.customer?.name || resForDeposit.salon?.name || "",
              amount: depositInvoice.total,
              comgateUrl,
              reservationNumber: resForDeposit.reservationNumber ?? "",
            });
          }
        }

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "CREATE_DEPOSIT",
          entity: "ProductReservation",
          entityId: id,
          detail: {
            reservationNumber: resForDeposit.reservationNumber,
            invoiceId: depositInvoice.id,
          },
          ipAddress: getClientIp(request),
        });

        return NextResponse.json({
          success: true,
          invoice: { id: depositInvoice.id, number: depositInvoice.number },
          emailSent: !!depositEmail,
        });
      }

      case "resend_deposit": {
        let depositInvoice = await prisma.invoice.findFirst({
          where: { reservationId: id, type: "DEPOSIT" },
        });
        if (!depositInvoice) {
          // Auto-create deposit invoice if it doesn't exist yet
          depositInvoice = await createDepositInvoice(id);
        }

        const res = await prisma.productReservation.findUniqueOrThrow({
          where: { id },
          include: { salon: true, customer: true },
        });

        const email = res.contactEmail || res.customer?.email || res.salon?.email;
        if (!email) {
          return NextResponse.json({ error: "No email address" }, { status: 400 });
        }

        const { createPayment } = await import("@/lib/comgate");
        const comgateResult = await createPayment({
          price: depositInvoice.total,
          label: `Zaloha ${(res.reservationNumber ?? "").slice(-8)}`.slice(0, 16),
          refId: depositInvoice.variableSymbol || depositInvoice.id.slice(-8),
          email,
          fullName: res.contactName || "",
        });

        let comgateUrl: string | undefined;
        if (comgateResult.success && comgateResult.transId && comgateResult.redirect) {
          await prisma.payment.create({
            data: {
              invoiceId: depositInvoice.id,
              amount: depositInvoice.total,
              date: new Date(),
              matchedVS: depositInvoice.variableSymbol,
              source: "COMGATE",
              comgateTransId: comgateResult.transId,
              note: "Záloha - opakovaný odkaz",
            },
          });
          comgateUrl = comgateResult.redirect;
        }

        if (comgateUrl) {
          const { sendDepositEmail } = await import("@/lib/invoice-email");
          await sendDepositEmail({
            recipientEmail: email,
            recipientName: res.contactName || res.customer?.name || res.salon?.name || "",
            amount: depositInvoice.total,
            comgateUrl,
            reservationNumber: res.reservationNumber ?? "",
          });
        }

        return NextResponse.json({ success: true });
      }

      case "send_balance": {
        const res = await prisma.productReservation.findUniqueOrThrow({
          where: { id },
          include: {
            salon: true,
            customer: true,
            variant: { include: { product: true } },
          },
        });

        if (res.status !== "PAID") {
          return NextResponse.json(
            { error: "Reservation must be PAID (deposit received)" },
            { status: 400 }
          );
        }

        const email = res.contactEmail || res.customer?.email || res.salon?.email;
        if (!email) {
          return NextResponse.json({ error: "No email address" }, { status: 400 });
        }

        // Calculate remaining balance
        const depositInvoices = await prisma.invoice.findMany({
          where: { reservationId: id, type: "DEPOSIT", status: { not: "CANCELLED" } },
        });
        const depositTotal = depositInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const remaining = res.lineTotal - depositTotal;

        if (remaining <= 0) {
          return NextResponse.json({ error: "Nothing to pay" }, { status: 400 });
        }

        // Create settlement invoice (AWAITING — waiting for payment)
        const { createBalanceInvoice } = await import("@/lib/invoicing");
        const settlementInvoice = await createBalanceInvoice(id, body.companyId);

        // Create Comgate payment
        const { createPayment } = await import("@/lib/comgate");
        const comgateResult = await createPayment({
          price: remaining,
          label: `Doplatek ${(res.reservationNumber ?? "").slice(-8)}`.slice(0, 16),
          refId: settlementInvoice.variableSymbol || `BAL-${id.slice(-8)}`,
          email,
          fullName: res.contactName || "",
        });

        let comgateUrl: string | undefined;
        if (comgateResult.success && comgateResult.transId && comgateResult.redirect) {
          await prisma.payment.create({
            data: {
              invoiceId: settlementInvoice.id,
              amount: remaining,
              date: new Date(),
              matchedVS: settlementInvoice.variableSymbol,
              source: "COMGATE",
              comgateTransId: comgateResult.transId,
              note: "Doplatek - čeká na platbu",
            },
          });
          comgateUrl = comgateResult.redirect;
        }

        // Send email with payment link
        if (comgateUrl) {
          const { sendBalanceEmail } = await import("@/lib/invoice-email");
          await sendBalanceEmail({
            recipientEmail: email,
            recipientName: res.contactName || res.customer?.name || res.salon?.name || "",
            amount: remaining,
            comgateUrl,
            reservationNumber: res.reservationNumber ?? "",
          });
        }

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "SEND_BALANCE",
          entity: "ProductReservation",
          entityId: id,
          detail: {
            reservationNumber: res.reservationNumber,
            invoiceId: settlementInvoice.id,
            amount: remaining,
          },
          ipAddress: getClientIp(request),
        });

        return NextResponse.json({
          success: true,
          invoice: { id: settlementInvoice.id, number: settlementInvoice.number },
          emailSent: !!comgateUrl,
        });
      }

      case "apply_discount": {
        const res = await prisma.productReservation.findUniqueOrThrow({
          where: { id },
          include: { variant: true },
        });

        if (res.status !== "PAID") {
          return NextResponse.json(
            { error: "Slevu lze uplatnit pouze u zaplacené zálohy (status PAID)" },
            { status: 400 }
          );
        }

        const discountPercent = Number(body.discountPercent);
        if (!discountPercent || discountPercent <= 0 || discountPercent > 10000) {
          return NextResponse.json(
            { error: "Neplatné procento slevy (1-100%)" },
            { status: 400 }
          );
        }

        const isByPiece = res.pieces > 0;
        const qty = isByPiece ? res.pieces : res.grams;
        const lineTotalBeforeDiscount = roundHalereUp(res.pricePerUnit * qty);
        const discountAmount = roundHalereUp((lineTotalBeforeDiscount * discountPercent) / 10000);
        const newLineTotal = roundHalereUp(lineTotalBeforeDiscount - discountAmount);

        // Cancel existing balance invoice (AWAITING/ISSUED) if any
        const existingBalanceInvoice = await prisma.invoice.findFirst({
          where: { reservationId: id, type: "INVOICE", status: { in: ["AWAITING", "ISSUED"] } },
        });
        if (existingBalanceInvoice) {
          await prisma.invoice.update({
            where: { id: existingBalanceInvoice.id },
            data: { status: "CANCELLED" },
          });
        }

        const updated = await prisma.productReservation.update({
          where: { id },
          data: {
            discountPercent,
            discountAmount,
            discountType: body.discountType ?? "STANDARD",
            discountNote: body.discountNote ?? null,
            lineTotal: newLineTotal,
          },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "APPLY_DISCOUNT",
          entity: "ProductReservation",
          entityId: id,
          detail: {
            reservationNumber: updated.reservationNumber,
            discountPercent,
            discountAmount,
            oldLineTotal: res.lineTotal,
            newLineTotal,
            cancelledInvoice: existingBalanceInvoice?.number ?? null,
          },
          ipAddress: getClientIp(request),
        });

        revalidateTag("dashboard", { expire: 0 });
        return NextResponse.json(updated);
      }

      case "cancel": {
        const reservation = await cancelReservation(id, body.reason);

        // Create credit note for deposit + Comgate refund if applicable
        try {
          // Find deposit invoice before creating credit note
          const depositInv = await prisma.invoice.findFirst({
            where: { reservationId: id, type: "DEPOSIT" },
            select: { id: true },
          });

          const creditNote = await createDepositCreditNote(id);
          if (creditNote) {
            console.log("[reservation/cancel] Credit note created:", creditNote.number);
          }

          if (depositInv) {
            const paidPayment = await prisma.payment.findFirst({
              where: {
                invoiceId: depositInv.id,
                source: "COMGATE",
                matchedAt: { not: null },
                comgateTransId: { not: null },
              },
            });
            if (paidPayment?.comgateTransId) {
              const { refundPayment } = await import("@/lib/comgate");
              const refundResult = await refundPayment(paidPayment.comgateTransId, paidPayment.amount);
              if (refundResult.success) {
                console.log("[reservation/cancel] Comgate refund OK:", paidPayment.comgateTransId);
              } else {
                console.error("[reservation/cancel] Comgate refund failed:", refundResult.error);
              }
            }
          }
        } catch (e) {
          console.error("[reservation/cancel] Credit note/refund error:", e);
        }

        // Clean up notifications for cancelled reservation
        deleteNotificationsForEntity("reservationId", id).catch(() => {});

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "CANCEL",
          entity: "ProductReservation",
          entityId: id,
          detail: {
            reservationNumber: reservation.reservationNumber,
            reason: body.reason,
          },
          ipAddress: getClientIp(request),
        });

        revalidateTag("dashboard", { expire: 0 });
        return NextResponse.json(reservation);
      }

      case "update": {
        const reservation = await prisma.productReservation.update({
          where: { id },
          data: {
            ...(body.note !== undefined && { note: body.note }),
            ...(body.internalNote !== undefined && {
              internalNote: body.internalNote,
            }),
            ...(body.paymentDueDate && {
              paymentDueDate: new Date(body.paymentDueDate),
            }),
            ...(body.paymentNote !== undefined && {
              paymentNote: body.paymentNote,
            }),
          },
        });

        logAudit({
          userId: session.user.id,
          userEmail: session.user.email ?? undefined,
          action: "UPDATE",
          entity: "ProductReservation",
          entityId: id,
          detail: { reservationNumber: reservation.reservationNumber },
          ipAddress: getClientIp(request),
        });

        return NextResponse.json(reservation);
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
