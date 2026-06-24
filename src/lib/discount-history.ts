import { prisma } from "./db";
import type { FinancePeriod } from "./finance";
import type { DiscountType } from "@prisma/client";

export interface DiscountHistoryEntry {
  discountId: string;
  saleId: string;
  saleDate: Date;
  percent: number;
  type: DiscountType;
  amountHalere: number;
  counterPerformanceNote: string | null;
  givenByUserId: string;
  givenByUserName: string;
  bearers: Array<{
    partnerId: string;
    partnerName: string;
    shareAmount: number;
  }>;
  customerType: string;
  salonName?: string;
  customerName?: string;
}

export async function getDiscountHistory(params: {
  period: FinancePeriod;
  givenByUserId?: string;
  type?: DiscountType;
  partnerId?: string;
}): Promise<DiscountHistoryEntry[]> {
  const where: Record<string, unknown> = {
    sale: {
      status: "COMPLETED",
      completedAt: { gte: params.period.from, lte: params.period.to },
    },
  };

  if (params.givenByUserId) where.givenByUserId = params.givenByUserId;
  if (params.type) where.type = params.type;
  if (params.partnerId) {
    where.bearers = { some: { partnerId: params.partnerId } };
  }

  const discounts = await prisma.discount.findMany({
    where,
    include: {
      sale: {
        select: {
          id: true,
          completedAt: true,
          customerType: true,
          salon: { select: { name: true } },
          customer: { select: { name: true } },
        },
      },
      givenByUser: { select: { name: true } },
      bearers: {
        include: {
          partner: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return discounts.map((d) => ({
    discountId: d.id,
    saleId: d.saleId,
    saleDate: d.sale.completedAt!,
    percent: d.percent,
    type: d.type,
    amountHalere: d.amountHalere,
    counterPerformanceNote: d.counterPerformanceNote,
    givenByUserId: d.givenByUserId,
    givenByUserName: d.givenByUser.name ?? "",
    bearers: d.bearers.map((b) => ({
      partnerId: b.partnerId,
      partnerName: b.partner.name,
      shareAmount: b.shareAmount,
    })),
    customerType: d.sale.customerType,
    salonName: d.sale.salon?.name ?? undefined,
    customerName: d.sale.customer?.name ?? undefined,
  }));
}

export async function getDiscountSummaryByGiver(
  period: FinancePeriod
): Promise<
  Array<{
    userId: string;
    userName: string;
    totalCount: number;
    totalAmountHalere: number;
    byType: Record<string, { count: number; amountHalere: number }>;
  }>
> {
  const discounts = await prisma.discount.findMany({
    where: {
      sale: {
        status: "COMPLETED",
        completedAt: { gte: period.from, lte: period.to },
      },
    },
    include: {
      givenByUser: { select: { id: true, name: true } },
    },
  });

  const byGiver = new Map<
    string,
    {
      userId: string;
      userName: string;
      totalCount: number;
      totalAmountHalere: number;
      byType: Record<string, { count: number; amountHalere: number }>;
    }
  >();

  for (const d of discounts) {
    const key = d.givenByUserId;
    if (!byGiver.has(key)) {
      byGiver.set(key, {
        userId: key,
        userName: d.givenByUser.name ?? "",
        totalCount: 0,
        totalAmountHalere: 0,
        byType: {},
      });
    }
    const entry = byGiver.get(key)!;
    entry.totalCount++;
    entry.totalAmountHalere += d.amountHalere;

    if (!entry.byType[d.type]) {
      entry.byType[d.type] = { count: 0, amountHalere: 0 };
    }
    entry.byType[d.type].count++;
    entry.byType[d.type].amountHalere += d.amountHalere;
  }

  return Array.from(byGiver.values());
}
