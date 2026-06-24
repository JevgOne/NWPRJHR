import type { TransactionClient } from "./db";
import type { CreditNoteItem } from "./invoicing";

/**
 * Shared transaction-aware credit note creation.
 * Used by returns.ts and complaints.ts.
 */
export async function createCreditNoteInTx(
  originalInvoiceId: string,
  returnItems: CreditNoteItem[],
  reason: string,
  tx: TransactionClient
) {
  const { getNextInvoiceNumber } = await import("./invoice-number");
  const { roundHalereUp } = await import("./rounding");

  const original = await tx.invoice.findUniqueOrThrow({
    where: { id: originalInvoiceId },
    include: { company: true },
  });

  const { number, variableSymbol } = await getNextInvoiceNumber(tx);

  const itemsTotal = returnItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = -itemsTotal;
  const vatAmount = -roundHalereUp((itemsTotal * original.vatRate) / 10000);
  const rawTotal = subtotal + vatAmount;
  const total = -roundHalereUp(-rawTotal);

  return tx.invoice.create({
    data: {
      type: "CREDIT_NOTE",
      number,
      companyId: original.companyId,
      salonId: original.salonId,
      customerId: original.customerId,
      buyerName: original.buyerName,
      buyerIco: original.buyerIco,
      buyerDic: original.buyerDic,
      buyerAddress: original.buyerAddress,
      buyerEmail: original.buyerEmail,
      buyerLanguage: original.buyerLanguage,
      originalInvoiceId,
      issueDate: new Date(),
      dueDate: new Date(),
      variableSymbol,
      subtotal,
      vatRate: original.vatRate,
      vatAmount,
      total,
      status: "ISSUED",
      note: reason,
      items: {
        create: returnItems.map((item) => ({
          description: item.description,
          quantity: -item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          lineTotal: -item.lineTotal,
          vatRate: original.vatRate,
        })),
      },
    },
  });
}
