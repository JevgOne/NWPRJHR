import type { Sale, SaleItem, Variant, Product, Salon, Customer, Invoice } from "@prisma/client";
import { prisma } from "./db";
import { getNextInvoiceNumber } from "./invoice-number";
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
 */
export async function createInvoiceFromSale(
  saleId: string,
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

      const { number, variableSymbol } = await getNextInvoiceNumber(tx);

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
              buyerAddress: "",
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

        return {
          description,
          quantity: isPiece ? item.pieces : item.grams,
          unit: isPiece ? t.piece : t.gram,
          pricePerUnit: item.pricePerGramUsed,
          lineTotal: item.lineTotal,
          vatRate: 2100,
        };
      });

      const subtotal = sale.totalBeforeVat;
      const vatAmount = sale.vatAmount;
      const rawTotal = subtotal + vatAmount;
      const roundedTotal = roundHalereUp(rawTotal);
      const roundingAmount = roundedTotal - rawTotal;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

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
          vatRate: 2100,
          vatAmount,
          total: roundedTotal,
          roundingAmount,
          status: "PAID",
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

      const { number, variableSymbol } = await getNextInvoiceNumber(tx);

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
              buyerAddress: "",
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
          vatRate: 2100,
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
          vatRate: 2100,
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

      const { number, variableSymbol } = await getNextInvoiceNumber(tx);

      const itemsTotal = returnItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );
      const total = -itemsTotal;
      const vatAmount = -roundHalereUp(
        (itemsTotal * original.vatRate) / 12100
      );
      const subtotal = total - vatAmount;

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
          vatRate: original.vatRate,
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
              vatRate: original.vatRate,
            })),
          },
        },
      });

      return creditNote;
    },
    { timeout: 15000 }
  );
}
