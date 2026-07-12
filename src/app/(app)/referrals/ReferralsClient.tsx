"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";

interface ReferralRow {
  id: string;
  code: string;
  referrerType: string;
  referrerSalon?: { id: string; name: string } | null;
  referrerCustomer?: { id: string; name: string } | null;
  referrerRewardValue: number;
  refereeDiscountValue: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  _count: { conversions: number };
}

export function ReferralsClient() {
  const t = useTranslations("referral");
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then(setReferrals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-muted">
        <div className="animate-spin h-6 w-6 border-2 border-rose border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <span className="text-sm text-muted">{t("count", { count: referrals.length })}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-nude-50">
                <th className="text-left px-4 py-2 text-xs text-muted uppercase">{t("code")}</th>
                <th className="text-left px-4 py-2 text-xs text-muted uppercase">{t("referrer")}</th>
                <th className="text-center px-4 py-2 text-xs text-muted uppercase">{t("reward")}</th>
                <th className="text-center px-4 py-2 text-xs text-muted uppercase">{t("newDiscount")}</th>
                <th className="text-center px-4 py-2 text-xs text-muted uppercase">{t("conversions")}</th>
                <th className="text-center px-4 py-2 text-xs text-muted uppercase">{t("status")}</th>
                <th className="text-left px-4 py-2 text-xs text-muted uppercase">{t("created")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-nude-50/50">
                  <td className="px-4 py-2 font-mono font-semibold text-espresso">{r.code}</td>
                  <td className="px-4 py-2">
                    {r.referrerSalon?.name ?? r.referrerCustomer?.name ?? "—"}
                    <span className="text-xs text-muted ml-1">({r.referrerType})</span>
                  </td>
                  <td className="px-4 py-2 text-center">{r.referrerRewardValue / 100}%</td>
                  <td className="px-4 py-2 text-center">{r.refereeDiscountValue / 100}%</td>
                  <td className="px-4 py-2 text-center font-medium">{r._count.conversions}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        r.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(r.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    {t("noReferrals")}
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
