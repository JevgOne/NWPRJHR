"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface OrderRow {
  id: string;
  status: string;
  estimatedTotal: number;
  createdAt: string;
  salon: { name: string };
  _count: { items: number };
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const statusColors: Record<string, string> = {
  NEW: "bg-nude-100 text-espresso",
  CONFIRMED: "bg-rose/15 text-espresso",
  REJECTED: "bg-red-100 text-red-700",
  READY: "bg-green-100 text-green-700",
  IN_TRANSIT: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function OrdersClient({ role }: { role: Role }) {
  const t = useTranslations("orderManagement");
  const tCommon = useTranslations("common");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const statuses = [
    "",
    "NEW",
    "CONFIRMED",
    "READY",
    "IN_TRANSIT",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>

      <div className="flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
              statusFilter === s
                ? "border-rose bg-rose/10 text-espresso"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s === "" ? tCommon("search") : t(s.toLowerCase().replace("_", "")  === "intransit" ? "inTransit" : s.toLowerCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : orders.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">{t("noOrders")}</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">{t("title")}</th>
                  <th className="py-2 pr-3">{role !== "SALON" && role !== "HAIRDRESSER" ? t("salon") : ""}</th>
                  <th className="py-2 pr-3 text-right">
                    {t("estimatedTotal")}
                  </th>
                  <th className="py-2 pr-3">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-espresso hover:underline font-medium"
                      >
                        {new Date(o.createdAt).toLocaleDateString("cs-CZ")}
                      </Link>
                      <span className="text-gray-400 ml-1 text-xs">
                        ({o._count.items})
                      </span>
                    </td>
                    <td className="py-2 pr-3">{o.salon.name}</td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {formatCZK(o.estimatedTotal)} CZK
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          statusColors[o.status] ?? "bg-gray-100"
                        }`}
                      >
                        {t(o.status === "IN_TRANSIT" ? "inTransit" : o.status.toLowerCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {tCommon("back")}
              </Button>
              <span className="text-sm text-gray-500 self-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                {tCommon("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
