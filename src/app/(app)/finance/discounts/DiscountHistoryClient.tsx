"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { UserBadge } from "@/components/ui/UserBadge";

interface DiscountEntry {
  discountId: string;
  saleId: string;
  saleDate: string;
  percent: number;
  type: string;
  amountHalere: number;
  counterPerformanceNote: string | null;
  givenByUserName: string;
  bearers: Array<{
    partnerName: string;
    shareAmount: number;
  }>;
  salonName?: string;
  customerName?: string;
}

interface SummaryEntry {
  userId: string;
  userName: string;
  totalCount: number;
  totalAmountHalere: number;
  byType: Record<string, { count: number; amountHalere: number }>;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ");
}

const TYPES = ["STANDARD", "MARKETING", "PERSONAL"] as const;

export function DiscountHistoryClient() {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const tPartner = useTranslations("partner");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState("");
  const [discounts, setDiscounts] = useState<DiscountEntry[]>([]);
  const [summary, setSummary] = useState<SummaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const typeKeys: Record<string, string> = {
    STANDARD: "standardDiscount",
    MARKETING: "marketingDiscount",
    PERSONAL: "personalDiscount",
  };

  const loadData = useCallback(() => {
    setLoading(true);
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    const typeParam = typeFilter ? `&type=${typeFilter}` : "";

    Promise.all([
      fetch(`/api/finance/discounts?from=${from}&to=${to}${typeParam}`).then(
        (r) => r.json()
      ),
      fetch(`/api/finance/discounts?from=${from}&to=${to}&summary=true`).then(
        (r) => r.json()
      ),
    ])
      .then(([disc, summ]) => {
        setDiscounts(disc);
        setSummary(summ);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalDiscounts = discounts.reduce((s, d) => s + d.amountHalere, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("discountHistory")}</h1>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">{tCommon("all")}</option>
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tPartner(typeKeys[tp])}
              </option>
            ))}
          </select>
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

      {!loading && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <div className="p-4">
                <p className="text-sm text-muted">{t("totalDiscounts")}</p>
                <p className="text-xl font-bold">
                  {discounts.length}x / {formatCZK(totalDiscounts)} CZK
                </p>
              </div>
            </Card>
            {summary.map((s) => (
              <Card key={s.userId}>
                <div className="p-4">
                  <p className="text-sm text-muted"><UserBadge name={s.userName} /></p>
                  <p className="text-lg font-bold">
                    {s.totalCount}x / {formatCZK(s.totalAmountHalere)} CZK
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">{t("date")}</th>
                    <th className="p-3">{t("customer")}</th>
                    <th className="p-3">{t("type")}</th>
                    <th className="p-3 text-right">%</th>
                    <th className="p-3 text-right">{t("amount")}</th>
                    <th className="p-3">{t("givenBy")}</th>
                    <th className="p-3">{t("bearers")}</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.discountId} className="border-b">
                      <td className="p-3">{formatDate(d.saleDate)}</td>
                      <td className="p-3">
                        {d.salonName ?? d.customerName ?? "-"}
                      </td>
                      <td className="p-3">
                        {tPartner(typeKeys[d.type] ?? d.type)}
                      </td>
                      <td className="p-3 text-right">
                        {(d.percent / 100).toFixed(2)}%
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCZK(d.amountHalere)}
                      </td>
                      <td className="p-3"><UserBadge name={d.givenByUserName} /></td>
                      <td className="p-3">
                        {d.bearers.length > 0
                          ? d.bearers
                              .map(
                                (b) =>
                                  `${b.partnerName} (${formatCZK(b.shareAmount)})`
                              )
                              .join(", ")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {discounts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-muted">
                        {t("noDiscounts")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
