import type { PrismaClient } from "@prisma/client";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

interface InvoiceCounterRow {
  id: string;
  year: number;
  prefix: string;
  lastNumber: number;
}

/**
 * Invoice number prefixes by payment type:
 * - "H" = Hotovost (cash)
 * - "F" = Faktura (card / transfer / default)
 */
export type InvoicePrefix = "H" | "F";

/**
 * Generate next invoice number atomically.
 * Format: P-RRRR-NNNN (e.g. "F-2026-0001" for card/transfer, "H-2026-0001" for cash)
 * Yearly reset: new year starts from 0001.
 * Concurrency-safe: runs inside a Prisma interactive transaction.
 *
 * MUST be called inside a Prisma transaction.
 */
export async function getNextInvoiceNumber(
  tx: TransactionClient,
  prefix: InvoicePrefix = "F"
): Promise<{ number: string; variableSymbol: string }> {
  const currentYear = new Date().getFullYear();

  const counters = await tx.$queryRaw<InvoiceCounterRow[]>`
    SELECT * FROM "invoice_counters"
    WHERE "year" = ${currentYear} AND "prefix" = ${prefix}
  `;

  let nextNumber: number;

  if (counters.length === 0) {
    nextNumber = 1;
    await tx.invoiceCounter.create({
      data: { year: currentYear, prefix, lastNumber: 1 },
    });
  } else {
    nextNumber = counters[0].lastNumber + 1;
    await tx.invoiceCounter.update({
      where: { year_prefix: { year: currentYear, prefix } },
      data: { lastNumber: nextNumber },
    });
  }

  const number = `${prefix}${currentYear}-${String(nextNumber).padStart(4, "0")}`;
  const variableSymbol = `${currentYear}${String(nextNumber).padStart(4, "0")}`;

  return { number, variableSymbol };
}
