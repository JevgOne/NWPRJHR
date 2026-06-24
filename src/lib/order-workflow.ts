import { prisma } from "./db";
import { getStockNumbers } from "./stock";
import { getLoyaltyDiscount } from "./loyalty";
import { roundHalereUp } from "./rounding";
import type { Order } from "@prisma/client";

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
  return prisma.$transaction(async (tx) => {
    const salon = await tx.salon.findUniqueOrThrow({
      where: { id: salonId },
    });

    if (salon.archived) {
      throw new InvalidStateError("Salon is archived");
    }

    const loyaltyDiscount = await getLoyaltyDiscount(salon.tier);

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
      const variant = await tx.variant.findUniqueOrThrow({
        where: { id: item.variantId },
      });

      const stock = await getStockNumbers(item.variantId);
      if (stock.availableGrams < item.grams) {
        throw new InsufficientStockError("grams", item.grams, stock.availableGrams);
      }
      if (item.pieces > 0 && stock.availablePieces < item.pieces) {
        throw new InsufficientStockError("pieces", item.pieces, stock.availablePieces);
      }

      const pricePerGram = loyaltyDiscount > 0
        ? roundHalereUp(variant.wholesalePricePerGram * (10000 - loyaltyDiscount) / 10000)
        : variant.wholesalePricePerGram;
      const lineTotal = roundHalereUp(pricePerGram * item.grams);
      estimatedTotal += lineTotal;

      orderItems.push({
        variantId: item.variantId,
        grams: item.grams,
        pieces: item.pieces,
        pricePerGram,
        lineTotal,
      });

      reservations.push({
        variantId: item.variantId,
        grams: item.grams,
        pieces: item.pieces,
        active: true,
      });
    }

    const order = await tx.order.create({
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

    return order;
  });
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
  });
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
  });
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
  });
}
