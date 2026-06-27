"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Withdrawal {
  id: string;
  year: number;
  month: number;
  amountHalere: number;
  status: string;
  date: string;
  note?: string;
}

interface PersonalDiscount {
  shareAmount: number;
  discountAmount: number;
  discountPercent: number;
  date: string;
  saleId: string;
  saleDate: string;
  salonName?: string;
  customerName?: string;
}

interface PartnerData {
  partner: {
    id: string;
    name: string;
    share: number;
    user?: { name?: string; email?: string };
  };
  withdrawals: Withdrawal[];
  personalDiscounts: PersonalDiscount[];
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

export function PartnerDetailClient({ partnerId }: { partnerId: string }) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/finance/partners/${partnerId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) return <p>{tCommon("loading")}</p>;
  if (!data) return <p>{tCommon("notFound")}</p>;

  const totalWithdrawn = data.withdrawals.reduce(
    (s, w) => s + w.amountHalere,
    0
  );
  const totalPersonalDiscounts = data.personalDiscounts.reduce(
    (s, d) => s + d.shareAmount,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {data.partner.user?.name ?? data.partner.name}
        </h1>
        <Link href="/finance/partners">
          <Button variant="secondary">{tCommon("back")}</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted">{t("share")}</p>
            <p className="text-2xl font-bold">
              {(data.partner.share / 100).toFixed(2)}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted">{t("totalWithdrawn")}</p>
            <p className="text-2xl font-bold">
              {formatCZK(totalWithdrawn)} CZK
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-muted">{t("personalDiscounts")}</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCZK(totalPersonalDiscounts)} CZK
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4">
          <h2 className="mb-3 text-lg font-semibold">{t("withdrawalHistory")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{t("period")}</th>
                <th className="p-2 text-right">{t("amount")}</th>
                <th className="p-2">{t("status")}</th>
                <th className="p-2">{t("date")}</th>
                <th className="p-2">{t("note")}</th>
              </tr>
            </thead>
            <tbody>
              {data.withdrawals.map((w) => (
                <tr key={w.id} className="border-b">
                  <td className="p-2">
                    {w.month.toString().padStart(2, "0")}/{w.year}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {formatCZK(w.amountHalere)}
                  </td>
                  <td className="p-2">{w.status}</td>
                  <td className="p-2">{formatDate(w.date)}</td>
                  <td className="p-2">{w.note}</td>
                </tr>
              ))}
              {data.withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-muted">
                    {t("noWithdrawals")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="mb-3 text-lg font-semibold">
            {t("personalDiscountsGiven")}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{t("date")}</th>
                <th className="p-2">{t("customer")}</th>
                <th className="p-2 text-right">{t("discountPercent")}</th>
                <th className="p-2 text-right">{t("borne")}</th>
              </tr>
            </thead>
            <tbody>
              {data.personalDiscounts.map((d, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{formatDate(d.date)}</td>
                  <td className="p-2">
                    {d.salonName ?? d.customerName ?? "-"}
                  </td>
                  <td className="p-2 text-right">
                    {(d.discountPercent / 100).toFixed(2)}%
                  </td>
                  <td className="p-2 text-right font-mono text-red-600">
                    {formatCZK(d.shareAmount)}
                  </td>
                </tr>
              ))}
              {data.personalDiscounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-center text-muted">
                    {t("noPersonalDiscounts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
