import { prisma, type TransactionClient } from "./db";

/**
 * Check for overdue invoices and update their status.
 * Should be called periodically (cron or on-demand).
 */
export async function updateOverdueInvoices(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ["ISSUED", "AWAITING"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
  return result.count;
}

/**
 * After recording a payment, check if invoice is fully paid.
 * Returns true if the invoice just transitioned to PAID status.
 */
export async function checkInvoicePaid(invoiceId: string): Promise<boolean> {
  return checkInvoicePaidInTx(invoiceId, prisma);
}

/**
 * Transaction-aware variant of checkInvoicePaid.
 */
export async function checkInvoicePaidInTx(
  invoiceId: string,
  tx: TransactionClient
): Promise<boolean> {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  });

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= invoice.total) {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
    return invoice.status !== "PAID";
  } else if (totalPaid > 0) {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "AWAITING" },
    });
  }
  return false;
}
