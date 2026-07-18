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

  if (sale.paymentType !== "TRANSFER") {
    return NextResponse.json(
      { error: "Only TRANSFER sales can have payment confirmed" },
      { status: 400 }
    );
  }

  if (sale.invoice) {
    return NextResponse.json(
      { error: "Invoice already exists for this sale" },
      { status: 400 }
    );
  }

  // 1. Create invoice
  const invoice = await createInvoiceFromSale(sale.id, body.companyId);

  // 2. Mark invoice as PAID + record payment + add salon revenue
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

  // 3. Send invoice email + audit log (after response, but guaranteed to run on Vercel)
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
