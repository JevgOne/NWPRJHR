import type { PrismaClient } from "@prisma/client";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

interface InvoiceCounterRow {
  id: string;
  year: number;
  lastNumber: number;
}

/**
 * Generate next invoice number atomically.
 * Format: RRRR-NNNN (e.g. "2026-0001")
 * Yearly reset: new year starts from 0001.
 * Concurrency-safe: runs inside a Prisma interactive transaction.
 *
 * MUST be called inside a Prisma transaction.
 */
export async function getNextInvoiceNumber(
  tx: TransactionClient
): Promise<{ number: string; variableSymbol: string }> {
  const currentYear = new Date().getFullYear();

  const counters = await tx.$queryRaw<InvoiceCounterRow[]>`
    SELECT * FROM "invoice_counters"
    WHERE "year" = ${currentYear}
  `;

  let nextNumber: number;

  if (counters.length === 0) {
    nextNumber = 1;
    await tx.invoiceCounter.create({
      data: { year: currentYear, lastNumber: 1 },
    });
  } else {
    nextNumber = counters[0].lastNumber + 1;
    await tx.invoiceCounter.update({
      where: { year: currentYear },
      data: { lastNumber: nextNumber },
    });
  }

  const number = `${currentYear}-${String(nextNumber).padStart(4, "0")}`;
  const variableSymbol = `${currentYear}${String(nextNumber).padStart(4, "0")}`;

  return { number, variableSymbol };
}
