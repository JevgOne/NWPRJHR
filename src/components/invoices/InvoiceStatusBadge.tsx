"use client";

import { useTranslations } from "next-intl";

const statusStyles: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-gray-50 text-gray-500 border border-gray-200",
  AWAITING: "bg-amber-50 text-amber-700 border border-amber-200",
  OVERDUE: "bg-red-50 text-red-700 border border-red-200",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("invoice");

  const statusLabels: Record<string, string> = {
    PAID: t("paid"),
    CANCELLED: t("cancelled"),
    AWAITING: t("awaitingPayment"),
    OVERDUE: t("overdue"),
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        statusStyles[status] || "bg-nude-100"
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
