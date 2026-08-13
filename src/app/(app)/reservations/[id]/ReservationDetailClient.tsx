"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ReservationLabel } from "@/components/reservations/ReservationLabel";
import { getOriginFlag } from "@/lib/origin-flags";
import { TextureSwatch } from "@/components/TextureSwatch";
import { getHairColor } from "@/lib/hair-colors";
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
  discountPercent?: number | null;
  discountAmount?: number | null;
  discountType?: string | null;
  discountNote?: string | null;
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
    product: {
      id: string;
      name: string;
      nameUk?: string | null;
      nameRu?: string | null;
      category: string;
      texture?: string | null;
      origin?: string | null;
      photos?: string;
      slug?: string | null;
    };
  };
  salon?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  createdByUser: { name?: string | null; email: string };
  invoices?: {
    id: string;
    number: string;
    total: number;
    status: string;
    variableSymbol: string;
    payments: { comgateTransId: string | null; matchedAt: string | null }[];
  }[];
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
  const [showLabel, setShowLabel] = useState(false);
  const [completePaymentType, setCompletePaymentType] = useState("CASH");

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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowLabel(true)}
          >
            {t("printLabel")}
          </Button>
          <Link href="/reservations">
            <Button variant="ghost" size="sm">
              ← {tCommon("back")}
            </Button>
          </Link>
        </div>
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

      {/* Product card */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        {/* Product info row */}
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          <div className="w-24 h-24 rounded-lg bg-nude-100 overflow-hidden flex-shrink-0">
            {(() => {
              const photos: string[] = (() => {
                try { return JSON.parse(reservation.variant.product.photos || "[]"); }
                catch { return []; }
              })();
              return photos.length > 0 ? (
                <img
                  src={photos[0]}
                  alt={reservation.variant.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted/30">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              );
            })()}
          </div>

          {/* Product details */}
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            {reservation.variant.product.category && (
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold mb-1.5 ${
                ({ VIRGIN: "bg-amber-500 text-white", LUXE: "bg-violet-600 text-white",
                  STANDARD: "bg-espresso/80 text-white", SALE: "bg-red-500 text-white",
                  ACCESSORY: "bg-sky-100 text-sky-800",
                } as Record<string, string>)[reservation.variant.product.category] ?? "bg-mauve text-white"
              }`}>
                {t(`category.${reservation.variant.product.category.toLowerCase()}`)}
              </span>
            )}

            {/* Product name — link to product */}
            <h3 className="text-sm font-semibold text-ink leading-tight mb-2">
              {reservation.variant.product.slug ? (
                <Link
                  href={`/products/${reservation.variant.product.id}`}
                  className="hover:text-rose transition-colors"
                >
                  {reservation.variant.product.name}
                </Link>
              ) : (
                reservation.variant.product.name
              )}
            </h3>

            {/* Specs: origin, texture, color, length */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {reservation.variant.product.origin && (
                <span className="inline-flex items-center gap-1">
                  {getOriginFlag(reservation.variant.product.origin)} {reservation.variant.product.origin}
                </span>
              )}
              {reservation.variant.product.texture && (
                <span className="inline-flex items-center gap-1">
                  <TextureSwatch texture={reservation.variant.product.texture} size={12} />
                  {reservation.variant.product.texture}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-line"
                  style={{ backgroundColor: getHairColor(reservation.variant.color).hex }}
                />
                {reservation.variant.color}
              </span>
              <span>{reservation.variant.lengthCm} cm</span>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {reservation.sellingMode === "BY_PIECE"
                ? `${reservation.pieces} ks × ${formatCZK(reservation.pricePerUnit)} Kč/ks`
                : `${reservation.grams} g × ${formatCZK(reservation.pricePerUnit)} Kč/g`}
            </span>
            <span className="font-semibold text-ink">
              {formatCZK(reservation.lineTotal)} Kč
            </span>
          </div>
        </div>

        {/* Discount row */}
        {reservation.discountAmount != null && reservation.discountAmount > 0 && (
          <div className="px-4 py-2 border-t border-line flex justify-between items-center text-sm">
            <span className="text-muted">
              {t("discount")} ({(reservation.discountPercent ?? 0) / 100}%)
            </span>
            <span className="text-red-600 font-medium">
              -{formatCZK(reservation.discountAmount)} Kč
            </span>
          </div>
        )}

        {/* Total */}
        <div className="px-4 py-3 bg-nude-50 border-t border-line flex justify-between items-center">
          <span className="text-sm font-bold text-ink">{tCommon("total")}</span>
          <span className="text-lg font-bold text-ink">
            {formatCZK(reservation.lineTotal)} Kč
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

      {/* Deposit & payment overview */}
      {isOwner && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-muted uppercase mb-2">{t("deposit")}</p>
          {reservation.invoices && reservation.invoices.length > 0 ? (
            <>
              {reservation.invoices.map((inv) => {
                const isPaid = inv.status === "PAID" || inv.payments?.some((p) => p.matchedAt);
                return (
                  <div key={inv.id} className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-mono text-ink">{inv.number}</span>
                      <span className="text-xs text-muted ml-2">
                        {formatCZK(inv.total)} CZK
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700"
                        : inv.status === "CANCELLED"
                        ? "bg-gray-50 text-gray-500"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {isPaid ? t("depositPaid") : inv.status === "CANCELLED" ? t("depositCancelled") : t("depositPending")}
                    </span>
                  </div>
                );
              })}
              {/* Remaining balance */}
              {(() => {
                const depositTotal = reservation.invoices
                  .filter((inv) => inv.status !== "CANCELLED")
                  .reduce((sum, inv) => sum + inv.total, 0);
                const remaining = reservation.lineTotal - depositTotal;
                if (remaining > 0) {
                  return (
                    <div className="mt-2 pt-2 border-t border-line flex items-center justify-between">
                      <span className="text-sm text-muted">Doplatek</span>
                      <span className="text-sm font-semibold text-ink">{formatCZK(remaining)} CZK</span>
                    </div>
                  );
                }
                return null;
              })()}
              {reservation.status === "PENDING" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => doAction("resend_deposit")}
                  disabled={actionLoading}
                >
                  {t("resendDepositLink")}
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">Záloha 50%</span>
                <span className="text-sm font-semibold text-ink">{formatCZK(Math.ceil(reservation.lineTotal / 2))} CZK</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">Doplatek 50%</span>
                <span className="text-sm font-semibold text-ink">{formatCZK(reservation.lineTotal - Math.ceil(reservation.lineTotal / 2))} CZK</span>
              </div>
              {reservation.status === "PENDING" && (
                <Button
                  size="sm"
                  onClick={() => doAction("resend_deposit")}
                  disabled={actionLoading}
                >
                  Odeslat zálohu klientovi
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {reservation.note && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-muted uppercase mb-1">
            {t("note")}
          </p>
          <p className="text-sm text-ink">{reservation.note}</p>
        </div>
      )}

      {reservation.internalNote && isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-amber-600 uppercase mb-1">
            {t("internalNote")}
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
              <div className="flex items-center gap-2">
                <select
                  value={completePaymentType}
                  onChange={(e) => setCompletePaymentType(e.target.value)}
                  className="text-sm border border-line rounded-lg px-2 py-1.5 bg-white text-ink"
                >
                  <option value="CASH">Hotově</option>
                  <option value="CARD">Kartou</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => doAction("complete", { paymentType: completePaymentType })}
                  disabled={actionLoading}
                >
                  {t("complete")}
                </Button>
              </div>
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
                    {t("cancelConfirm")}
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
            {t("viewSale")} →
          </Link>
        </div>
      )}

      {/* Created by */}
      <div className="text-xs text-muted text-right">
        {t("createdBy")}:{" "}
        {reservation.createdByUser.name ?? reservation.createdByUser.email}
      </div>

      {showLabel && reservation && (
        <ReservationLabel
          data={{
            id: reservation.id,
            reservationNumber: reservation.reservationNumber,
            customerName:
              reservation.salon?.name ??
              reservation.customer?.name ??
              reservation.contactName ??
              "—",
            contactEmail: reservation.contactEmail ?? undefined,
            contactPhone: reservation.contactPhone ?? undefined,
            productName: reservation.variant.product.name,
            color: reservation.variant.color,
            lengthCm: reservation.variant.lengthCm,
            grams: reservation.grams,
            pieces: reservation.pieces,
            sellingMode: reservation.sellingMode,
          }}
          onClose={() => setShowLabel(false)}
        />
      )}
    </div>
  );
}
