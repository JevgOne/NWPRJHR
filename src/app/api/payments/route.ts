import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentSchema } from "@/lib/validations/invoice";
import { checkInvoicePaidInTx } from "@/lib/invoice-status";
import { addSalonRevenueInTx } from "@/lib/loyalty";
import { createNotificationForRole, createSalonNotification } from "@/lib/notifications";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const invoiceId = searchParams.get("invoiceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (invoiceId) where.invoiceId = invoiceId;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: { select: { id: true, number: true, total: true, status: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: parsed.data.invoiceId,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        matchedVS: parsed.data.matchedVS,
        source: parsed.data.source,
        note: parsed.data.note,
      },
    });

    const wasPaid = await checkInvoicePaidInTx(parsed.data.invoiceId, tx);

    if (wasPaid) {
      const invoice = await tx.invoice.findUnique({
        where: { id: parsed.data.invoiceId },
        // invoice.subtotal = revenue before VAT (set from sale.totalBeforeVat in invoicing)
        select: { salonId: true, subtotal: true, type: true, number: true },
      });
      if (invoice?.salonId && invoice.type === "INVOICE") {
        await addSalonRevenueInTx(invoice.salonId, invoice.subtotal, tx);
      }
    }

    return { payment, wasPaid };
  }, { timeout: 10000 });

  // Notifications OUTSIDE transaction (non-critical, can fail independently)
  if (result.wasPaid) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parsed.data.invoiceId },
      select: { salonId: true, number: true },
    });
    if (invoice?.salonId) {
      await createNotificationForRole({
        role: "OWNER",
        type: "INCOMING_PAYMENT",
        title: "Platba přijata",
        message: `Přijata platba k faktuře ${invoice.number}`,
        data: { invoiceId: parsed.data.invoiceId, amount: parsed.data.amount, invoiceNumber: invoice.number },
        sendEmail: false,
      });
      await createSalonNotification({
        salonId: invoice.salonId,
        type: "INVOICE_PAID",
        data: { invoiceId: parsed.data.invoiceId, invoiceNumber: invoice.number },
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "PAYMENT_RECORDED",
    entity: "Payment",
    entityId: result.payment.id,
    detail: { invoiceId: parsed.data.invoiceId, amount: parsed.data.amount, wasPaid: result.wasPaid },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(result.payment, { status: 201 });
}
