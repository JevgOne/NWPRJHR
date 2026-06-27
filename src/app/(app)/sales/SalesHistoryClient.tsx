"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface SaleRow {
  id: string;
  saleNumber?: string;
  customerType: string;
  salonName?: string;
  customerName?: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  completedAt: string;
  grossMargin?: number;
  items: unknown[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SalesHistoryClient({ role }: { role: Role }) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setSales(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const isOwner = role === "OWNER";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        {role !== "SALON" && role !== "HAIRDRESSER" && (
          <Link href="/sales/new">
            <Button>{t("newSale")}</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-muted">{tCommon("loading")}</p>
      ) : sales.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">{t("noSales")}</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="py-2 pr-3">{t("date")}</th>
                  <th className="py-2 pr-3">{t("customer")}</th>
                  <th className="py-2 pr-3">{t("items")}</th>
                  <th className="py-2 pr-3 text-right">{t("total")}</th>
                  {isOwner && (
                    <th className="py-2 pr-3 text-right">
                      {t("grossMargin")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-nude-50">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-espresso hover:underline"
                      >
                        {sale.completedAt ? formatDate(sale.completedAt) : "-"}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${
                          sale.customerType === "SALON"
                            ? "bg-nude-100 text-espresso"
                            : "bg-nude-100 text-espresso"
                        }`}
                      >
                        {sale.customerType === "SALON"
                          ? t("salonCustomer")
                          : t("retailCustomer")}
                      </span>
                      {sale.salonName || sale.customerName || "-"}
                    </td>
                    <td className="py-2 pr-3">{sale.items?.length ?? 0}</td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {formatCZK(sale.totalAmount)} CZK
                    </td>
                    {isOwner && (
                      <td className="py-2 pr-3 text-right">
                        {sale.grossMargin !== undefined && (
                          <span
                            className={
                              sale.grossMargin >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCZK(sale.grossMargin)}
                          </span>
                        )}
                      </td>
                    )}
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
              <span className="text-sm text-muted self-center">
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
