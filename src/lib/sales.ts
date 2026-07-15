import type { Sale, CustomerType, DiscountType } from "@prisma/client";
import { prisma } from "./db";
import { roundHalereUp } from "./rounding";
import { fifoDeduct } from "./fifo";
import { invalidateStockCache } from "./stock";
import { notifyLowStock } from "./telegram";

export interface SaleItemInput {
  variantId: string;
  grams: number;
  pieces: number;
}

export interface DiscountInput {
  percent: number; // basis points (1500 = 15%)
  type: DiscountType;
  counterPerformanceNote?: string;
  bearerPartnerIds?: string[];
}

export interface CompleteSaleInput {
  customerType: CustomerType;
  salonId?: string;
  customerId?: string;
  items: SaleItemInput[];
  discount?: DiscountInput;
  paymentType?: "TRANSFER" | "CASH" | "PROMO" | "WRITEOFF";
  receiptNumber?: string;
  orderId?: string;
  note?: string;
}

/**
 * Complete a sale: calculate prices, apply discounts, FIFO deduct, record margin.
 * Everything runs in a single DB transaction.
 */
export async function completeSale(
  input: CompleteSaleInput,
  userId: string
): Promise<Sale> {
  const sale = await prisma.$transaction(
    async (tx) => {
      // 1. DETERMINE PRICE for each item (per-gram or per-piece)
      const pricedItems = await Promise.all(
        input.items.map(async (item) => {
          const variant = await tx.variant.findUniqueOrThrow({
            where: { id: item.variantId },
          });

          const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
          const isByPiece = sellingMode === "BY_PIECE";

          let pricePerGram: number;
          let pricePerUnit: number;

          // B2B discount from margin (margin = retail / 2 with 100% markup)
          let discountPct = 0;
          if (input.customerType === "SALON" || input.customerType === "HAIRDRESSER") {
            const b2bSettings = await tx.b2BSettings.findFirst();
            discountPct = input.customerType === "SALON"
              ? (b2bSettings?.salonDiscountPct ?? 3000)
              : (b2bSettings?.hairdresserDiscountPct ?? 2000);
          }

          if (input.customerType === "RETAIL" || discountPct === 0) {
            pricePerGram = variant.retailPricePerGram;
          } else {
            pricePerGram = roundHalereUp(
              variant.retailPricePerGram - (variant.retailPricePerGram * discountPct) / 20000
            );
          }

          if (isByPiece) {
            const retailPerPiece = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
            if (input.customerType === "RETAIL" || discountPct === 0) {
              pricePerUnit = retailPerPiece;
            } else {
              pricePerUnit = roundHalereUp(
                retailPerPiece - (retailPerPiece * discountPct) / 20000
              );
            }
          } else {
            pricePerUnit = pricePerGram;
          }

          const lineTotal = isByPiece
            ? roundHalereUp(pricePerUnit * item.pieces)
            : roundHalereUp(pricePerUnit * item.grams);

          return {
            ...item,
            pricePerGram,
            pricePerUnit,
            sellingMode,
            lineTotal,
          };
        })
      );

      // 2. CALCULATE SUBTOTAL
      const subtotal = pricedItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );

      // 3. APPLY SPECIAL DISCOUNT (if any)
      let discountAmount = 0;
      if (input.discount) {
        discountAmount = roundHalereUp(
          (subtotal * input.discount.percent) / 10000
        );
      }

      // 4. CALCULATE TOTALS (prices already include VAT)
      const totalAmount = roundHalereUp(subtotal - discountAmount);
      const vatRate = 2100; // 21%
      const vatAmount = roundHalereUp((totalAmount * vatRate) / 12100);
      const totalBeforeVat = totalAmount - vatAmount;

      // 5. FIFO DEDUCT for each item
      let totalCostOfGoods = 0;
      const saleItemsData: {
        variantId: string;
        grams: number;
        pieces: number;
        pricePerGramUsed: number;
        deliveryId: string;
        purchasePricePerGramCZK: number;
        lineTotal: number;
      }[] = [];

      for (const item of pricedItems) {
        const fifoResults = await fifoDeduct(
          item.variantId,
          item.grams,
          item.pieces,
          userId,
          tx
        );

        for (const fifo of fifoResults) {
          const itemCost = fifo.purchasePricePerGramCZK * fifo.grams;
          totalCostOfGoods += itemCost;

          const fifoLineTotal = item.sellingMode === "BY_PIECE"
            ? roundHalereUp(item.pricePerUnit * fifo.pieces)
            : roundHalereUp(item.pricePerUnit * fifo.grams);

          saleItemsData.push({
            variantId: item.variantId,
            grams: fifo.grams,
            pieces: fifo.pieces,
            pricePerGramUsed: item.pricePerUnit,
            deliveryId: fifo.deliveryId,
            purchasePricePerGramCZK: fifo.purchasePricePerGramCZK,
            lineTotal: fifoLineTotal,
          });
        }
      }

      // 6. CREATE SALE
      const s = await tx.sale.create({
        data: {
          customerType: input.customerType,
          salonId: input.salonId,
          customerId: input.customerId,
          status: "COMPLETED",
          paymentType: input.paymentType ?? "TRANSFER",
          subtotal,
          discountAmount,
          totalBeforeVat,
          vatRate,
          vatAmount,
          totalAmount,
          totalCostOfGoods,
          grossMargin: totalBeforeVat - totalCostOfGoods,
          userId,
          orderId: input.orderId,
          receiptNumber: input.receiptNumber,
          note: input.note,
          completedAt: new Date(),
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      });

      // 7. CREATE DISCOUNT RECORD (if any)
      if (input.discount) {
        const discount = await tx.discount.create({
          data: {
            saleId: s.id,
            percent: input.discount.percent,
            type: input.discount.type,
            amountHalere: discountAmount,
            counterPerformanceNote: input.discount.counterPerformanceNote,
            givenByUserId: userId,
          },
        });

        // Create bearers for PERSONAL discount
        if (input.discount.type === "PERSONAL") {
          const bearerIds = input.discount.bearerPartnerIds ?? [];

          // Default: logged-in user's partner
          let effectiveBearers = bearerIds;
          if (effectiveBearers.length === 0) {
            const partner = await tx.partner.findUnique({
              where: { userId },
            });
            if (partner) {
              effectiveBearers = [partner.id];
            }
          }

          if (effectiveBearers.length > 0) {
            const sharePerBearer = Math.ceil(
              discountAmount / effectiveBearers.length
            );

            await tx.discountBearer.createMany({
              data: effectiveBearers.map((partnerId) => ({
                discountId: discount.id,
                partnerId,
                shareAmount: sharePerBearer,
              })),
            });
          }
        }
      }

      return s;
    },
    { timeout: 15000 }
  );

  // Check for low stock after sale
  const LOW_STOCK_THRESHOLD = 200; // grams
  try {
    const variantIds = [...new Set(input.items.map((i) => i.variantId))];
    const variants = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { name: true } },
        deliveries: { where: { remainingGrams: { gt: 0 } }, select: { remainingGrams: true } },
      },
    });
    const lowItems = variants
      .map((v) => {
        const totalGrams = v.deliveries.reduce((sum, d) => sum + d.remainingGrams, 0);
        return { productName: v.product.name, variant: `${v.lengthCm} cm · ${v.color}`, remainingGrams: totalGrams };
      })
      .filter((i) => i.remainingGrams > 0 && i.remainingGrams <= LOW_STOCK_THRESHOLD);

    if (lowItems.length > 0) {
      notifyLowStock(lowItems).catch(() => {});
    }
  } catch {}

  invalidateStockCache();
  return sale;
}
