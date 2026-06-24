"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";

interface InvoiceRow {
  id: string;
  number: string;
  type: string;
  status: string;
  total: number;
  issueDate: string;
  dueDate: string;
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function SalonInvoicesClient() {
  const t = useTranslations("salonPortal");
  const tInvoice = useTranslations("invoice");
  const tCommon = useTranslations("common");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices?limit=50")
      .then((r) => r.json())
      .then((data) => setInvoices(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("myInvoices")}</h1>

      {invoices.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">-</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3">{tInvoice("invoice")}</th>
                <th className="py-2 pr-3">{tInvoice("issueDate")}</th>
                <th className="py-2 pr-3">{tInvoice("dueDate")}</th>
                <th className="py-2 pr-3 text-right">{tInvoice("total")}</th>
                <th className="py-2 pr-3">-</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/salon/invoices/${inv.id}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    {new Date(inv.issueDate).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="py-2 pr-3">
                    {new Date(inv.dueDate).toLocaleDateString("cs-CZ")}
                  </td>
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
      )}
    </div>
  );
}
