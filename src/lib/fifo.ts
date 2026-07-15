import type { PrismaClient, Delivery } from "@prisma/client";

type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export interface FifoResult {
  deliveryId: string;
  grams: number;
  pieces: number;
  purchasePricePerGramCZK: number;
}

export class InsufficientStockError extends Error {
  constructor(
    public unit: "grams" | "pieces",
    public requested: number,
    public available: number
  ) {
    super(
      `Insufficient stock: requested ${requested} ${unit}, available ${available}`
    );
    this.name = "InsufficientStockError";
  }
}

/**
 * FIFO deduction: consume stock from the oldest deliveries first.
 * Must run inside a Prisma transaction.
 * Uses SELECT FOR UPDATE to prevent concurrent over-deduction.
 */
export async function fifoDeduct(
  variantId: string,
  requestedGrams: number,
  requestedPieces: number,
  userId: string,
  tx: TransactionClient
): Promise<FifoResult[]> {
  // Lock and fetch deliveries with remaining stock, oldest first
  const deliveries = await tx.$queryRaw<Delivery[]>`
    SELECT * FROM "deliveries"
    WHERE "variantId" = ${variantId}
      AND ("remainingGrams" > 0 OR "remainingPieces" > 0)
    ORDER BY "stockedAt" ASC
    FOR UPDATE
  `;

  const totalAvailableGrams = deliveries.reduce(
    (sum, d) => sum + d.remainingGrams,
    0
  );
  const totalAvailablePieces = deliveries.reduce(
    (sum, d) => sum + d.remainingPieces,
    0
  );

  if (totalAvailableGrams < requestedGrams) {
    throw new InsufficientStockError(
      "grams",
      requestedGrams,
      totalAvailableGrams
    );
  }
  if (requestedPieces > 0 && totalAvailablePieces < requestedPieces) {
    throw new InsufficientStockError(
      "pieces",
      requestedPieces,
      totalAvailablePieces
    );
  }

  const results: FifoResult[] = [];
  let gramsRemaining = requestedGrams;
  let piecesRemaining = requestedPieces;

  for (const delivery of deliveries) {
    if (gramsRemaining <= 0 && piecesRemaining <= 0) break;

    let gramsFromThis = 0;
    let piecesFromThis = 0;

    if (requestedPieces > 0) {
      // Piece-based sale (ponytails): deduct pieces, calculate grams from piece weight
      piecesFromThis = Math.min(piecesRemaining, delivery.remainingPieces);
      gramsFromThis = piecesFromThis * (delivery.pieceWeightGrams ?? 0);
      piecesRemaining -= piecesFromThis;
      gramsRemaining -= gramsFromThis;
    } else {
      // Gram-based sale (loose hair): deduct grams only
      gramsFromThis = Math.min(gramsRemaining, delivery.remainingGrams);
      gramsRemaining -= gramsFromThis;
    }

    if (gramsFromThis === 0 && piecesFromThis === 0) continue;

    // Update delivery remaining stock
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        remainingGrams: { decrement: gramsFromThis },
        remainingPieces: { decrement: piecesFromThis },
      },
    });

    // Create ISSUE stock movement
    await tx.stockMovement.create({
      data: {
        deliveryId: delivery.id,
        variantId,
        type: "ISSUE",
        grams: -gramsFromThis,
        pieces: -piecesFromThis,
        userId,
      },
    });

    results.push({
      deliveryId: delivery.id,
      grams: gramsFromThis,
      pieces: piecesFromThis,
      purchasePricePerGramCZK: delivery.purchasePricePerGramCZK,
    });
  }

  return results;
}

/**
 * Return stock to the ORIGINAL delivery.
 * Preserves FIFO accuracy by returning to exact delivery.
 */
export async function fifoReturn(
  deliveryId: string,
  grams: number,
  pieces: number,
  userId: string,
  tx: TransactionClient
): Promise<void> {
  const delivery = await tx.delivery.update({
    where: { id: deliveryId },
    data: {
      remainingGrams: { increment: grams },
      remainingPieces: { increment: pieces },
    },
  });

  await tx.stockMovement.create({
    data: {
      deliveryId,
      variantId: delivery.variantId,
      type: "RETURN",
      grams,
      pieces,
      userId,
    },
  });
}
