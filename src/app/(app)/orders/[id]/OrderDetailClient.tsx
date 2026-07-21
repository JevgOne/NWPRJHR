"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Role } from "@prisma/client";

interface OrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  estimatedTotal: number;
  totalAmount?: number;
  shippingCost?: number;
  note?: string;
  internalNote?: string;
  rejectedReason?: string;
  promoCode?: string;
  promoDiscount?: number;
  paymentMethod?: string;
  shippingMethod?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  packetaPointName?: string;
  packetaPointCity?: string;
  packetaPacketId?: string;
  packetaBarcode?: string;
  shippingTrackingId?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingZip?: string;
  paidAt?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  salon?: { id: string; name: string; tier: string } | null;
  customer?: { name: string; email: string } | null;
  items: {
    id: string;
    grams: number;
    pieces: number;
    pricePerGram: number;
    lineTotal: number;
    variant: {
      id: string;
      lengthCm: number;
      color: string;
      product: { name: string };
    };
  }[];
  sale?: { id: string; saleNumber?: string };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  NEW: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  AWAITING_PAYMENT: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  PAID: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  CONFIRMED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  PROCESSING: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  REJECTED: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  READY: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  SHIPPED: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  DELIVERED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  COMPLETED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
};

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OrderDetailClient({
  id,
  role,
  userId,
}: {
  id: string;
  role: Role;
  userId: string;
}) {
  const t = useTranslations("orderManagement");
  const tCommon = useTranslations("common");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isOwner = role === "OWNER";
  const isStaff = ["OWNER", "EMPLOYEE"].includes(role);

  const load = () => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const [actionError, setActionError] = useState("");

  const doAction = async (action: string, body?: Record<string, unknown>) => {
    setActionError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Error ${res.status}`);
      }
    } catch {
      setActionError(tCommon("error"));
    } finally {
      setActionLoading(false);
    }
  };

  const doDelete = async () => {
    setActionError("");
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/orders";
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Error ${res.status}`);
      }
    } catch {
      setActionError(tCommon("error"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="text-muted py-8 text-center">{tCommon("loading")}</p>;
  if (!order) return <p className="text-red-500 py-8 text-center">{tCommon("error")}</p>;

  const statusStyle = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
  const statusLabel = t(order.status.toLowerCase());
  const isFinal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("orderDetail")}</h1>
          <p className="text-sm text-muted mt-0.5">
            {order.salon?.name ?? order.customer?.name ?? ""} · {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
            {order.orderNumber && <span className="ml-2 font-mono text-xs">#{order.orderNumber}</span>}
            {!order.salon && order.customer && <span className="ml-2 text-[10px] bg-rose/10 text-rose px-1.5 py-0.5 rounded">Retail</span>}
          </p>
        </div>
        <Link href={isStaff ? "/orders" : "/salon/orders"}>
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
          {statusLabel}
        </span>
        {order.confirmedAt && (
          <span className="text-xs text-muted ml-auto">
            {t("confirmed")}: {new Date(order.confirmedAt).toLocaleDateString("cs-CZ")}
          </span>
        )}
        {order.completedAt && (
          <span className="text-xs text-muted ml-auto">
            {t("completed")}: {new Date(order.completedAt).toLocaleDateString("cs-CZ")}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nude-50 border-b border-line text-left text-muted text-xs uppercase tracking-wider">
              <th className="py-2.5 px-4">{t("product")}</th>
              <th className="py-2.5 px-4 text-right">{t("quantity")}</th>
              <th className="py-2.5 px-4 text-right">{t("pricePerGram")}</th>
              <th className="py-2.5 px-4 text-right">{t("estimatedTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} className={i < order.items.length - 1 ? "border-b border-line/50" : ""}>
                <td className="py-3 px-4 font-medium text-ink">
                  {item.variant.product.name}{" "}
                  <span className="text-muted font-normal">
                    {item.variant.color} {item.variant.lengthCm}cm
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-muted">
                  {item.grams}g{item.pieces > 0 ? ` / ${item.pieces}ks` : ""}
                </td>
                <td className="py-3 px-4 text-right text-muted">
                  {formatCZK(item.pricePerGram)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-ink">
                  {formatCZK(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-nude-50 border-t border-line">
          {order.promoCode && order.promoDiscount ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">{t("subtotal")}</span>
                <span className="text-muted">{formatCZK(order.estimatedTotal + order.promoDiscount)} CZK</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600">
                  {t("promoCode")}: {order.promoCode}
                </span>
                <span className="text-emerald-600">-{formatCZK(order.promoDiscount)} CZK</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-line/50">
                <span className="text-sm font-bold text-ink">{t("estimatedTotal")}</span>
                <span className="text-lg font-bold text-ink">{formatCZK(order.estimatedTotal)} CZK</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-ink">{t("estimatedTotal")}</span>
              <span className="text-lg font-bold text-ink">{formatCZK(order.estimatedTotal)} CZK</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.note && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-muted uppercase mb-1">{t("note")}</p>
          <p className="text-sm text-ink">{order.note}</p>
        </div>
      )}

      {order.rejectedReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-red-600 uppercase mb-1">{t("rejectReason")}</p>
          <p className="text-sm text-red-700">{order.rejectedReason}</p>
        </div>
      )}

      {/* Contact info — retail orders */}
      {isStaff && (order.contactName || order.contactEmail) && (
        <div className="bg-white border border-line rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-muted uppercase mb-2">{t("contactInfo")}</p>
          {order.contactName && (
            <p className="text-sm text-ink">{order.contactName}</p>
          )}
          {order.contactEmail && (
            <p className="text-sm text-muted">{order.contactEmail}</p>
          )}
          {order.contactPhone && (
            <p className="text-sm text-muted">{order.contactPhone}</p>
          )}
        </div>
      )}

      {/* Shipping info */}
      {isStaff && order.shippingMethod && (
        <div className="bg-white border border-line rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-muted uppercase mb-2">{t("shippingInfo")}</p>
          <p className="text-sm text-ink">
            {order.shippingMethod === "PACKETA" ? "Packeta" : order.shippingMethod === "PERSONAL_DELIVERY" ? t("shipPersonal") : order.shippingMethod === "PICKUP" ? t("shipPickup") : order.shippingMethod === "CZECH_POST" ? t("shipPost") : order.shippingMethod}
          </p>
          {(order.shippingStreet || order.shippingCity) && (
            <p className="text-sm text-muted">
              {[order.shippingStreet, order.shippingZip, order.shippingCity].filter(Boolean).join(", ")}
            </p>
          )}
          {order.packetaPointName && (
            <p className="text-sm text-muted">{order.packetaPointName}{order.packetaPointCity ? `, ${order.packetaPointCity}` : ""}</p>
          )}
          {order.packetaPacketId && (
            <p className="text-sm text-muted">{t("packetaId")}: {order.packetaPacketId}</p>
          )}
          {order.packetaBarcode && (
            <p className="text-sm text-muted">{t("barcode")}: {order.packetaBarcode}</p>
          )}
          {order.shippingTrackingId && (
            <p className="text-sm text-muted">{t("trackingId")}: {order.shippingTrackingId}</p>
          )}
          {order.shippingCost != null && (
            <p className="text-sm text-muted">{t("shippingCostLabel")}: {formatCZK(order.shippingCost)} Kč</p>
          )}
        </div>
      )}

      {/* Payment info */}
      {isStaff && order.paymentMethod && (
        <div className="bg-white border border-line rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-muted uppercase mb-2">{t("paymentInfo")}</p>
          <p className="text-sm text-ink">
            {order.paymentMethod === "CARD" ? t("payCard") : order.paymentMethod === "TRANSFER" ? t("payTransfer") : order.paymentMethod}
          </p>
          {order.paidAt && (
            <p className="text-sm text-emerald-600">{t("paidAtLabel")}: {new Date(order.paidAt).toLocaleDateString("cs-CZ")}</p>
          )}
          {order.totalAmount != null && (
            <p className="text-sm font-semibold text-ink">{t("totalAmountLabel")}: {formatCZK(order.totalAmount)} Kč</p>
          )}
        </div>
      )}

      {/* Staff actions */}
      {!isFinal && (
        <div className="bg-white border border-line rounded-xl px-4 py-4">
          {actionError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {actionError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {order.status === "NEW" && isOwner && (
              <>
                <Button size="sm" onClick={() => doAction("confirm")} disabled={actionLoading}>
                  {t("confirmOrder")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowReject(!showReject)}
                >
                  {t("rejectOrder")}
                </Button>
              </>
            )}

            {/* mark-paid — retail AWAITING_PAYMENT orders */}
            {order.status === "AWAITING_PAYMENT" && isOwner && (
              <Button size="sm" onClick={() => doAction("mark-paid")} disabled={actionLoading}>
                {t("markPaid")}
              </Button>
            )}

            {order.status === "CONFIRMED" && isStaff && (
              <Button size="sm" onClick={() => doAction("status", { status: "READY" })} disabled={actionLoading}>
                {t("markReady")}
              </Button>
            )}

            {/* ship-packeta — for Packeta orders */}
            {["PROCESSING", "READY"].includes(order.status) && isStaff && order.shippingMethod === "PACKETA" && (
              <Button size="sm" onClick={() => doAction("ship-packeta")} disabled={actionLoading}>
                {t("shipPacketa")}
              </Button>
            )}

            {/* ship-manual — for non-Packeta shipping */}
            {["PROCESSING", "READY"].includes(order.status) && isStaff && order.shippingMethod && order.shippingMethod !== "PACKETA" && (
              <div className="flex items-center gap-2">
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={t("trackingIdPlaceholder")}
                  className="w-40 text-xs"
                />
                <Button size="sm" onClick={() => doAction("ship-manual", { trackingId: trackingId || undefined })} disabled={actionLoading}>
                  {t("shipManual")}
                </Button>
              </div>
            )}

            {order.status === "READY" && isStaff && !order.shippingMethod && (
              <Button size="sm" onClick={() => doAction("status", { status: "SHIPPED" })} disabled={actionLoading}>
                {t("markShipped")}
              </Button>
            )}

            {/* mark delivered */}
            {order.status === "SHIPPED" && isStaff && (
              <Button size="sm" onClick={() => doAction("status", { status: "DELIVERED" })} disabled={actionLoading}>
                {t("markDelivered")}
              </Button>
            )}

            {["CONFIRMED", "READY", "SHIPPED", "DELIVERED", "PROCESSING"].includes(order.status) && isStaff && (
              <Button size="sm" onClick={() => doAction("complete")} disabled={actionLoading}>
                {t("completeOrder")}
              </Button>
            )}

            {/* Cancel — clearly red, separate from other actions */}
            <div className="ml-auto">
              {!showCancelConfirm ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  {t("cancelOrder")}
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-red-700 font-medium">{t("cancelConfirm")}</span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => doAction("cancel")}
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

          {showReject && (
            <div className="mt-3 pt-3 border-t border-line">
              <Input
                label={t("rejectReason")}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (rejectReason.trim()) {
                    doAction("reject", { reason: rejectReason });
                    setShowReject(false);
                  }
                }}
              >
                {tCommon("confirm")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete — only for CANCELLED/REJECTED orders, owner only */}
      {["CANCELLED", "REJECTED"].includes(order.status) && isOwner && (
        <div className="bg-white border border-line rounded-xl px-4 py-4">
          {actionError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {actionError}
            </div>
          )}
          {!showDeleteConfirm ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("deleteOrder")}
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-sm text-red-700 font-medium">{t("deleteConfirm")}</span>
              <Button
                size="sm"
                variant="danger"
                onClick={doDelete}
                disabled={actionLoading}
              >
                {tCommon("confirm")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sale link — only visible to staff */}
      {isStaff && order.sale && (
        <div className="bg-white border border-line rounded-xl px-4 py-3">
          <Link
            href={`/sales/${order.sale.id}`}
            className="text-sm text-rose hover:underline font-medium"
          >
            {order.sale.saleNumber || order.sale.id} →
          </Link>
        </div>
      )}
    </div>
  );
}
