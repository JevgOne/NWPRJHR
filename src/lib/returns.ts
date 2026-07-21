import type { Return } from "@prisma/client";
import { prisma, type TransactionClient } from "./db";
import { fifoReturn } from "./fifo";
import { type CreditNoteItem } from "./invoicing";
import { createCreditNoteInTx } from "./credit-note";

/**
 * Owner initiates a return. Creates a PENDING return record.
 * Salon CANNOT request returns (SPECIFIKACE 9.1).
 */
export async function initiateReturn(
  input: {
    saleId: string;
    saleItemId: string;
    grams: number;
    pieces: number;
    reason: string;
  },
  userId: string
): Promise<Return> {
  return prisma.$transaction(async (tx) => {
    const saleItem = await tx.saleItem.findUniqueOrThrow({
      where: { id: input.saleItemId },
      include: {
        sale: { include: { salon: true } },
      },
    });

    if (saleItem.saleId !== input.saleId) {
      throw new Error("SaleItem does not belong to this sale");
    }

    // Validate quantities (cannot return more than sold minus already returned)
    const existingReturns = await tx.return.aggregate({
      where: {
        saleItemId: input.saleItemId,
        status: { in: ["PENDING", "APPROVED"] },
      },
      _sum: { grams: true, pieces: true },
    });

    const alreadyReturnedGrams = existingReturns._sum.grams ?? 0;
    const alreadyReturnedPieces = existingReturns._sum.pieces ?? 0;

    if (input.grams + alreadyReturnedGrams > saleItem.grams) {
      throw new Error("Cannot return more grams than sold");
    }
    if (input.pieces + alreadyReturnedPieces > saleItem.pieces) {
      throw new Error("Cannot return more pieces than sold");
    }

    return tx.return.create({
      data: {
        saleId: input.saleId,
        saleItemId: input.saleItemId,
        salonId: saleItem.sale.salonId,
        deliveryId: saleItem.deliveryId,
        grams: input.grams,
        pieces: input.pieces,
        reason: input.reason,
        status: "PENDING",
        createdByUserId: userId,
      },
    });
  });
}

/**
 * Approve a pending return. Triggers:
 * 1. Return stock to original delivery (fifoReturn)
 * 2. Create credit note
 * 3. Deduct loyalty points proportionally
 * 4. Reduce salon revenue (may downgrade tier)
 * 5. Record stock movement
 */
export async function approveReturn(
  returnId: string,
  userId: string
): Promise<Return> {
  return prisma.$transaction(
    async (tx) => {
      const ret = await tx.return.findUniqueOrThrow({
        where: { id: returnId },
        include: {
          saleItem: {
            include: {
              variant: { select: { sellingMode: true } },
            },
          },
          sale: {
            include: {
              invoice: true,
              salon: true,
            },
          },
        },
      });

      if (ret.status !== "PENDING") {
        throw new Error(`Return is already ${ret.status}`);
      }

      // 1. FIFO RETURN - return stock to original delivery
      await fifoReturn(ret.deliveryId, ret.grams, ret.pieces, userId, tx);

      // 2. CREATE CREDIT NOTE
      let creditNoteId: string | undefined;
      let returnValue = 0;

      if (ret.sale.invoice) {
        const isByPiece = ret.saleItem.variant?.sellingMode === "BY_PIECE";
        if (isByPiece) {
          returnValue = ret.saleItem.pricePerGramUsed * ret.pieces;
        } else {
          returnValue = ret.saleItem.pricePerGramUsed * ret.grams;
        }
        const creditNoteItems: CreditNoteItem[] = [
          {
            description: `Vratka: ${ret.reason}`,
            quantity: isByPiece ? ret.pieces : ret.grams,
            unit: isByPiece ? "ks" : "g",
            pricePerUnit: ret.saleItem.pricePerGramUsed,
            lineTotal: returnValue,
          },
        ];

        const quantityLabel = isByPiece ? `${ret.pieces}ks` : `${ret.grams}g`;
        const creditNote = await createCreditNoteInTx(
          ret.sale.invoice.id,
          creditNoteItems,
          `Vratka ${quantityLabel} k fakture ${ret.sale.invoice.number}`,
          tx
        );
        creditNoteId = creditNote.id;
      }

      // 3 & 4. DEDUCT LOYALTY and REVENUE
      let pointsDeducted = 0;
      let revenueDeducted = 0;

      if (ret.salonId && returnValue > 0) {
        revenueDeducted = returnValue;

        // reduceSalonRevenue handles points + tier recalc
        await reduceSalonRevenueInTx(ret.salonId, revenueDeducted, tx);

        const settings = await tx.loyaltySettings.findFirst({
          where: { tier: "BRONZE" },
        });
        const pointsThreshold = settings?.pointsThreshold ?? 10000;
        pointsDeducted = Math.floor(revenueDeducted / pointsThreshold);
      }

      // 5. UPDATE RETURN RECORD
      return tx.return.update({
        where: { id: returnId },
        data: {
          status: "APPROVED",
          approvedByUserId: userId,
          approvedAt: new Date(),
          creditNoteId,
          pointsDeducted,
          revenueDeducted,
        },
      });
    },
    { timeout: 15000 }
  );
}

/**
 * Reject a pending return. No side effects.
 */
export async function rejectReturn(
  returnId: string,
  userId: string
): Promise<Return> {
  return prisma.return.update({
    where: { id: returnId },
    data: {
      status: "REJECTED",
      approvedByUserId: userId,
      approvedAt: new Date(),
    },
  });
}

// === Transaction-aware helpers ===

async function reduceSalonRevenueInTx(
  salonId: string,
  amountBeforeVatHalere: number,
  tx: TransactionClient
) {
  const { calculateTier } = await import("./loyalty");

  const settings = await tx.loyaltySettings.findFirst({
    where: { tier: "BRONZE" },
  });
  const pointsThreshold = settings?.pointsThreshold ?? 10000;
  const pointsToRemove = Math.floor(amountBeforeVatHalere / pointsThreshold);

  const salon = await tx.salon.update({
    where: { id: salonId },
    data: {
      totalRevenue: { decrement: amountBeforeVatHalere },
      points: { decrement: pointsToRemove },
    },
  });

  if (salon.totalRevenue < 0 || salon.points < 0) {
    await tx.salon.update({
      where: { id: salonId },
      data: {
        totalRevenue: Math.max(0, salon.totalRevenue),
        points: Math.max(0, salon.points),
      },
    });
  }

  const newTier = await calculateTier(Math.max(0, salon.totalRevenue));
  if (newTier !== salon.tier) {
    await tx.salon.update({
      where: { id: salonId },
      data: { tier: newTier },
    });
  }
}
