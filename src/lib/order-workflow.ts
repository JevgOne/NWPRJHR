import { prisma } from "./db";
import { getAllStockNumbers } from "./stock";
import { getLoyaltyDiscount } from "./loyalty";
import { roundHalereUp } from "./rounding";
import type { Order } from "@prisma/client";

const TX_TIMEOUT = 30000;

export class InsufficientStockError extends Error {
  constructor(
    public unit: string,
    public requested: number,
    public available: number
  ) {
    super(`Insufficient stock: ${unit} requested=${requested} available=${available}`);
  }
}

export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Create an order: check stock, calculate salon prices, create reservations.
 */
export async function createOrder(
  salonId: string,
  items: { variantId: string; grams: number; pieces: number }[],
  note?: string
): Promise<Order> {
  // Pre-fetch salon + loyalty OUTSIDE transaction to reduce tx duration
  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: salonId },
  });

  if (salon.archived) {
    throw new InvalidStateError("Salon is archived");
  }

  const variantIds = items.map(i => i.variantId);

  // Parallel: loyalty discount + all variants + all stock in 3 queries
  const [loyaltyDiscount, variants, stockMap] = await Promise.all([
    getLoyaltyDiscount(salon.tier),
    prisma.variant.findMany({
      where: { id: { in: variantIds } },
    }),
    getAllStockNumbers(),
  ]);

  const variantMap = new Map(variants.map(v => [v.id, v]));

  // Validate stock + build order data before transaction
  let estimatedTotal = 0;
  const orderItems: {
    variantId: string;
    grams: number;
    pieces: number;
    pricePerGram: number;
    lineTotal: number;
  }[] = [];
  const reservations: {
    variantId: string;
    grams: number;
    pieces: number;
    active: boolean;
  }[] = [];

  for (const item of items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }

    const stock = stockMap.get(item.variantId);
    const availableGrams = stock?.availableGrams ?? 0;
    const availablePieces = stock?.availablePieces ?? 0;

    const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
    const isByPiece = sellingMode === "BY_PIECE";

    if (isByPiece) {
      // BY_PIECE: check pieces primarily
      if (item.pieces > 0 && availablePieces < item.pieces) {
        throw new InsufficientStockError("pieces", item.pieces, availablePieces);
      }
    } else {
      if (availableGrams < item.grams) {
        throw new InsufficientStockError("grams", item.grams, availableGrams);
      }
      if (item.pieces > 0 && availablePieces < item.pieces) {
        throw new InsufficientStockError("pieces", item.pieces, availablePieces);
      }
    }

    let pricePerUnit: number;
    let lineTotal: number;

    if (isByPiece) {
      const basePiecePrice = variant.pricePerPiece ?? 0;
      pricePerUnit = loyaltyDiscount > 0
        ? roundHalereUp(basePiecePrice * (10000 - loyaltyDiscount) / 10000)
        : basePiecePrice;
      lineTotal = roundHalereUp(pricePerUnit * item.pieces);
    } else {
      pricePerUnit = loyaltyDiscount > 0
        ? roundHalereUp(variant.wholesalePricePerGram * (10000 - loyaltyDiscount) / 10000)
        : variant.wholesalePricePerGram;
      lineTotal = roundHalereUp(pricePerUnit * item.grams);
    }
    estimatedTotal += lineTotal;

    orderItems.push({
      variantId: item.variantId,
      grams: item.grams,
      pieces: item.pieces,
      pricePerGram: pricePerUnit,
      lineTotal,
    });

    reservations.push({
      variantId: item.variantId,
      grams: item.grams,
      pieces: item.pieces,
      active: true,
    });
  }

  // Transaction only for the write — single create query
  return prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        salonId,
        status: "NEW",
        estimatedTotal,
        note,
        items: { create: orderItems },
        reservations: { create: reservations },
      },
      include: { items: true },
    });
  }, { timeout: TX_TIMEOUT });
}

/**
 * Confirm an order (owner action).
 */
export async function confirmOrder(
  orderId: string,
  userId: string
): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    if (order.status !== "NEW") {
      throw new InvalidStateError(`Cannot confirm order in status ${order.status}`);
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
    });
  }, { timeout: TX_TIMEOUT });
}

/**
 * Reject an order (owner action). Releases reservations.
 */
export async function rejectOrder(
  orderId: string,
  reason: string
): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    if (order.status !== "NEW") {
      throw new InvalidStateError(`Cannot reject order in status ${order.status}`);
    }

    await tx.reservation.updateMany({
      where: { orderId, active: true },
      data: { active: false },
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
    });
  }, { timeout: TX_TIMEOUT });
}

/**
 * Update order status (READY, IN_TRANSIT).
 */
export async function updateOrderStatus(
  orderId: string,
  status: "READY" | "IN_TRANSIT"
): Promise<Order> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });

  const validTransitions: Record<string, string[]> = {
    CONFIRMED: ["READY"],
    READY: ["IN_TRANSIT"],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new InvalidStateError(
      `Cannot transition from ${order.status} to ${status}`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

/**
 * Cancel an order. Releases reservations.
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status)) {
      throw new InvalidStateError(`Cannot cancel order in status ${order.status}`);
    }

    await tx.reservation.updateMany({
      where: { orderId, active: true },
      data: { active: false },
    });

    return tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }, { timeout: TX_TIMEOUT });
}
