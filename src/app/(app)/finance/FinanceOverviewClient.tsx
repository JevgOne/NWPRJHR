"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FinanceSummaryData {
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

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function FinanceOverviewClient() {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<FinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    fetch(`/api/finance/summary?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const categories = [
    "ADVERTISING",
    "MARKETING",
    "TRANSPORT",
    "RENT",
    "FEES",
    "OTHER",
  ] as const;

  const categoryKeys: Record<string, string> = {
    ADVERTISING: "advertising",
    MARKETING: "marketing",
    TRANSPORT: "transport",
    RENT: "rent",
    FEES: "fees",
    OTHER: "other",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {(i + 1).toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border px-3 py-2"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = now.getFullYear() - 2 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading && <p>{tCommon("loading")}</p>}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500">{t("revenue")}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCZK(data.revenue)} CZK
                </p>
                <p className="text-xs text-gray-400">
                  {data.revenueInvoiceCount} {t("invoices")}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500">{t("costOfGoods")}</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCZK(data.costOfGoods)} CZK
                </p>
                <p className="text-xs text-gray-400">
                  {data.costOfGoodsSaleCount} {t("sales")}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-gray-500">{t("grossMargin")}</p>
                <p className="text-2xl font-bold text-espresso">
                  {formatCZK(data.grossMargin)} CZK
                </p>
                {data.revenue > 0 && (
                  <p className="text-xs text-gray-400">
                    {((data.grossMargin / data.revenue) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-4">
              <h2 className="mb-3 text-lg font-semibold">
                {t("operatingCostsTitle")}
              </h2>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const amount = data.operatingCostsByCategory[cat] ?? 0;
                  if (amount === 0) return null;
                  return (
                    <div key={cat} className="flex justify-between">
                      <span>{t(`costs.${categoryKeys[cat]}`)}</span>
                      <span className="font-mono">
                        {formatCZK(amount)} CZK
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>{t("totalOperatingCosts")}</span>
                  <span className="font-mono">
                    {formatCZK(data.totalOperatingCosts)} CZK
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">{t("netProfit")}</p>
              <p
                className={`text-3xl font-bold ${data.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
              >
                {formatCZK(data.netProfit)} CZK
              </p>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link href="/finance/costs">
              <Button variant="secondary">{t("manageCosts")}</Button>
            </Link>
            <Link href="/finance/partners">
              <Button variant="secondary">{t("partnerSettlement")}</Button>
            </Link>
            <Link href="/finance/discounts">
              <Button variant="secondary">{t("discountHistory")}</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
