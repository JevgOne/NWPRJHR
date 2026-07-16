import { prisma } from "./db";
import { roundHalereUp } from "./rounding";
import type { ProductReservation, CustomerType } from "@prisma/client";

export interface CreateReservationInput {
  customerType: CustomerType;
  salonId?: string;
  customerId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  variantId: string;
  grams: number;
  pieces: number;
  paymentDueDate?: string; // ISO date
  note?: string;
}

/**
 * Generate reservation number: RES-YYYYMMDD-NNN
 */
async function generateReservationNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `RES-${dateStr}-`;

  const lastRes = await prisma.productReservation.findFirst({
    where: { reservationNumber: { startsWith: prefix } },
    orderBy: { reservationNumber: "desc" },
    select: { reservationNumber: true },
  });

  let seq = 1;
  if (lastRes?.reservationNumber) {
    const lastSeq = parseInt(lastRes.reservationNumber.split("-").pop() ?? "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

/**
 * Create a product reservation with price calculation.
 */
export async function createProductReservation(
  input: CreateReservationInput,
  userId: string
): Promise<ProductReservation> {
  const variant = await prisma.variant.findUniqueOrThrow({
    where: { id: input.variantId },
    include: { product: { select: { name: true, archived: true } } },
  });

  if (!variant.active || variant.product.archived) {
    throw new Error("Variant is not active");
  }

  const sellingMode = (variant.sellingMode ?? "BY_GRAM") as "BY_GRAM" | "BY_PIECE";
  const isByPiece = sellingMode === "BY_PIECE";

  // Calculate price (same logic as sales)
  let discountPct = 0;
  if (input.customerType === "SALON" || input.customerType === "HAIRDRESSER") {
    const b2bSettings = await prisma.b2BSettings.findFirst();
    discountPct =
      input.customerType === "SALON"
        ? (b2bSettings?.salonDiscountPct ?? 3000)
        : (b2bSettings?.hairdresserDiscountPct ?? 2000);
  }

  let pricePerUnit: number;
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
    if (input.customerType === "RETAIL" || discountPct === 0) {
      pricePerUnit = variant.retailPricePerGram;
    } else {
      pricePerUnit = roundHalereUp(
        variant.retailPricePerGram - (variant.retailPricePerGram * discountPct) / 20000
      );
    }
  }

  const lineTotal =
    isByPiece && input.pieces > 0
      ? roundHalereUp(pricePerUnit * input.pieces)
      : roundHalereUp(pricePerUnit * input.grams);

  // Payment deadline: default +3 days
  const paymentDueDate = input.paymentDueDate
    ? new Date(input.paymentDueDate)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const reservationNumber = await generateReservationNumber();

  const reservation = await prisma.productReservation.create({
    data: {
      reservationNumber,
      customerType: input.customerType,
      salonId: input.salonId || null,
      customerId: input.customerId || null,
      contactName: input.contactName || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      variantId: input.variantId,
      grams: input.grams,
      pieces: input.pieces,
      pricePerUnit,
      lineTotal,
      sellingMode,
      status: "PENDING",
      paymentDueDate,
      note: input.note || null,
      createdByUserId: userId,
    },
  });

  return reservation;
}

/**
 * Mark a reservation as paid.
 */
export async function markReservationPaid(
  reservationId: string,
  _userId: string,
  paymentNote?: string
): Promise<ProductReservation> {
  const reservation = await prisma.productReservation.findUniqueOrThrow({
    where: { id: reservationId },
  });

  if (reservation.status !== "PENDING") {
    throw new Error(`Cannot mark as paid — status is ${reservation.status}`);
  }

  return prisma.productReservation.update({
    where: { id: reservationId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentNote: paymentNote || null,
    },
  });
}

/**
 * Complete a reservation — status becomes COMPLETED.
 * Creating the actual Sale is done separately by the caller (same pattern as order completion).
 */
export async function completeReservation(
  reservationId: string,
): Promise<ProductReservation> {
  const reservation = await prisma.productReservation.findUniqueOrThrow({
    where: { id: reservationId },
  });

  if (reservation.status !== "PAID") {
    throw new Error(`Cannot complete — status is ${reservation.status}, must be PAID`);
  }

  return prisma.productReservation.update({
    where: { id: reservationId },
    data: { status: "COMPLETED" },
  });
}

/**
 * Cancel a reservation.
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<ProductReservation> {
  const reservation = await prisma.productReservation.findUniqueOrThrow({
    where: { id: reservationId },
  });

  if (["COMPLETED", "CANCELLED"].includes(reservation.status)) {
    throw new Error(`Cannot cancel — status is ${reservation.status}`);
  }

  return prisma.productReservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
      internalNote: reason
        ? `${reservation.internalNote ? reservation.internalNote + "\n" : ""}Cancelled: ${reason}`
        : reservation.internalNote,
    },
  });
}

/**
 * Expire overdue PENDING reservations. Called by cron.
 */
export async function expireOverdueReservations(): Promise<number> {
  const now = new Date();

  const overdue = await prisma.productReservation.findMany({
    where: {
      status: "PENDING",
      paymentDueDate: { lt: now },
    },
    select: { id: true },
  });

  if (overdue.length === 0) return 0;

  const result = await prisma.productReservation.updateMany({
    where: {
      id: { in: overdue.map((r) => r.id) },
      status: "PENDING",
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}
