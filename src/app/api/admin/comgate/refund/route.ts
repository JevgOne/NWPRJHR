import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refundPayment } from "@/lib/comgate";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { transId, amount } = await request.json();

  if (!transId) {
    return NextResponse.json({ error: "transId required" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { comgateTransId: transId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const refundAmount = amount || payment.amount;

  const result = await refundPayment(transId, refundAmount);

  if (result.success) {
    if (payment.invoiceId) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: "CANCELLED",
          note: `Refund ${(refundAmount / 100).toFixed(0)} CZK (Comgate ${transId})`,
        },
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: result.error || "Refund failed" },
    { status: 500 }
  );
}
