"use client";

import { useTranslations } from "next-intl";

const statusStyles: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-nude-100 text-muted",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("invoice");

  const statusLabels: Record<string, string> = {
    PAID: t("paid"),
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
