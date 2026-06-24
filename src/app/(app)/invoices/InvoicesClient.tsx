"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import type { Role } from "@prisma/client";

interface InvoiceRow {
  id: string;
  type: string;
  number: string;
  buyerName: string;
  status: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  issueDate: string;
  dueDate: string;
  company?: { name: string };
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvoicesClient({ role }: { role: Role }) {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.data ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const statuses = ["", "ISSUED", "AWAITING", "PAID", "OVERDUE", "CANCELLED"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("invoice")}</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
              statusFilter === s
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {s === "" ? tCommon("search") : <InvoiceStatusBadge status={s} />}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{tCommon("loading")}</p>
      ) : invoices.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">-</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">{t("invoice")}</th>
                  <th className="py-2 pr-3">{t("dueDate")}</th>
                  <th className="py-2 pr-3">-</th>
                  <th className="py-2 pr-3 text-right">{t("total")}</th>
                  <th className="py-2 pr-3">-</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {inv.number}
                      </Link>
                      {inv.type === "CREDIT_NOTE" && (
                        <span className="ml-1 text-xs text-orange-600">
                          {t("creditNote")}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-500">
                      {new Date(inv.dueDate).toLocaleDateString("cs-CZ")}
                    </td>
                    <td className="py-2 pr-3">{inv.buyerName}</td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {formatCZK(inv.total)} CZK
                    </td>
                    <td className="py-2 pr-3">
                      <InvoiceStatusBadge status={inv.status} />
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
