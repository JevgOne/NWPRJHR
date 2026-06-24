import type { Delivery, Currency } from "@prisma/client";
import { prisma } from "./db";

export interface StockInInput {
  variantId: string;
  supplierId: string;
  purchasePricePerGramRaw: number;
  currency: Currency;
  exchangeRate: number;
  totalGrams: number;
  totalPieces: number;
  pieceWeightGrams?: number;
  barcode?: string;
  batchCode?: string;
  receivedInvoiceFile?: string;
  stockedAt?: Date;
  note?: string;
}

/**
 * Stock-in a new delivery. Creates Delivery + RECEIPT StockMovement in a transaction.
 * Purchase price conversion: purchasePricePerGramCZK = purchasePricePerGramRaw * exchangeRate / 10000
 * For CZK, exchangeRate must be 10000 (1:1).
 */
export async function stockIn(
  data: StockInInput,
  userId: string
): Promise<Delivery> {
  return prisma.$transaction(async (tx) => {
    const purchasePricePerGramCZK =
      data.currency === "CZK"
        ? data.purchasePricePerGramRaw
        : Math.round(
            (data.purchasePricePerGramRaw * data.exchangeRate) / 10000
          );

    const delivery = await tx.delivery.create({
      data: {
        variantId: data.variantId,
        supplierId: data.supplierId,
        purchasePricePerGramRaw: data.purchasePricePerGramRaw,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        purchasePricePerGramCZK,
        initialGrams: data.totalGrams,
        initialPieces: data.totalPieces,
        pieceWeightGrams: data.pieceWeightGrams,
        remainingGrams: data.totalGrams,
        remainingPieces: data.totalPieces,
        barcode: data.barcode,
        batchCode: data.batchCode,
        receivedInvoiceFile: data.receivedInvoiceFile,
        stockedAt: data.stockedAt ?? new Date(),
        note: data.note,
      },
    });

    await tx.stockMovement.create({
      data: {
        deliveryId: delivery.id,
        variantId: data.variantId,
        type: "RECEIPT",
        grams: data.totalGrams,
        pieces: data.totalPieces,
        userId,
      },
    });

    return delivery;
  });
}
