import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPayment } from "@/lib/comgate";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { invoiceId } = await request.json();

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      sale: { include: { customer: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "PAID") {
    return NextResponse.json(
      { error: "Invoice already paid" },
      { status: 400 }
    );
  }

  const customerEmail =
    invoice.sale?.customer?.email || invoice.buyerEmail || "";
  const customerName = invoice.buyerName || "";

  const result = await createPayment({
    price: invoice.total,
    label: `Hairland #${invoice.variableSymbol || invoice.number}`.slice(0, 16),
    refId: invoice.variableSymbol || invoice.id.slice(-8),
    email: customerEmail,
    fullName: customerName,
  });

  if (result.success && result.transId && result.redirect) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        date: new Date(),
        matchedVS: invoice.variableSymbol || null,
        source: "COMGATE",
        comgateTransId: result.transId,
        note: "Comgate platba - čeká na potvrzení",
      },
    });

    return NextResponse.json({
      success: true,
      transId: result.transId,
      redirect: result.redirect,
    });
  }

  return NextResponse.json(
    { error: result.error || "Comgate API error" },
    { status: 500 }
  );
}
