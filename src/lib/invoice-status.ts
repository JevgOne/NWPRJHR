import { prisma } from "./db";

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
 */
export async function checkInvoicePaid(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  });

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

  if (totalPaid >= invoice.total) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
  } else if (totalPaid > 0) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "AWAITING" },
    });
  }
}
