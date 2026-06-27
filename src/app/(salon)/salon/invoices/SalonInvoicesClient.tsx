"use client";

import { useState, useEffect } from "react";
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

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("myInvoices")}</h1>

      {invoices.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-8">{t("noInvoicesYet")}</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="py-2 pr-3">{tInvoice("invoice")}</th>
                <th className="py-2 pr-3">{tInvoice("issueDate")}</th>
                <th className="py-2 pr-3">{tInvoice("dueDate")}</th>
                <th className="py-2 pr-3 text-right">{tInvoice("total")}</th>
                <th className="py-2 pr-3">{tInvoice("status")}</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-nude-50">
                  <td className="py-2 pr-3 font-medium">
                    {inv.number}
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
                  <td className="py-2 pr-3">
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-espresso hover:underline text-xs"
                    >
                      PDF
                    </a>
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
