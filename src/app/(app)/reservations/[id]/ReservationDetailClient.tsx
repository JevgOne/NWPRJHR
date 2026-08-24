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
    type: string;
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

function WhatsAppPaymentLink({ phone, url, amount, className }: { phone: string; url: string; amount: number; className?: string }) {
  const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
  const message = `Dobrý den, zde je Váš platební odkaz ${formatCZK(amount)} CZK: ${url}`;
  return (
    <a
      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors ${className || ""}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Odeslat přes WhatsApp
    </a>
  );
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
  const tCategory = useTranslations("category");
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [completePaymentType, setCompletePaymentType] = useState("CASH");
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState("STANDARD");
  const [discountNote, setDiscountNote] = useState("");
  const [whatsappPayment, setWhatsappPayment] = useState<{ url: string; amount: number } | null>(null);

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
        const data = await res.json();
        if ((action === "send_balance" || action === "resend_deposit") && data.comgateUrl) {
          setWhatsappPayment({ url: data.comgateUrl, amount: data.amount });
        }
        setShowCancelConfirm(false);
        load();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    const percent = parseFloat(discountInput);
    if (!percent || percent <= 0 || percent > 100) return;
    const discountPercent = Math.round(percent * 100);
    await doAction("apply_discount", {
      discountPercent,
      discountType,
      discountNote: discountNote || undefined,
    });
    setShowDiscountForm(false);
    setDiscountInput("");
    setDiscountNote("");
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
          {reservation.salon ? (
            <Link href={`/salons/${reservation.salon.id}`} className="text-rose hover:underline">
              {reservation.salon.name}
            </Link>
          ) : reservation.customer ? (
            <Link href={`/customers/${reservation.customer.id}`} className="text-rose hover:underline">
              {reservation.customer.name}
            </Link>
          ) : (
            reservation.contactName ?? "—"
          )}
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
                {tCategory(reservation.variant.product.category.toLowerCase())}
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

      {/* Invoices — mini cards + progress bar (same design as sale detail) */}
      {isOwner && (() => {
        const invoices = reservation.invoices ?? [];
        const invoiceLabel = (type: string) =>
          type === "DEPOSIT" ? "Záloha" : type === "CREDIT_NOTE" ? "Dobropis" : "Doplatek";
        const statusLabel = (status: string) =>
          status === "PAID" ? "Zaplaceno" : status === "CANCELLED" ? "Stornováno" : "Nezaplaceno";
        const borderColor = (status: string) =>
          status === "PAID" ? "border-l-emerald-500" : status === "CANCELLED" ? "border-l-gray-300" : "border-l-amber-400";
        const badgeStyle = (status: string) =>
          status === "PAID"
            ? "bg-emerald-50 text-emerald-700"
            : status === "CANCELLED"
              ? "bg-gray-50 text-gray-500"
              : "bg-amber-50 text-amber-700";

        const activeInvs = invoices.filter((inv) => inv.status !== "CANCELLED");
        const totalSum = activeInvs.reduce((s, inv) => s + inv.total, 0);
        const paidSum = invoices.reduce((s, inv) => s + (inv.status === "PAID" ? inv.total : 0), 0);
        const paidPercent = totalSum > 0 ? Math.round((paidSum / totalSum) * 100) : 0;
        const remaining = reservation.lineTotal - totalSum;

        return (
          <div className="bg-white border border-line rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-muted uppercase mb-2">{t("deposit")}</p>

            {invoices.length > 0 ? (
              <>
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className={`border-l-4 ${borderColor(inv.status)} rounded-r-lg bg-white border border-line p-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{invoiceLabel(inv.type)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyle(inv.status)}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Link href={`/invoices/${inv.id}`} className="text-sm text-rose hover:underline">
                          {inv.number}
                        </Link>
                        <span className="text-sm font-medium">{formatCZK(inv.total)} CZK</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment progress bar */}
                {totalSum > 0 && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <div className="flex items-center justify-between text-xs text-muted mb-1">
                      <span>Zaplaceno: {formatCZK(paidSum)} CZK z {formatCZK(totalSum)} CZK</span>
                      <span>{paidPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Remaining balance */}
                {remaining > 0 && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Zbývá doplatit</span>
                      <span className="text-sm font-semibold text-ink">{formatCZK(remaining)} CZK</span>
                    </div>
                    {reservation.status === "PAID" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 w-full"
                          onClick={() => doAction("send_balance")}
                          disabled={actionLoading}
                        >
                          Odeslat platební odkaz na doplatek
                        </Button>

                        {whatsappPayment && reservation.contactPhone && (
                          <WhatsAppPaymentLink phone={reservation.contactPhone} url={whatsappPayment.url} amount={whatsappPayment.amount} className="mt-1 w-full" />
                        )}

                        {!showDiscountForm && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 w-full text-rose"
                            onClick={() => setShowDiscountForm(true)}
                          >
                            Uplatnit slevu
                          </Button>
                        )}

                        {showDiscountForm && (
                          <div className="mt-3 p-3 border border-line rounded-lg space-y-2">
                            <p className="text-xs font-medium text-muted uppercase">Uplatnit slevu</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                placeholder="Procento slevy"
                                value={discountInput}
                                onChange={(e) => setDiscountInput(e.target.value)}
                                className="flex-1 border border-line rounded-lg px-2 py-1.5 text-sm"
                              />
                              <span className="text-sm text-muted">%</span>
                            </div>
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                            >
                              <option value="STANDARD">Standardní sleva</option>
                              <option value="MARKETING">Marketingová sleva</option>
                              <option value="PERSONAL">Osobní sleva</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Poznámka (volitelné)"
                              value={discountNote}
                              onChange={(e) => setDiscountNote(e.target.value)}
                              className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                            />
                            {discountInput && parseFloat(discountInput) > 0 && (() => {
                              const pct = parseFloat(discountInput);
                              const qty = reservation.pieces > 0 ? reservation.pieces : reservation.grams;
                              const beforeDiscount = reservation.pricePerUnit * qty;
                              const discAmt = Math.round(beforeDiscount * pct / 100);
                              const newTotal = beforeDiscount - discAmt;
                              const depositPaid = (reservation.invoices ?? [])
                                .filter((i) => i.type === "DEPOSIT" && i.status !== "CANCELLED")
                                .reduce((s, i) => s + i.total, 0);
                              const newRemaining = newTotal - depositPaid;
                              return (
                                <div className="text-xs text-muted bg-nude-50 rounded p-2 space-y-0.5">
                                  <div className="flex justify-between">
                                    <span>Sleva:</span>
                                    <span className="text-red-600">-{formatCZK(discAmt)} Kč</span>
                                  </div>
                                  <div className="flex justify-between font-medium text-ink">
                                    <span>Nový doplatek:</span>
                                    <span>{formatCZK(Math.max(0, newRemaining))} Kč</span>
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleApplyDiscount} disabled={actionLoading}>
                                Potvrdit
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => setShowDiscountForm(false)}>
                                Zrušit
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Resend deposit link */}
                {reservation.status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => doAction("resend_deposit")}
                    disabled={actionLoading}
                  >
                    {t("resendDepositLink")}
                  </Button>
                )}
                {whatsappPayment && reservation.contactPhone && (
                  <WhatsAppPaymentLink phone={reservation.contactPhone} url={whatsappPayment.url} amount={whatsappPayment.amount} className="mt-2" />
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
                {whatsappPayment && reservation.contactPhone && (
                  <WhatsAppPaymentLink phone={reservation.contactPhone} url={whatsappPayment.url} amount={whatsappPayment.amount} className="mt-2" />
                )}
              </>
            )}
          </div>
        );
      })()}

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
                  <option value="CASH">Hotov\u011B</option>
                  <option value="CARD">Kartou (na m\u00EDst\u011B)</option>
                  <option value="ONLINE">Poslat platebn\u00ED odkaz online</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => {
                    if (completePaymentType === "ONLINE") {
                      doAction("send_balance");
                    } else {
                      doAction("complete", { paymentType: completePaymentType });
                    }
                  }}
                  disabled={actionLoading}
                >
                  {completePaymentType === "ONLINE" ? "Odeslat odkaz" : t("complete")}
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
