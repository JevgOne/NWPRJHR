"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface DiscountRow {
  id: string;
  percent: number;
  type: string;
  amountHalere: number;
  counterPerformanceNote?: string;
  createdAt: string;
  sale: {
    id: string;
    saleNumber?: string;
    customerType: string;
    totalAmount: number;
    completedAt: string;
  };
  givenByUser: { id: string; name: string | null; email: string };
  bearers: { partner: { id: string; name: string }; shareAmount: number }[];
}

interface Summary {
  byType: { STANDARD: number; MARKETING: number; PERSONAL: number };
  byPartner: { partnerId: string; name: string; totalBorne: number }[];
  totalDiscountAmount: number;
  totalDiscounts: number;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DiscountsClient() {
  const t = useTranslations("discountHistory");
  const tPartner = useTranslations("partner");
  const tCommon = useTranslations("common");
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params.toString()}` : "";

    Promise.all([
      fetch(`/api/discounts${qs}`).then((r) => r.json()),
      fetch(`/api/discounts/summary${qs}`).then((r) => r.json()),
    ])
      .then(([disc, sum]) => {
        setDiscounts(disc.data ?? []);
        setSummary(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const typeLabels: Record<string, string> = {
    STANDARD: tPartner("standardDiscount"),
    MARKETING: tPartner("marketingDiscount"),
    PERSONAL: tPartner("personalDiscount"),
  };

  const typeColors: Record<string, string> = {
    STANDARD: "bg-nude-100 text-espresso",
    MARKETING: "bg-purple-100 text-purple-700",
    PERSONAL: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      <div className="flex gap-3">
        <Input
          label={t("period")}
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="&nbsp;"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card padding="sm">
            <div className="text-xs text-muted">{tPartner("standardDiscount")}</div>
            <div className="font-bold">{formatCZK(summary.byType.STANDARD)} CZK</div>
          </Card>
          <Card padding="sm">
            <div className="text-xs text-muted">{tPartner("marketingDiscount")}</div>
            <div className="font-bold">{formatCZK(summary.byType.MARKETING)} CZK</div>
          </Card>
          <Card padding="sm">
            <div className="text-xs text-muted">{tPartner("personalDiscount")}</div>
            <div className="font-bold">{formatCZK(summary.byType.PERSONAL)} CZK</div>
          </Card>
          <Card padding="sm">
            <div className="text-xs text-muted">{t("summary")}</div>
            <div className="font-bold">
              {formatCZK(summary.totalDiscountAmount)} CZK
              <span className="text-muted font-normal text-xs ml-1">
                ({summary.totalDiscounts}x)
              </span>
            </div>
          </Card>
        </div>
      )}

      {summary && summary.byPartner.length > 0 && (
        <Card padding="sm">
          <h3 className="text-sm font-medium mb-2">{t("totalByPartner")}</h3>
          <div className="space-y-1">
            {summary.byPartner.map((p) => (
              <div key={p.partnerId} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="font-medium">{formatCZK(p.totalBorne)} CZK</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : discounts.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">{t("noDiscounts")}</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="py-2 pr-3">{t("type")}</th>
                <th className="py-2 pr-3">{t("percent")}</th>
                <th className="py-2 pr-3 text-right">{t("amount")}</th>
                <th className="py-2 pr-3">{t("givenBy")}</th>
                <th className="py-2 pr-3">{t("bearer")}</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2 pr-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        typeColors[d.type] || ""
                      }`}
                    >
                      {typeLabels[d.type] || d.type}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{d.percent / 100}%</td>
                  <td className="py-2 pr-3 text-right font-medium">
                    {formatCZK(d.amountHalere)} CZK
                  </td>
                  <td className="py-2 pr-3">
                    {d.givenByUser.name || d.givenByUser.email}
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted">
                    {d.bearers.map((b) => b.partner.name).join(", ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
