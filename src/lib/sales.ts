import type { Sale, CustomerType, DiscountType } from "@prisma/client";
import { prisma } from "./db";
import { roundHalereUp } from "./rounding";
import { fifoDeduct } from "./fifo";

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
  return prisma.$transaction(
    async (tx) => {
      // 1. DETERMINE PRICE PER GRAM for each item
      const pricedItems = await Promise.all(
        input.items.map(async (item) => {
          const variant = await tx.variant.findUniqueOrThrow({
            where: { id: item.variantId },
          });

          let pricePerGram: number;

          if (input.customerType === "SALON") {
            // Wholesale price (loyalty discounts added in Step 6)
            pricePerGram = variant.wholesalePricePerGram;
          } else {
            pricePerGram = variant.retailPricePerGram;
          }

          return {
            ...item,
            pricePerGram,
            lineTotal: roundHalereUp(pricePerGram * item.grams),
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

      // 4. CALCULATE TOTALS
      const totalBeforeVat = roundHalereUp(subtotal - discountAmount);
      const vatRate = 2100; // 21%
      const vatAmount = roundHalereUp((totalBeforeVat * vatRate) / 10000);
      const totalAmount = roundHalereUp(totalBeforeVat + vatAmount);

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

          saleItemsData.push({
            variantId: item.variantId,
            grams: fifo.grams,
            pieces: fifo.pieces,
            pricePerGramUsed: item.pricePerGram,
            deliveryId: fifo.deliveryId,
            purchasePricePerGramCZK: fifo.purchasePricePerGramCZK,
            lineTotal: roundHalereUp(item.pricePerGram * fifo.grams),
          });
        }
      }

      // 6. CREATE SALE
      const sale = await tx.sale.create({
        data: {
          customerType: input.customerType,
          salonId: input.salonId,
          customerId: input.customerId,
          status: "COMPLETED",
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
            saleId: sale.id,
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

      return sale;
    },
    { timeout: 15000 }
  );
}
