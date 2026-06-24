import { prisma, type TransactionClient } from "./db";
import type { LoyaltyTier } from "@prisma/client";

/**
 * Determine salon's loyalty tier based on cumulative revenue.
 */
export async function calculateTier(
  totalRevenue: number
): Promise<LoyaltyTier> {
  const settings = await prisma.loyaltySettings.findMany({
    orderBy: { revenueThreshold: "desc" },
  });

  for (const setting of settings) {
    if (totalRevenue >= setting.revenueThreshold) {
      return setting.tier;
    }
  }
  return "BRONZE";
}

/**
 * Get the discount percentage (basis points) for a tier.
 * e.g. 300 = 3.00%
 */
export async function getLoyaltyDiscount(
  tier: LoyaltyTier
): Promise<number> {
  const setting = await prisma.loyaltySettings.findUnique({
    where: { tier },
  });
  return setting?.discountPercent ?? 0;
}

/**
 * Calculate loyalty points earned from a sale.
 * Default: 1 point per 100 CZK (excl. VAT).
 */
export async function calculatePoints(
  amountBeforeVatHalere: number
): Promise<number> {
  const settings = await prisma.loyaltySettings.findFirst({
    where: { tier: "BRONZE" },
  });
  const pointsThreshold = settings?.pointsThreshold ?? 10000; // 100 CZK in halere
  return Math.floor(amountBeforeVatHalere / pointsThreshold);
}

/**
 * After invoice is paid: add revenue + points, recalculate tier.
 */
export async function addSalonRevenue(
  salonId: string,
  amountBeforeVatHalere: number
): Promise<void> {
  return addSalonRevenueInTx(salonId, amountBeforeVatHalere, prisma);
}

/**
 * Transaction-aware variant of addSalonRevenue.
 */
export async function addSalonRevenueInTx(
  salonId: string,
  amountBeforeVatHalere: number,
  tx: TransactionClient
): Promise<void> {
  const points = await calculatePoints(amountBeforeVatHalere);

  const salon = await tx.salon.update({
    where: { id: salonId },
    data: {
      totalRevenue: { increment: amountBeforeVatHalere },
      points: { increment: points },
    },
  });

  const newTier = await calculateTier(salon.totalRevenue);
  if (newTier !== salon.tier) {
    await tx.salon.update({
      where: { id: salonId },
      data: { tier: newTier },
    });
  }
}

/**
 * On return/credit note: reduce revenue + points proportionally.
 * May downgrade tier.
 */
export async function reduceSalonRevenue(
  salonId: string,
  amountBeforeVatHalere: number
): Promise<void> {
  const pointsToRemove = await calculatePoints(amountBeforeVatHalere);

  const salon = await prisma.salon.update({
    where: { id: salonId },
    data: {
      totalRevenue: { decrement: amountBeforeVatHalere },
      points: { decrement: pointsToRemove },
    },
  });

  if (salon.totalRevenue < 0 || salon.points < 0) {
    await prisma.salon.update({
      where: { id: salonId },
      data: {
        totalRevenue: Math.max(0, salon.totalRevenue),
        points: Math.max(0, salon.points),
      },
    });
  }

  const newTier = await calculateTier(Math.max(0, salon.totalRevenue));
  if (newTier !== salon.tier) {
    await prisma.salon.update({
      where: { id: salonId },
      data: { tier: newTier },
    });
  }
}
