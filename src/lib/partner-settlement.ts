import type { PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { getFinanceSummaryInTx, type FinancePeriod, type FinanceSummary } from "./finance";

type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export interface PartnerSettlement {
  partnerId: string;
  partnerName: string;
  shareOfNetProfit: number;
  personalDiscountsBorne: number;
  entitlement: number;
  withdrawn: number;
  balance: number;
}

export interface SettlementOverview {
  period: FinancePeriod;
  financeSummary: FinanceSummary;
  partners: PartnerSettlement[];
}

export interface CumulativePartner {
  partnerId: string;
  partnerName: string;
  cumulativeEntitlement: number;
  cumulativeWithdrawn: number;
  cumulativeBalance: number;
  personalDiscountsTotal: number;
}

async function settlePartners(
  period: FinancePeriod,
  tx: TransactionClient
): Promise<SettlementOverview> {
  const financeSummary = await getFinanceSummaryInTx(period, tx);

  const partners = await tx.partner.findMany({
    where: { active: true },
    include: { user: { select: { name: true } } },
  });

  const settlements: PartnerSettlement[] = [];

  for (const partner of partners) {
    const personalBurden = await tx.discountBearer.aggregate({
      where: {
        partnerId: partner.id,
        discount: {
          type: "PERSONAL",
          sale: {
            status: "COMPLETED",
            completedAt: { gte: period.from, lte: period.to },
          },
        },
      },
      _sum: { shareAmount: true },
    });

    const personalDiscountsBorne = personalBurden._sum.shareAmount ?? 0;
    const shareOfNetProfit = Math.floor(
      (financeSummary.netProfit * partner.share) / 10000
    );
    const entitlement = shareOfNetProfit - personalDiscountsBorne;

    const withdrawalResult = await tx.partnerWithdrawal.aggregate({
      where: {
        partnerId: partner.id,
        year: period.from.getFullYear(),
        month: period.from.getMonth() + 1,
        status: "COMPLETED",
      },
      _sum: { amountHalere: true },
    });

    const withdrawn = withdrawalResult._sum.amountHalere ?? 0;

    settlements.push({
      partnerId: partner.id,
      partnerName: partner.user?.name ?? partner.name,
      shareOfNetProfit,
      personalDiscountsBorne,
      entitlement,
      withdrawn,
      balance: entitlement - withdrawn,
    });
  }

  return { period, financeSummary, partners: settlements };
}

export async function calculatePartnerSettlement(
  period: FinancePeriod
): Promise<SettlementOverview> {
  return prisma.$transaction(async (tx) => settlePartners(period, tx));
}

export async function getCumulativeSettlement(
  fromDate: Date
): Promise<{ partners: CumulativePartner[] }> {
  const period: FinancePeriod = { from: fromDate, to: new Date() };

  return prisma.$transaction(async (tx) => {
    const financeSummary = await getFinanceSummaryInTx(period, tx);
    const partners = await tx.partner.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
    });

    const result: CumulativePartner[] = [];

    for (const partner of partners) {
      const personalBurden = await tx.discountBearer.aggregate({
        where: {
          partnerId: partner.id,
          discount: {
            type: "PERSONAL",
            sale: {
              status: "COMPLETED",
              completedAt: { gte: period.from, lte: period.to },
            },
          },
        },
        _sum: { shareAmount: true },
      });

      const personalDiscountsTotal = personalBurden._sum.shareAmount ?? 0;
      const shareOfNetProfit = Math.floor(
        (financeSummary.netProfit * partner.share) / 10000
      );
      const cumulativeEntitlement = shareOfNetProfit - personalDiscountsTotal;

      const withdrawals = await tx.partnerWithdrawal.aggregate({
        where: {
          partnerId: partner.id,
          status: "COMPLETED",
          date: { gte: period.from, lte: period.to },
        },
        _sum: { amountHalere: true },
      });

      const cumulativeWithdrawn = withdrawals._sum.amountHalere ?? 0;

      result.push({
        partnerId: partner.id,
        partnerName: partner.user?.name ?? partner.name,
        cumulativeEntitlement,
        cumulativeWithdrawn,
        cumulativeBalance: cumulativeEntitlement - cumulativeWithdrawn,
        personalDiscountsTotal,
      });
    }

    return { partners: result };
  });
}

export async function recordWithdrawal(
  input: {
    partnerId: string;
    year: number;
    month: number;
    amountHalere: number;
    note?: string;
  },
  userId: string
) {
  return prisma.partnerWithdrawal.upsert({
    where: {
      partnerId_year_month: {
        partnerId: input.partnerId,
        year: input.year,
        month: input.month,
      },
    },
    create: {
      partnerId: input.partnerId,
      year: input.year,
      month: input.month,
      amountHalere: input.amountHalere,
      status: "COMPLETED",
      date: new Date(),
      note: input.note,
      createdByUserId: userId,
    },
    update: {
      amountHalere: input.amountHalere,
      status: "COMPLETED",
      date: new Date(),
      note: input.note,
    },
  });
}
