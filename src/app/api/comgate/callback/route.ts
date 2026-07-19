import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentStatus } from "@/lib/comgate";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const transId = formData.get("transId") as string;
  const status = formData.get("status") as string;
  const merchant = formData.get("merchant") as string;

  if (!transId || !status) {
    return new NextResponse("Missing params", { status: 400 });
  }

  if (merchant !== process.env.COMGATE_MERCHANT) {
    return new NextResponse("Invalid merchant", { status: 403 });
  }

  // CRITICAL: Never trust push notification — always verify via status API
  const verified = await getPaymentStatus(transId);

  if (!verified.success) {
    console.error("Comgate status verify failed:", verified.error);
    return new NextResponse("Verify failed", { status: 500 });
  }

  const payment = await prisma.payment.findFirst({
    where: { comgateTransId: transId },
    include: { invoice: true },
  });

  if (!payment) {
    console.error("Payment not found for transId:", transId);
    // Return 200 so Comgate doesn't retry (transaction doesn't exist in our system)
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
    console.log(`Comgate payment ${transId} cancelled`);
  }

  // Return 200 OK — Comgate expects HTTP 2xx
  return new NextResponse("OK", { status: 200 });
}
