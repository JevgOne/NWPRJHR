"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PartnerSettlement {
  partnerId: string;
  partnerName: string;
  shareOfNetProfit: number;
  personalDiscountsBorne: number;
  entitlement: number;
  withdrawn: number;
  balance: number;
}

interface SettlementData {
  financeSummary: {
    netProfit: number;
  };
  partners: PartnerSettlement[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PartnersClient() {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  const [withdrawPartnerId, setWithdrawPartnerId] = useState<string | null>(
    null
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/finance/partners?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleWithdraw() {
    if (!withdrawPartnerId) return;
    setSaving(true);
    const amountHalere = Math.round(parseFloat(withdrawAmount) * 100);
    if (isNaN(amountHalere) || amountHalere <= 0) {
      setSaving(false);
      return;
    }
    await fetch("/api/finance/partners/withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: withdrawPartnerId,
        year,
        month,
        amountHalere,
        note: withdrawNote || undefined,
      }),
    });
    setWithdrawPartnerId(null);
    setWithdrawAmount("");
    setWithdrawNote("");
    setSaving(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("partnerSettlement")}</h1>
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
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-500">{t("netProfit")}</p>
              <p className="text-2xl font-bold">
                {formatCZK(data.financeSummary.netProfit)} CZK
              </p>
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">{t("partner")}</th>
                    <th className="p-3 text-right">{t("profitShare")}</th>
                    <th className="p-3 text-right">
                      {t("personalDiscounts")}
                    </th>
                    <th className="p-3 text-right">{t("entitlement")}</th>
                    <th className="p-3 text-right">{t("withdrawn")}</th>
                    <th className="p-3 text-right">{t("balance")}</th>
                    <th className="p-3">{tCommon("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.partners.map((p) => (
                    <tr key={p.partnerId} className="border-b">
                      <td className="p-3">
                        <Link
                          href={`/finance/partners/${p.partnerId}`}
                          className="text-espresso hover:underline"
                        >
                          {p.partnerName}
                        </Link>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCZK(p.shareOfNetProfit)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600">
                        {p.personalDiscountsBorne > 0
                          ? `-${formatCZK(p.personalDiscountsBorne)}`
                          : "0,00"}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {formatCZK(p.entitlement)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCZK(p.withdrawn)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-semibold ${p.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCZK(p.balance)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setWithdrawPartnerId(p.partnerId)}
                          className="text-espresso hover:underline"
                        >
                          {t("recordWithdrawal")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {withdrawPartnerId && (
            <Card>
              <div className="space-y-3 p-4">
                <h3 className="font-semibold">{t("recordWithdrawal")}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      {t("amount")} (CZK)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("note")}</label>
                    <input
                      type="text"
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleWithdraw} disabled={saving}>
                    {saving ? tCommon("saving") : tCommon("save")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setWithdrawPartnerId(null)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
