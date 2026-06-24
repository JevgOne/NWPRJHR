import type { OperatingCostCategory } from "@prisma/client";
import { prisma, type TransactionClient } from "./db";

export interface FinancePeriod {
  from: Date;
  to: Date;
}

export interface FinanceSummary {
  period: FinancePeriod;
  revenue: number;
  revenueInvoiceCount: number;
  costOfGoods: number;
  costOfGoodsSaleCount: number;
  operatingCosts: number;
  marketingDiscounts: number;
  totalOperatingCosts: number;
  grossMargin: number;
  netProfit: number;
  operatingCostsByCategory: Record<string, number>;
}

async function calculateRevenue(
  period: FinancePeriod,
  tx: TransactionClient
): Promise<{ revenue: number; invoiceCount: number }> {
  const invoices = await tx.invoice.findMany({
    where: {
      type: "INVOICE",
      status: "PAID",
      payments: {
        some: {
          date: { gte: period.from, lte: period.to },
        },
      },
    },
    select: { total: true },
  });

  return {
    revenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    invoiceCount: invoices.length,
  };
}

async function calculateCostOfGoods(
  period: FinancePeriod,
  tx: TransactionClient
): Promise<{ costOfGoods: number; saleCount: number }> {
  const sales = await tx.sale.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: period.from, lte: period.to },
    },
    include: {
      items: {
        select: {
          purchasePricePerGramCZK: true,
          grams: true,
        },
      },
    },
  });

  let costOfGoods = 0;
  for (const sale of sales) {
    for (const item of sale.items) {
      costOfGoods += item.purchasePricePerGramCZK * item.grams;
    }
  }

  return { costOfGoods, saleCount: sales.length };
}

async function calculateOperatingCosts(
  period: FinancePeriod,
  tx: TransactionClient
): Promise<{
  manualCosts: number;
  marketingDiscounts: number;
  total: number;
  byCategory: Record<string, number>;
}> {
  const manualCosts = await tx.operatingCost.findMany({
    where: {
      date: { gte: period.from, lte: period.to },
    },
  });

  let manualTotal = 0;
  const byCategory: Record<string, number> = {};

  for (const cost of manualCosts) {
    manualTotal += cost.amountHalere;
    byCategory[cost.category] =
      (byCategory[cost.category] ?? 0) + cost.amountHalere;
  }

  const marketingDiscountResult = await tx.discount.aggregate({
    where: {
      type: "MARKETING",
      sale: {
        status: "COMPLETED",
        completedAt: { gte: period.from, lte: period.to },
      },
    },
    _sum: { amountHalere: true },
  });

  const marketingDiscountTotal =
    marketingDiscountResult._sum.amountHalere ?? 0;
  byCategory["MARKETING"] =
    (byCategory["MARKETING"] ?? 0) + marketingDiscountTotal;

  return {
    manualCosts: manualTotal,
    marketingDiscounts: marketingDiscountTotal,
    total: manualTotal + marketingDiscountTotal,
    byCategory,
  };
}

/**
 * Calculate the full finance summary inside a transaction.
 */
export async function getFinanceSummaryInTx(
  period: FinancePeriod,
  tx: TransactionClient
): Promise<FinanceSummary> {
  const [revenue, costOfGoods, operatingCosts] = await Promise.all([
    calculateRevenue(period, tx),
    calculateCostOfGoods(period, tx),
    calculateOperatingCosts(period, tx),
  ]);

  const grossMargin = revenue.revenue - costOfGoods.costOfGoods;
  const netProfit = grossMargin - operatingCosts.total;

  return {
    period,
    revenue: revenue.revenue,
    revenueInvoiceCount: revenue.invoiceCount,
    costOfGoods: costOfGoods.costOfGoods,
    costOfGoodsSaleCount: costOfGoods.saleCount,
    operatingCosts: operatingCosts.manualCosts,
    marketingDiscounts: operatingCosts.marketingDiscounts,
    totalOperatingCosts: operatingCosts.total,
    grossMargin,
    netProfit,
    operatingCostsByCategory:
      operatingCosts.byCategory as Record<OperatingCostCategory, number>,
  };
}

/**
 * Get the three-layer financial summary for a period.
 */
export async function getFinanceSummary(
  period: FinancePeriod
): Promise<FinanceSummary> {
  return prisma.$transaction(async (tx) => {
    return getFinanceSummaryInTx(period, tx);
  });
}
