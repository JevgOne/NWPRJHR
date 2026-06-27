"use client";

import { useTranslations } from "next-intl";

const statusStyles: Record<string, string> = {
  ISSUED: "bg-nude-100 text-espresso",
  AWAITING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-nude-100 text-muted",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("invoice");

  const statusLabels: Record<string, string> = {
    ISSUED: t("issued"),
    AWAITING: t("awaitingPayment"),
    PAID: t("paid"),
    OVERDUE: t("overdue"),
    CANCELLED: t("cancelled"),
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
