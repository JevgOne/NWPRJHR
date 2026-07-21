import type { Sale, SaleItem, Variant, Product, Salon, Customer, Invoice } from "@prisma/client";
import { prisma } from "./db";
import { getNextInvoiceNumber, type InvoicePrefix } from "./invoice-number";
import { roundHalereUp } from "./rounding";
import { getInvoiceTranslations } from "./invoice-translations";
import { generateSku } from "./sku";

type SaleWithRelations = Sale & {
  items: (SaleItem & { variant: Variant & { product: Product } })[];
  salon: Salon | null;
  customer: Customer | null;
};

function formatItemDescription(
  product: Product,
  variant: Variant,
  lang: string
): string {
  const name =
    lang === "uk"
      ? product.nameUk || product.name
      : lang === "ru"
      ? product.nameRu || product.name
      : product.name;

  const sku = generateSku(product.category, product.texture, variant.color, variant.lengthCm);
  return `${name}, ${variant.lengthCm}cm, ${variant.color} (${sku})`;
}

/**
 * Create an invoice from a completed sale.
 * Runs in transaction with atomic numbering.
 * If proforma is true (or paymentType is TRANSFER), creates an AWAITING invoice with dueDate +7 days.
 */
export async function createInvoiceFromSale(
  saleId: string,
  companyId?: string,
  options?: { proforma?: boolean }
): Promise<Invoice> {
  return prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findUniqueOrThrow({
        where: { id: saleId },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          salon: true,
          customer: true,
        },
      }) as SaleWithRelations;

      // Check no invoice already exists for this sale
      const existing = await tx.invoice.findUnique({
        where: { saleId },
      });
      if (existing) {
        throw new Error("Invoice already exists for this sale");
      }

      const company = companyId
        ? await tx.company.findUniqueOrThrow({ where: { id: companyId } })
        : await tx.company.findFirstOrThrow({ where: { isDefault: true } });

      const invoicePrefix: InvoicePrefix = sale.paymentType === "CASH" ? "H" : "F";
      const { number, variableSymbol } = await getNextInvoiceNumber(tx, invoicePrefix);

      const buyer =
        sale.customerType === "SALON" && sale.salon
          ? {
              buyerName: sale.salon.name,
              buyerIco: sale.salon.ico,
              buyerDic: sale.salon.dic,
              buyerAddress: sale.salon.city ?? "",
              buyerEmail: sale.salon.email,
              buyerLanguage: sale.salon.language ?? "cs",
            }
          : {
              buyerName: sale.customer?.name ?? "",
              buyerIco: null as string | null,
              buyerDic: null as string | null,
              buyerAddress: sale.customer?.city ?? "",
              buyerEmail: sale.customer?.email ?? null,
              buyerLanguage: "cs",
            };

      const lang = buyer.buyerLanguage;
      const t = getInvoiceTranslations(lang);

      const invoiceItems = sale.items.map((item) => {
        const description = formatItemDescription(
          item.variant.product,
          item.variant,
          lang
        );
        const isPiece = item.pieces > 0;
        const qty = isPiece ? item.pieces : item.grams;

        return {
          description,
          quantity: qty,
          unit: isPiece ? t.piece : t.gram,
          pricePerUnit: qty > 0 ? Math.round(item.lineTotal / qty) : 0,
          lineTotal: item.lineTotal,
          vatRate: 0,
        };
      });

      const subtotal = sale.totalBeforeVat;
      const vatAmount = 0;
      const rawTotal = subtotal;
      const roundedTotal = roundHalereUp(rawTotal);
      const roundingAmount = roundedTotal - rawTotal;

      const isProforma = options?.proforma ?? (sale.paymentType === "TRANSFER" || sale.paymentType === "CARD");
      const dueDate = isProforma
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date();

      // Payment method note
      const paymentNote = isProforma
        ? null
        : sale.paymentType === "CASH"
        ? "Zaplaceno hotove"
        : sale.paymentType === "TRANSFER"
        ? "Zaplaceno prevodem"
        : null;

      const invoice = await tx.invoice.create({
        data: {
          type: "INVOICE",
          number,
          companyId: company.id,
          salonId: sale.salonId,
          customerId: sale.customerId,
          ...buyer,
          saleId: sale.id,
          issueDate: new Date(),
          dueDate,
          taxDate: new Date(),
          variableSymbol,
          subtotal,
          vatRate: 0,
          vatAmount,
          total: roundedTotal,
          roundingAmount,
          status: isProforma ? "AWAITING" : "PAID",
          note: paymentNote,
          items: {
            create: invoiceItems,
          },
        },
      });

      return invoice;
    },
    { timeout: 15000 }
  );
}

/**
 * Create an internal document (interní doklad) for PROMO / WRITEOFF sales.
 * Zero-total invoice used for accounting purposes.
 */
export async function createInternalDocument(
  saleId: string,
  reason: "PROMO" | "WRITEOFF",
  companyId?: string
): Promise<Invoice> {
  return prisma.$transaction(
    async (tx) => {
      const sale = await tx.sale.findUniqueOrThrow({
        where: { id: saleId },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          salon: true,
          customer: true,
        },
      }) as SaleWithRelations;

      const existing = await tx.invoice.findUnique({
        where: { saleId },
      });
      if (existing) {
        throw new Error("Document already exists for this sale");
      }

      const company = companyId
        ? await tx.company.findUniqueOrThrow({ where: { id: companyId } })
        : await tx.company.findFirstOrThrow({ where: { isDefault: true } });

      const { number, variableSymbol } = await getNextInvoiceNumber(tx, "F");

      const buyer =
        sale.customerType === "SALON" && sale.salon
          ? {
              buyerName: sale.salon.name,
              buyerIco: sale.salon.ico,
              buyerDic: sale.salon.dic,
              buyerAddress: sale.salon.city ?? "",
              buyerEmail: sale.salon.email,
              buyerLanguage: sale.salon.language ?? "cs",
            }
          : {
              buyerName: sale.customer?.name ?? "Interní",
              buyerIco: null as string | null,
              buyerDic: null as string | null,
              buyerAddress: sale.customer?.city ?? "",
              buyerEmail: sale.customer?.email ?? null,
              buyerLanguage: "cs",
            };

      const lang = buyer.buyerLanguage;
      const t = getInvoiceTranslations(lang);

      const reasonLabel = reason === "PROMO" ? "Promo" : "Odpis";

      const invoiceItems = sale.items.map((item) => {
        const description = formatItemDescription(
          item.variant.product,
          item.variant,
          lang
        );
        const isPiece = item.pieces > 0;

        return {
          description: `${description} (${reasonLabel})`,
          quantity: isPiece ? item.pieces : item.grams,
          unit: isPiece ? t.piece : t.gram,
          pricePerUnit: 0,
          lineTotal: 0,
          vatRate: 0,
        };
      });

      const invoice = await tx.invoice.create({
        data: {
          type: "CREDIT_NOTE",
          number,
          companyId: company.id,
          salonId: sale.salonId,
          customerId: sale.customerId,
          ...buyer,
          saleId: sale.id,
          issueDate: new Date(),
          dueDate: new Date(),
          variableSymbol,
          subtotal: 0,
          vatRate: 0,
          vatAmount: 0,
          total: 0,
          status: "PAID",
          note: `Interní doklad — ${reasonLabel}`,
          items: {
            create: invoiceItems,
          },
        },
      });

      return invoice;
    },
    { timeout: 15000 }
  );
}

/**
 * Create a deposit invoice (zálohová faktura) for 50% of reservation total.
 */
export async function createDepositInvoice(
  reservationId: string,
  companyId?: string
): Promise<Invoice> {
  return prisma.$transaction(
    async (tx) => {
      const reservation = await tx.productReservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: {
          variant: { include: { product: true } },
          salon: true,
          customer: true,
        },
      });

      // Check no deposit invoice already exists for this reservation
      const existing = await tx.invoice.findFirst({
        where: { reservationId, type: "DEPOSIT" },
      });
      if (existing) {
        throw new Error("Deposit invoice already exists for this reservation");
      }

      const company = companyId
        ? await tx.company.findUniqueOrThrow({ where: { id: companyId } })
        : await tx.company.findFirstOrThrow({ where: { isDefault: true } });

      const { number, variableSymbol } = await getNextInvoiceNumber(tx, "F");

      const buyer =
        reservation.customerType === "SALON" && reservation.salon
          ? {
              buyerName: reservation.salon.name,
              buyerIco: reservation.salon.ico,
              buyerDic: reservation.salon.dic,
              buyerAddress: reservation.salon.city ?? "",
              buyerEmail: reservation.salon.email,
              buyerLanguage: reservation.salon.language ?? "cs",
            }
          : {
              buyerName: reservation.customer?.name ?? reservation.contactName ?? "",
              buyerIco: null as string | null,
              buyerDic: null as string | null,
              buyerAddress: reservation.customer?.city ?? "",
              buyerEmail: reservation.customer?.email ?? reservation.contactEmail ?? null,
              buyerLanguage: "cs",
            };

      const lang = buyer.buyerLanguage;
      const t = getInvoiceTranslations(lang);

      const depositAmount = roundHalereUp(reservation.lineTotal / 2);
      const vatRate = 0;
      const vatAmount = 0;
      const subtotal = depositAmount;

      const description = formatItemDescription(
        reservation.variant.product,
        reservation.variant,
        lang
      );

      const isPiece = reservation.pieces > 0;
      const qty = isPiece ? reservation.pieces : reservation.grams;

      const invoice = await tx.invoice.create({
        data: {
          type: "DEPOSIT",
          number,
          companyId: company.id,
          salonId: reservation.salonId,
          customerId: reservation.customerId,
          ...buyer,
          reservationId,
          issueDate: new Date(),
          dueDate: reservation.paymentDueDate,
          taxDate: new Date(),
          variableSymbol,
          subtotal,
          vatRate,
          vatAmount,
          total: depositAmount,
          roundingAmount: 0,
          status: "AWAITING",
          note: `Záloha 50 % – rezervace ${reservation.reservationNumber}`,
          items: {
            create: [
              {
                description: `${lang === "cs" ? "Záloha" : "Deposit"}: ${description}`,
                quantity: qty,
                unit: isPiece ? t.piece : t.gram,
                pricePerUnit: qty > 0 ? Math.round(depositAmount / qty) : 0,
                lineTotal: depositAmount,
                vatRate,
              },
            ],
          },
        },
      });

      return invoice;
    },
    { timeout: 15000 }
  );
}

/**
 * Create a settlement invoice (vyúčtovací faktura) for the remaining 50% after reservation completion.
 * References the original deposit invoice.
 */
export async function createSettlementInvoice(
  reservationId: string,
  saleId: string,
  companyId?: string
): Promise<Invoice> {
  return prisma.$transaction(
    async (tx) => {
      const reservation = await tx.productReservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: {
          variant: { include: { product: true } },
          salon: true,
          customer: true,
        },
      });

      // Find the deposit invoice
      const depositInvoice = await tx.invoice.findFirst({
        where: { reservationId, type: "DEPOSIT" },
      });

      const company = companyId
        ? await tx.company.findUniqueOrThrow({ where: { id: companyId } })
        : await tx.company.findFirstOrThrow({ where: { isDefault: true } });

      const { number, variableSymbol } = await getNextInvoiceNumber(tx, "F");

      const buyer =
        reservation.customerType === "SALON" && reservation.salon
          ? {
              buyerName: reservation.salon.name,
              buyerIco: reservation.salon.ico,
              buyerDic: reservation.salon.dic,
              buyerAddress: reservation.salon.city ?? "",
              buyerEmail: reservation.salon.email,
              buyerLanguage: reservation.salon.language ?? "cs",
            }
          : {
              buyerName: reservation.customer?.name ?? reservation.contactName ?? "",
              buyerIco: null as string | null,
              buyerDic: null as string | null,
              buyerAddress: reservation.customer?.city ?? "",
              buyerEmail: reservation.customer?.email ?? reservation.contactEmail ?? null,
              buyerLanguage: "cs",
            };

      const lang = buyer.buyerLanguage;
      const t = getInvoiceTranslations(lang);

      const depositAmount = depositInvoice ? depositInvoice.total : roundHalereUp(reservation.lineTotal / 2);
      const remainingAmount = reservation.lineTotal - depositAmount;
      const vatRate = 0;
      const vatAmount = 0;
      const subtotal = remainingAmount;

      const description = formatItemDescription(
        reservation.variant.product,
        reservation.variant,
        lang
      );

      const isPiece = reservation.pieces > 0;
      const qty = isPiece ? reservation.pieces : reservation.grams;

      const items = [
        {
          description,
          quantity: qty,
          unit: isPiece ? t.piece : t.gram,
          pricePerUnit: qty > 0 ? Math.round(reservation.lineTotal / qty) : 0,
          lineTotal: reservation.lineTotal,
          vatRate,
        },
        {
          description: `${lang === "cs" ? "Odpočet zálohy" : "Deposit deduction"} (${depositInvoice?.number ?? "—"})`,
          quantity: 1,
          unit: lang === "cs" ? "ks" : "pc",
          pricePerUnit: -depositAmount,
          lineTotal: -depositAmount,
          vatRate,
        },
      ];

      const invoice = await tx.invoice.create({
        data: {
          type: "INVOICE",
          number,
          companyId: company.id,
          salonId: reservation.salonId,
          customerId: reservation.customerId,
          ...buyer,
          saleId,
          reservationId,
          originalInvoiceId: depositInvoice?.id ?? null,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          taxDate: new Date(),
          variableSymbol,
          subtotal,
          vatRate,
          vatAmount,
          total: remainingAmount,
          roundingAmount: 0,
          status: "AWAITING",
          note: `Vyúčtování rezervace ${reservation.reservationNumber}`,
          items: {
            create: items,
          },
        },
      });

      return invoice;
    },
    { timeout: 15000 }
  );
}

/**
 * Create a credit note (dobropis) for a deposit invoice when reservation is cancelled.
 */
export async function createDepositCreditNote(
  reservationId: string
): Promise<Invoice | null> {
  const depositInvoice = await prisma.invoice.findFirst({
    where: { reservationId, type: "DEPOSIT" },
    include: { company: true },
  });

  if (!depositInvoice) return null;

  return prisma.$transaction(
    async (tx) => {
      const original = await tx.invoice.findUniqueOrThrow({
        where: { id: depositInvoice.id },
        include: { company: true, items: true },
      });

      const { number, variableSymbol } = await getNextInvoiceNumber(tx, "F");

      const creditNote = await tx.invoice.create({
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
          reservationId,
          originalInvoiceId: original.id,
          issueDate: new Date(),
          dueDate: new Date(),
          variableSymbol,
          subtotal: -original.subtotal,
          vatRate: 0,
          vatAmount: 0,
          total: -original.total,
          status: "PAID",
          note: `Dobropis k záloze ${original.number} — storno rezervace`,
          items: {
            create: original.items.map((item) => ({
              description: item.description,
              quantity: -Number(item.quantity),
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              lineTotal: -item.lineTotal,
              vatRate: 0,
            })),
          },
        },
      });

      // Mark original deposit as cancelled
      await tx.invoice.update({
        where: { id: original.id },
        data: { status: "CANCELLED" },
      });

      return creditNote;
    },
    { timeout: 15000 }
  );
}

export interface CreditNoteItem {
  description: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  lineTotal: number;
}

/**
 * Create a credit note (dobropis) referencing an original invoice.
 * Same numbering sequence. Amounts are negative.
 */
export async function createCreditNote(
  originalInvoiceId: string,
  returnItems: CreditNoteItem[],
  reason: string
): Promise<Invoice> {
  return prisma.$transaction(
    async (tx) => {
      const original = await tx.invoice.findUniqueOrThrow({
        where: { id: originalInvoiceId },
        include: { company: true },
      });

      // Credit note uses same prefix as original invoice
      const originalPrefix = original.number.startsWith("H") ? "H" as InvoicePrefix : "F" as InvoicePrefix;
      const { number, variableSymbol } = await getNextInvoiceNumber(tx, originalPrefix);

      const itemsTotal = returnItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );
      const total = -itemsTotal;
      const vatAmount = 0;
      const subtotal = total;

      const creditNote = await tx.invoice.create({
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
          vatRate: 0,
          vatAmount,
          total,
          status: "PAID",
          note: reason,
          items: {
            create: returnItems.map((item) => ({
              description: item.description,
              quantity: -item.quantity,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              lineTotal: -item.lineTotal,
              vatRate: 0,
            })),
          },
        },
      });

      return creditNote;
    },
    { timeout: 15000 }
  );
}
