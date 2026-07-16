"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Role } from "@prisma/client";

interface ReservationDetail {
  id: string;
  reservationNumber?: string;
  status: string;
  customerType: string;
  salonId?: string | null;
  customerId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  grams: number;
  pieces: number;
  pricePerUnit: number;
  lineTotal: number;
  sellingMode: string;
  paymentDueDate: string;
  paidAt?: string | null;
  paymentNote?: string | null;
  saleId?: string | null;
  invoiceId?: string | null;
  note?: string | null;
  internalNote?: string | null;
  createdAt: string;
  variant: {
    id: string;
    lengthCm: number;
    color: string;
    sellingMode: string;
    product: { name: string };
  };
  salon?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  createdByUser: { name?: string | null; email: string };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  PAID: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  COMPLETED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  EXPIRED: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  CANCELLED: { color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
};

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ReservationDetailClient({
  id,
  role,
}: {
  id: string;
  role: Role;
}) {
  const t = useTranslations("reservation");
  const tCommon = useTranslations("common");
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwner = role === "OWNER";

  const load = () => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then(setReservation)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const doAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        load();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-muted py-8 text-center">{tCommon("loading")}</p>;
  if (!reservation) return <p className="text-red-500 py-8 text-center">{tCommon("error")}</p>;

  const statusStyle = STATUS_CONFIG[reservation.status] ?? STATUS_CONFIG.PENDING;
  const isFinal = ["COMPLETED", "CANCELLED", "EXPIRED"].includes(reservation.status);

  const dueDate = new Date(reservation.paymentDueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("title")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {reservation.reservationNumber && (
              <span className="font-mono mr-2">#{reservation.reservationNumber}</span>
            )}
            {new Date(reservation.createdAt).toLocaleDateString("cs-CZ")}
          </p>
        </div>
        <Link href="/reservations">
          <Button variant="ghost" size="sm">
            ← {tCommon("back")}
          </Button>
        </Link>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusStyle.bg} ${statusStyle.border}`}>
        <span className={`text-sm font-semibold ${statusStyle.color}`}>
          {t("status")}:
        </span>
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${statusStyle.color} ${statusStyle.bg}`}>
          {t(reservation.status.toLowerCase())}
        </span>
        {reservation.status === "PENDING" && (
          <span className={`text-xs ml-auto ${daysLeft < 0 ? "text-red-600 font-bold" : "text-muted"}`}>
            {daysLeft < 0 ? t("overdue") : t("daysLeft", { days: daysLeft })}
          </span>
        )}
        {reservation.paidAt && (
          <span className="text-xs text-muted ml-auto">
            {t("paid")}: {new Date(reservation.paidAt).toLocaleDateString("cs-CZ")}
          </span>
        )}
      </div>

      {/* Customer info */}
      <div className="bg-white border border-line rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-muted uppercase mb-1">{t("contactInfo")}</p>
        <p className="text-sm text-ink font-medium">
          {reservation.salon?.name ??
            reservation.customer?.name ??
            reservation.contactName ??
            "—"}
        </p>
        {reservation.contactEmail && (
          <p className="text-sm text-muted">{reservation.contactEmail}</p>
        )}
        {reservation.contactPhone && (
          <p className="text-sm text-muted">{reservation.contactPhone}</p>
        )}
        <p className="text-xs text-muted mt-1">{reservation.customerType}</p>
      </div>

      {/* Product info */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nude-50 border-b border-line text-left text-muted text-xs uppercase tracking-wider">
              <th className="py-2.5 px-4">{t("selectProduct")}</th>
              <th className="py-2.5 px-4 text-right">{t("quantity")}</th>
              <th className="py-2.5 px-4 text-right">{tCommon("total")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 px-4 font-medium text-ink">
                {reservation.variant.product.name}{" "}
                <span className="text-muted font-normal">
                  {reservation.variant.color} {reservation.variant.lengthCm}cm
                </span>
              </td>
              <td className="py-3 px-4 text-right text-muted">
                {reservation.sellingMode === "BY_PIECE"
                  ? `${reservation.pieces} ks`
                  : `${reservation.grams} g`}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-ink">
                {formatCZK(reservation.lineTotal)} CZK
              </td>
            </tr>
          </tbody>
        </table>
        <div className="px-4 py-3 bg-nude-50 border-t border-line flex justify-between items-center">
          <span className="text-sm font-bold text-ink">{tCommon("total")}</span>
          <span className="text-lg font-bold text-ink">
            {formatCZK(reservation.lineTotal)} CZK
          </span>
        </div>
      </div>

      {/* Payment deadline */}
      <div className="bg-white border border-line rounded-xl px-4 py-3">
        <p className="text-xs font-medium text-muted uppercase mb-1">{t("paymentDueDate")}</p>
        <p className="text-sm text-ink font-medium">
          {dueDate.toLocaleDateString("cs-CZ")}
        </p>
        {reservation.paymentNote && (
          <p className="text-sm text-muted mt-1">{reservation.paymentNote}</p>
        )}
      </div>

      {/* Notes */}
      {reservation.note && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-muted uppercase mb-1">
            {tCommon("all") === "Vše" ? "Poznámka" : "Note"}
          </p>
          <p className="text-sm text-ink">{reservation.note}</p>
        </div>
      )}

      {reservation.internalNote && isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-amber-600 uppercase mb-1">
            {tCommon("all") === "Vše" ? "Interní poznámka" : "Internal note"}
          </p>
          <p className="text-sm text-amber-800">{reservation.internalNote}</p>
        </div>
      )}

      {/* Actions */}
      {!isFinal && isOwner && (
        <div className="bg-white border border-line rounded-xl px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {reservation.status === "PENDING" && (
              <Button
                size="sm"
                onClick={() => doAction("mark_paid")}
                disabled={actionLoading}
              >
                {t("markPaid")}
              </Button>
            )}

            {reservation.status === "PAID" && (
              <Button
                size="sm"
                onClick={() => doAction("complete")}
                disabled={actionLoading}
              >
                {t("complete")}
              </Button>
            )}

            {/* Cancel */}
            <div className="ml-auto">
              {!showCancelConfirm ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={actionLoading}
                >
                  {t("cancel")}
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-red-700 font-medium">
                    {tCommon("all") === "Vše" ? "Opravdu zrušit?" : "Really cancel?"}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => doAction("cancel")}
                    disabled={actionLoading}
                  >
                    {tCommon("confirm")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sale link */}
      {reservation.saleId && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <Link
            href={`/sales/${reservation.saleId}`}
            className="text-sm text-rose hover:underline font-medium"
          >
            {tCommon("all") === "Vše" ? "Zobrazit prodej" : "View sale"} →
          </Link>
        </div>
      )}

      {/* Created by */}
      <div className="text-xs text-muted text-right">
        {tCommon("all") === "Vše" ? "Vytvořil" : "Created by"}:{" "}
        {reservation.createdByUser.name ?? reservation.createdByUser.email}
      </div>
    </div>
  );
}
