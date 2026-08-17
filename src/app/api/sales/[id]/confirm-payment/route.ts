import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { logAudit, getClientIp } from "@/lib/audit";
import { addSalonRevenueInTx } from "@/lib/loyalty";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id },
    include: { invoice: true },
  });

  if (sale.paymentType !== "TRANSFER" && sale.paymentType !== "CARD" && sale.paymentType !== "CASH") {
    return NextResponse.json(
      { error: "Only TRANSFER, CARD, or CASH sales can have invoices created" },
      { status: 400 }
    );
  }

  // Action: mark_paid — mark existing invoice as paid (for TRANSFER 2-step flow)
  if (body.action === "mark_paid") {
    if (!sale.invoice)
      return NextResponse.json({ error: "Faktura neexistuje" }, { status: 400 });
    if (sale.invoice.status === "PAID")
      return NextResponse.json({ error: "Faktura je už zaplacená" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: sale.invoice!.id,
          amount: sale.invoice!.total,
          date: new Date(),
          matchedVS: sale.invoice!.variableSymbol,
          source: "MANUAL",
          note: "Platba potvrzena adminem",
        },
      });
      await tx.invoice.update({
        where: { id: sale.invoice!.id },
        data: { status: "PAID" },
      });
      if (sale.salonId && sale.invoice!.type === "INVOICE") {
        await addSalonRevenueInTx(sale.salonId, sale.invoice!.subtotal, tx);
      }
    });

    after(async () => {
      await logAudit({
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        action: "PAYMENT_CONFIRMED",
        entity: "Sale",
        entityId: id,
        detail: { invoiceId: sale.invoice!.id, invoiceNumber: sale.invoice!.number, amount: sale.invoice!.total },
        ipAddress: getClientIp(request),
      });
    });

    return NextResponse.json({ status: "PAID" });
  }

  // Default action: create invoice
  if (sale.invoice) {
    return NextResponse.json(
      { error: "Invoice already exists for this sale" },
      { status: 400 }
    );
  }

  let invoice;
  try {
    invoice = await createInvoiceFromSale(sale.id, body.companyId);
  } catch (e) {
    console.error("[ConfirmPayment] createInvoiceFromSale failed:", e);
    const msg = e instanceof Error ? e.message : "Invoice creation failed";
    return NextResponse.json({ error: `Faktura se nepodařila vytvořit: ${msg}` }, { status: 500 });
  }

  // For TRANSFER: just create invoice (AWAITING) + send email, do NOT mark PAID
  if (sale.paymentType === "TRANSFER") {
    after(async () => {
      await sendInvoiceEmail(invoice.id).catch((e) =>
        console.error("[ConfirmPayment] Invoice email failed:", e)
      );
      await logAudit({
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        action: "INVOICE_ISSUED",
        entity: "Sale",
        entityId: id,
        detail: { invoiceId: invoice.id, invoiceNumber: invoice.number, amount: invoice.total },
        ipAddress: getClientIp(request),
      });
    });

    return NextResponse.json({
      invoice: { id: invoice.id, number: invoice.number, status: "AWAITING" },
    });
  }

  // For CARD/CASH: create invoice + mark PAID + record payment (original behavior)
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        date: new Date(),
        matchedVS: invoice.variableSymbol,
        source: "MANUAL",
        note: "Platba potvrzena adminem",
      },
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID" },
    });

    if (sale.salonId && invoice.type === "INVOICE") {
      await addSalonRevenueInTx(sale.salonId, invoice.subtotal, tx);
    }
  });

  after(async () => {
    await sendInvoiceEmail(invoice.id, { skipQr: true }).catch((e) =>
      console.error("[ConfirmPayment] Invoice email failed:", e)
    );
    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "PAYMENT_CONFIRMED",
      entity: "Sale",
      entityId: id,
      detail: { invoiceId: invoice.id, invoiceNumber: invoice.number, amount: invoice.total },
      ipAddress: getClientIp(request),
    });
  });

  return NextResponse.json({
    invoice: { id: invoice.id, number: invoice.number },
    status: "PAID",
  });
}
