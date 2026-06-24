import { prisma } from "./db";
import type { InvoiceStatus } from "@prisma/client";

export interface Receivable {
  invoiceId: string;
  invoiceNumber: string;
  salonId: string | null;
  salonName: string | null;
  customerId: string | null;
  customerName: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  daysOverdue: number;
  status: InvoiceStatus;
}

/**
 * Get receivables overview: who owes, how much, how long.
 * Sorted by oldest unpaid first.
 */
export async function getReceivables(): Promise<{
  receivables: Receivable[];
  totalOwed: number;
  overdueCount: number;
  overdueAmount: number;
}> {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["ISSUED", "AWAITING", "OVERDUE"] },
      type: "INVOICE",
    },
    include: {
      payments: true,
      salon: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  let totalOwed = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  const receivables: Receivable[] = invoices.map((inv) => {
    const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = inv.total - paidAmount;
    const daysOverdue =
      inv.dueDate < now
        ? Math.floor(
            (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

    totalOwed += remainingAmount;
    if (daysOverdue > 0) {
      overdueCount++;
      overdueAmount += remainingAmount;
    }

    return {
      invoiceId: inv.id,
      invoiceNumber: inv.number,
      salonId: inv.salon?.id ?? null,
      salonName: inv.salon?.name ?? null,
      customerId: inv.customer?.id ?? null,
      customerName: inv.customer?.name ?? null,
      totalAmount: inv.total,
      paidAmount,
      remainingAmount,
      dueDate: inv.dueDate,
      daysOverdue,
      status: inv.status,
    };
  });

  return { receivables, totalOwed, overdueCount, overdueAmount };
}

export interface PaymentMorality {
  salonId: string;
  totalInvoices: number;
  paidOnTime: number;
  paidLate: number;
  currentlyOverdue: number;
  averageDaysLate: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  currentDebt: number;
}

/**
 * Calculate payment morality for a salon.
 */
export async function getPaymentMorality(
  salonId: string
): Promise<PaymentMorality> {
  const invoices = await prisma.invoice.findMany({
    where: {
      salonId,
      type: "INVOICE",
      status: { not: "CANCELLED" },
    },
    include: { payments: true },
  });

  let paidOnTime = 0;
  let paidLate = 0;
  let currentlyOverdue = 0;
  let totalDaysLate = 0;
  let lateCount = 0;
  let currentDebt = 0;

  for (const inv of invoices) {
    const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const isFullyPaid = totalPaid >= inv.total;

    if (isFullyPaid) {
      const lastPaymentDate = inv.payments.reduce(
        (latest, p) => (p.date > latest ? p.date : latest),
        new Date(0)
      );

      if (lastPaymentDate <= inv.dueDate) {
        paidOnTime++;
      } else {
        paidLate++;
        const daysLate = Math.floor(
          (lastPaymentDate.getTime() - inv.dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalDaysLate += daysLate;
        lateCount++;
      }
    } else {
      const remaining = inv.total - totalPaid;
      currentDebt += remaining;
      if (inv.dueDate < new Date()) {
        currentlyOverdue++;
      }
    }
  }

  const averageDaysLate =
    lateCount > 0 ? Math.round(totalDaysLate / lateCount) : 0;

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  const totalPaidInvoices = paidOnTime + paidLate;
  if (totalPaidInvoices > 0) {
    const lateRatio = paidLate / totalPaidInvoices;
    if (currentlyOverdue > 0 || lateRatio > 0.5) {
      riskLevel = "HIGH";
    } else if (lateRatio > 0.2 || averageDaysLate > 14) {
      riskLevel = "MEDIUM";
    }
  }

  return {
    salonId,
    totalInvoices: invoices.length,
    paidOnTime,
    paidLate,
    currentlyOverdue,
    averageDaysLate,
    riskLevel,
    currentDebt,
  };
}
