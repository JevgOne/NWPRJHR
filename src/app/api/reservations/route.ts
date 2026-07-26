import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReservationSchema } from "@/lib/validations/reservation";
import { createProductReservation } from "@/lib/reservations";
import { createDepositInvoice } from "@/lib/invoicing";
import { createNotificationForRole } from "@/lib/notifications";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const salonId = sp.get("salonId");
  const customerId = sp.get("customerId");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "20"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (salonId) where.salonId = salonId;
  if (customerId) where.customerId = customerId;

  // SALON/HAIRDRESSER can only see their own
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
  }

  // Calendar view
  const view = sp.get("view");
  if (view === "calendar") {
    const from = sp.get("from");
    const to = sp.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "from and to required for calendar view" }, { status: 400 });
    }

    const calendarWhere = {
      ...where,
      paymentDueDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    };

    const reservations = await prisma.productReservation.findMany({
      where: calendarWhere,
      orderBy: { paymentDueDate: "asc" },
      select: {
        id: true,
        reservationNumber: true,
        status: true,
        paymentDueDate: true,
        lineTotal: true,
        grams: true,
        pieces: true,
        sellingMode: true,
        contactName: true,
        variant: {
          select: {
            color: true,
            lengthCm: true,
            product: { select: { name: true } },
          },
        },
        salon: { select: { name: true } },
        customer: { select: { name: true } },
        createdByUser: { select: { name: true } },
      },
    });

    return NextResponse.json({ data: reservations });
  }

  const [total, reservations] = await Promise.all([
    prisma.productReservation.count({ where }),
    prisma.productReservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        variant: {
          select: {
            lengthCm: true,
            color: true,
            sellingMode: true,
            product: { select: { name: true } },
          },
        },
        salon: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: reservations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  try {
    const reservation = await createProductReservation(parsed.data, session.user.id);

    // Create deposit invoice if requested + Comgate payment + email
    let depositInvoice = null;
    if (parsed.data.sendDepositInvoice) {
      try {
        depositInvoice = await createDepositInvoice(reservation.id);

        const contactEmail = parsed.data.contactEmail
          || (reservation.customerId
            ? (await prisma.customer.findUnique({ where: { id: reservation.customerId }, select: { email: true } }))?.email
            : null)
          || (reservation.salonId
            ? (await prisma.salon.findUnique({ where: { id: reservation.salonId }, select: { email: true } }))?.email
            : null);

        if (contactEmail && depositInvoice) {
          const { createPayment } = await import("@/lib/comgate");
          const comgateResult = await createPayment({
            price: depositInvoice.total,
            label: `Zaloha ${(reservation.reservationNumber ?? "").slice(-8)}`.slice(0, 16),
            refId: depositInvoice.variableSymbol || depositInvoice.id.slice(-8),
            email: contactEmail,
            fullName: parsed.data.contactName || "",
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

          const company = await prisma.company.findFirstOrThrow({ where: { isDefault: true } });
          const { sendPaymentDetailsEmail } = await import("@/lib/invoice-email");
          sendPaymentDetailsEmail({
            recipientEmail: contactEmail,
            recipientName: parsed.data.contactName || "",
            lang: "cs",
            amount: depositInvoice.total,
            bankAccount: company.bankAccount,
            iban: company.bankIban ?? "",
            variableSymbol: depositInvoice.variableSymbol,
            saleNumber: reservation.reservationNumber ?? "",
            comgateUrl,
          }).catch((e) => console.error("[reservation] Deposit email failed:", e));
        }
      } catch (e) {
        console.error("[reservation] Deposit flow error:", e);
        // Deposit flow is optional — don't fail the reservation
      }
    }

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "CREATE",
      entity: "ProductReservation",
      entityId: reservation.id,
      detail: {
        reservationNumber: reservation.reservationNumber,
        variantId: parsed.data.variantId,
        lineTotal: reservation.lineTotal,
        depositInvoice: depositInvoice ? depositInvoice.number : null,
      },
      ipAddress: getClientIp(request),
    });

    createNotificationForRole({
      role: "OWNER",
      type: "RESERVATION_CREATED",
      title: `Nova rezervace: ${reservation.reservationNumber}`,
      message: `Vytvorena rezervace za ${(reservation.lineTotal / 100).toFixed(0)} CZK, splatnost ${reservation.paymentDueDate.toLocaleDateString("cs-CZ")}.${depositInvoice ? ` Zálohová faktura: ${depositInvoice.number}` : ""}`,
      data: { reservationId: reservation.id, reservationNumber: reservation.reservationNumber },
    }).catch(() => {});

    return NextResponse.json({ ...reservation, depositInvoice: depositInvoice ? { id: depositInvoice.id, number: depositInvoice.number } : null }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reservation creation failed" },
      { status: 500 }
    );
  }
}
