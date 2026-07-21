import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  markReservationPaid,
  completeReservation,
  cancelReservation,
} from "@/lib/reservations";
import { completeSale } from "@/lib/sales";
import { createInvoiceFromSale, createSettlementInvoice, createDepositCreditNote } from "@/lib/invoicing";
import { createNotificationForRole, deleteNotificationsForEntity } from "@/lib/notifications";
import { logAudit, getClientIp } from "@/lib/audit";

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
          product: { select: { name: true, nameUk: true, nameRu: true } },
        },
      },
      salon: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      createdByUser: { select: { name: true, email: true } },
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
            invoice = await createSettlementInvoice(id, sale.id, body.companyId);
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

        return NextResponse.json({
          reservation,
          sale: { id: sale.id, saleNumber: sale.saleNumber },
          invoice: invoice
            ? { id: invoice.id, number: invoice.number }
            : null,
        });
      }

      case "cancel": {
        const reservation = await cancelReservation(id, body.reason);

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
