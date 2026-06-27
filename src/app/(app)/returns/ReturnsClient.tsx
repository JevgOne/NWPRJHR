"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface ReturnItem {
  id: string;
  grams: number;
  pieces: number;
  reason: string;
  status: string;
  pointsDeducted?: number;
  revenueDeducted?: number;
  createdAt: string;
  approvedAt?: string;
  sale: { saleNumber: string | null };
  saleItem: {
    variant: {
      lengthCm: number;
      color: string;
      product: { name: string };
    };
  };
  salon: { id: string; name: string } | null;
  creditNote: { id: string; number: string } | null;
  createdByUser: { name: string | null };
  approvedByUser: { name: string | null } | null;
}

export function ReturnsClient() {
  const t = useTranslations("returnsMgmt");
  const tc = useTranslations("common");
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/returns${params}`);
    if (res.ok) {
      setReturns(await res.json());
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/returns/${id}/approve`, { method: "POST" });
    if (res.ok) fetchReturns();
  }

  async function handleReject(id: string) {
    const res = await fetch(`/api/returns/${id}/reject`, { method: "POST" });
    if (res.ok) fetchReturns();
  }

  const tabs = [
    { key: "ALL", label: tc("all") },
    { key: "PENDING", label: t("pending") },
    { key: "APPROVED", label: t("approved") },
    { key: "REJECTED", label: t("rejected") },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === tab.key
                ? "bg-rose text-white"
                : "bg-nude-100 text-espresso hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{tc("loading")}</p>
      ) : returns.length === 0 ? (
        <p className="text-muted">{t("noReturns")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-nude-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("saleNumber")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("salon")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("product")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
                  {t("grams")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("reason")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  {tc("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map((ret) => (
                <tr key={ret.id}>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {ret.sale.saleNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {ret.salon?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {ret.saleItem.variant.product.name}{" "}
                    {ret.saleItem.variant.lengthCm}cm{" "}
                    {ret.saleItem.variant.color}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {ret.grams}g
                    {ret.pieces > 0 && ` / ${ret.pieces}ks`}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {ret.reason}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ret.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : ret.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ret.status === "PENDING"
                        ? t("pending")
                        : ret.status === "APPROVED"
                        ? t("approved")
                        : t("rejected")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {ret.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(ret.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          {t("approve")}
                        </button>
                        <button
                          onClick={() => handleReject(ret.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    )}
                    {ret.creditNote && (
                      <span className="text-espresso text-xs">
                        {t("creditNote")}: {ret.creditNote.number}
                      </span>
                    )}
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
