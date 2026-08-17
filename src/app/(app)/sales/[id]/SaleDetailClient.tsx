"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserBadge } from "@/components/ui/UserBadge";
import type { Role } from "@prisma/client";

interface SaleDetail {
  id: string;
  saleNumber?: string;
  customerType: string;
  salonName?: string;
  customerName?: string;
  status: string;
  paymentType?: string;
  receiptNumber?: string;
  subtotal: number;
  discountAmount: number;
  totalBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
  totalCostOfGoods?: number;
  grossMargin?: number;
  completedAt: string;
  note?: string;
  userName?: string;
  shippingMethod?: string;
  shippingStatus?: string;
  shippingTrackingId?: string;
  shippingCost?: number;
  packetaPointId?: string;
  packetaPointName?: string;
  packetaPointCity?: string;
  comgateTransId?: string | null;
  invoice?: { id: string; number: string; status: string } | null;
  items: {
    id: string;
    variantId: string;
    grams: number;
    pieces: number;
    pricePerGramUsed: number;
    lineTotal: number;
    deliveryId?: string;
    purchasePricePerGramCZK?: number;
    itemMargin?: number;
    sellingMode?: string;
    variant?: {
      lengthCm: number;
      color: string;
      sellingMode?: string;
      product: { name: string; category: string };
    };
  }[];
  discounts?: {
    id: string;
    percent: number;
    type: string;
    amountHalere: number;
    counterPerformanceNote?: string;
    bearers: { partnerName: string; shareAmount: number }[];
  }[];
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SaleDetailClient({ id, role }: { id: string; role: Role }) {
  const t = useTranslations("sale");
  const tCommon = useTranslations("common");
  const tStock = useTranslations("stock");
  const tPartner = useTranslations("partner");
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = role === "OWNER";
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        // Reload sale data
        const r = await fetch(`/api/sales/${id}`);
        const data = await r.json();
        setSale(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setCancelError(data.error || tCommon("error"));
      }
    } catch {
      setCancelError(tCommon("error"));
    } finally {
      setCancelling(false);
    }
  };

  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [confirmPaymentError, setConfirmPaymentError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    setConfirmPaymentError("");
    try {
      const res = await fetch(`/api/sales/${id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const r = await fetch(`/api/sales/${id}`);
        const data = await r.json();
        setSale(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setConfirmPaymentError(data.error || tCommon("error"));
      }
    } catch {
      setConfirmPaymentError(tCommon("error"));
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    setConfirmPaymentError("");
    try {
      const res = await fetch(`/api/sales/${id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      if (res.ok) {
        const r = await fetch(`/api/sales/${id}`);
        setSale(await r.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setConfirmPaymentError(data.error || tCommon("error"));
      }
    } catch {
      setConfirmPaymentError(tCommon("error"));
    } finally {
      setMarkingPaid(false);
    }
  };

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((r) => r.json())
      .then(setSale)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted">{tCommon("loading")}</p>;
  if (!sale) return <p className="text-red-500">{tCommon("error")}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("saleDetail")}</h1>
        <Link href="/sales">
          <Button variant="secondary" size="sm">
            {tCommon("back")}
          </Button>
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted">{t("selectCustomerType")}</span>
          <span>
            {sale.customerType === "SALON"
              ? t("salonCustomer")
              : t("retailCustomer")}
          </span>
          <span className="text-muted">{t("customer")}</span>
          <span>{sale.salonName || sale.customerName || "-"}</span>
          <span className="text-muted">{t("date")}</span>
          <span>
            {sale.completedAt
              ? new Date(sale.completedAt).toLocaleString("cs-CZ")
              : "-"}
          </span>
          <span className="text-muted">{t("status")}</span>
          <span>{t(sale.status.toLowerCase() as "completed" | "cancelled" | "draft")}</span>
          {sale.paymentType && (
            <>
              <span className="text-muted">{t("paymentType")}</span>
              <span>
                {sale.paymentType === "TRANSFER" ? t("paymentTransfer") :
                 sale.paymentType === "CASH" ? t("paymentCash") :
                 sale.paymentType === "CARD" ? t("paymentCard") :
                 sale.paymentType === "PROMO" ? t("paymentPromo") : t("paymentWriteoff")}
              </span>
            </>
          )}
          {sale.receiptNumber && (
            <>
              <span className="text-muted">{t("receiptNumber")}</span>
              <span>{sale.receiptNumber}</span>
            </>
          )}
          {sale.saleNumber && (
            <>
              <span className="text-muted">{t("saleNumber")}</span>
              <span>{sale.saleNumber}</span>
            </>
          )}
          {isOwner && sale.userName && (
            <>
              <span className="text-muted">{t("soldBy")}</span>
              <span><UserBadge name={sale.userName} /></span>
            </>
          )}
        </div>
      </Card>

      {/* Payment status banner */}
      {sale.paymentType && (sale.paymentType === "TRANSFER" || sale.paymentType === "CARD" || sale.paymentType === "CASH") && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          sale.invoice?.status === "PAID"
            ? "bg-emerald-50 border-emerald-200"
            : sale.invoice
              ? "bg-amber-50 border-amber-200"
              : "bg-gray-50 border-gray-200"
        }`}>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
            sale.invoice?.status === "PAID"
              ? "text-emerald-700 bg-emerald-100"
              : sale.invoice
                ? "text-amber-700 bg-amber-100"
                : "text-gray-500 bg-gray-100"
          }`}>
            {sale.invoice?.status === "PAID"
              ? "Zaplaceno"
              : sale.invoice
                ? "Čeká na platbu"
                : "Faktura nevystavena"}
          </span>
          <span className="text-xs text-muted ml-auto">
            {sale.invoice?.status === "PAID" && sale.paymentType === "CARD" && sale.comgateTransId
              ? `Online kartou (Comgate ${sale.comgateTransId})`
              : sale.invoice?.status === "PAID" && sale.paymentType === "CASH"
                ? "Hotově"
                : sale.invoice?.status === "PAID" && sale.paymentType === "TRANSFER"
                  ? "Převodem"
                  : sale.paymentType === "TRANSFER" && !sale.invoice
                    ? "Čeká na vystavení faktury"
                    : sale.paymentType === "TRANSFER"
                      ? "Čeká na převod"
                      : ""}
          </span>
        </div>
      )}

      <Card>
        <h2 className="font-medium mb-3">{t("items")}</h2>
        <div className="space-y-3">
          {sale.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 text-sm">
              <div className="font-medium">
                {item.variant
                  ? `${item.variant.product.name} ${item.variant.lengthCm}cm ${item.variant.color}`
                  : item.variantId.slice(0, 8)}
              </div>
              <div className="flex justify-between text-muted mt-1">
                <span>
                  {(item.variant?.sellingMode === "BY_PIECE" || item.sellingMode === "BY_PIECE" || (item.pieces > 0 && item.grams === 0))
                    ? `${item.pieces} ${tStock("pieces")} @ ${formatCZK(item.pricePerGramUsed)} CZK/${tStock("pieces")}`
                    : <>
                        {item.grams} {tStock("grams")}
                        {item.pieces > 0 && ` / ${item.pieces} ${tStock("pieces")}`}
                        {" @ "}
                        {formatCZK(item.pricePerGramUsed)} CZK/{tStock("grams")}
                      </>
                  }
                </span>
                <span className="font-medium text-ink">
                  {formatCZK(item.lineTotal)} CZK
                </span>
              </div>
              {isOwner && item.itemMargin !== undefined && (
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-muted">
                    {t("costOfGoods")}:{" "}
                    {formatCZK((item.purchasePricePerGramCZK ?? 0) * item.grams)}
                  </span>
                  <span
                    className={
                      item.itemMargin >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {t("itemMargin")}: {formatCZK(item.itemMargin)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t("subtotal")}</span>
            <span>{formatCZK(sale.subtotal)} CZK</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>{t("discount")}</span>
              <span>-{formatCZK(sale.discountAmount)} CZK</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>{t("totalAmount")}</span>
            <span>{formatCZK(sale.totalAmount)} CZK</span>
          </div>

          {isOwner &&
            sale.totalCostOfGoods !== undefined &&
            sale.grossMargin !== undefined && (
              <div className="mt-3 pt-3 border-t border-dashed space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">{t("costOfGoods")}</span>
                  <span>{formatCZK(sale.totalCostOfGoods)} CZK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("grossMargin")}</span>
                  <span
                    className={
                      sale.grossMargin >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {formatCZK(sale.grossMargin)} CZK
                  </span>
                </div>
              </div>
            )}
        </div>
      </Card>

      {isOwner && sale.discounts && sale.discounts.length > 0 && (
        <Card>
          <h2 className="font-medium mb-3">{t("discount")}</h2>
          {sale.discounts.map((d) => (
            <div key={d.id} className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>
                  {d.type === "STANDARD"
                    ? tPartner("standardDiscount")
                    : d.type === "MARKETING"
                    ? tPartner("marketingDiscount")
                    : tPartner("personalDiscount")}
                </span>
                <span>
                  {d.percent / 100}% ({formatCZK(d.amountHalere)} CZK)
                </span>
              </div>
              {d.counterPerformanceNote && (
                <p className="text-muted text-xs">
                  {tPartner("counterPerformance")}: {d.counterPerformanceNote}
                </p>
              )}
              {d.bearers.length > 0 && (
                <div className="text-xs text-muted">
                  {d.bearers.map((b, i) => (
                    <span key={i}>
                      {b.partnerName}: {formatCZK(b.shareAmount)} CZK
                      {i < d.bearers.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {sale.note && (
        <Card>
          <p className="text-sm text-gray-600">{sale.note}</p>
        </Card>
      )}

      {/* Shipping info */}
      {sale.shippingMethod && (
        <Card>
          <h2 className="font-medium mb-3">{t("shippingInfo")}</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted">{t("shippingMethod")}</span>
            <span>
              {sale.shippingMethod === "PACKETA"
                ? `Zásilkovna — ${sale.packetaPointName || ""} (${sale.packetaPointCity || ""})`
                : sale.shippingMethod === "PERSONAL_DELIVERY"
                ? "Osobní rozvoz"
                : sale.shippingMethod === "PICKUP"
                ? "Osobní vyzvednutí"
                : sale.shippingMethod}
            </span>
            {sale.shippingStatus && (
              <>
                <span className="text-muted">{t("shippingStatus")}</span>
                <span className={
                  sale.shippingStatus === "SHIPPED" ? "text-blue-600 font-medium" :
                  sale.shippingStatus === "DELIVERED" ? "text-green-600 font-medium" :
                  "text-yellow-600 font-medium"
                }>
                  {sale.shippingStatus === "SHIPPED" ? "Odesláno" :
                   sale.shippingStatus === "DELIVERED" ? "Doručeno" : "Čeká na odeslání"}
                </span>
              </>
            )}
            {sale.shippingTrackingId && (
              <>
                <span className="text-muted">Tracking</span>
                <span className="font-mono text-xs">{sale.shippingTrackingId}</span>
              </>
            )}
          </div>
          {/* Packeta actions */}
          {isOwner && sale.shippingMethod === "PACKETA" && (
            <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-2">
              {!sale.shippingTrackingId && (
                <Button
                  size="sm"
                  onClick={async () => {
                    const res = await fetch("/api/admin/packeta/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ saleId: sale.id }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      const r = await fetch(`/api/sales/${id}`);
                      setSale(await r.json());
                    }
                  }}
                >
                  Odeslat do Zásilkovny
                </Button>
              )}
              {sale.shippingTrackingId && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(`/api/admin/packeta/label?packetId=${sale.shippingTrackingId}`, "_blank")}
                  >
                    Stáhnout štítek
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const res = await fetch(`/api/admin/packeta/tracking?packetId=${sale.shippingTrackingId}`);
                      const data = await res.json();
                      if (data.status) {
                        alert(`Stav: ${data.status.text}\n\nHistorie:\n${data.tracking.map((t: { dateTime: string; statusText: string }) => `${t.dateTime}: ${t.statusText}`).join("\n")}`);
                      }
                    }}
                  >
                    Zkontrolovat stav
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Invoice card with status badge */}
      {sale.invoice && (
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t("invoice")}</span>
            <div className="flex items-center gap-2">
              <Link href={`/invoices/${sale.invoice.id}`} className="text-rose font-medium hover:underline">
                {sale.invoice.number}
              </Link>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                sale.invoice.status === "PAID"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {sale.invoice.status === "PAID" ? "Zaplaceno" : "Nezaplaceno"}
              </span>
            </div>
          </div>

          {/* Mark as paid — for TRANSFER with unpaid invoice */}
          {isOwner && sale.paymentType === "TRANSFER" && sale.invoice.status !== "PAID" && (
            <div className="mt-3 pt-3 border-t border-line">
              {confirmPaymentError && (
                <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {confirmPaymentError}
                </div>
              )}
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleMarkPaid}
                disabled={markingPaid}
              >
                {markingPaid ? tCommon("loading") : "Platba dorazila — označit jako zaplaceno"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Create Invoice for sales without invoice */}
      {isOwner && sale.status === "COMPLETED" && !sale.invoice && (sale.paymentType === "TRANSFER" || sale.paymentType === "CARD" || sale.paymentType === "CASH") && (
        <Card>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {sale.paymentType === "TRANSFER"
                ? "Vystavit fakturu a odeslat klientovi k zaplacení"
                : "Faktura nebyla vytvořena. Klikněte pro vytvoření."}
            </p>
            {confirmPaymentError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {confirmPaymentError}
              </div>
            )}
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
            >
              {confirmingPayment ? tCommon("loading")
                : sale.paymentType === "TRANSFER" ? "Vystavit fakturu"
                : "Vytvořit fakturu"}
            </Button>
          </div>
        </Card>
      )}


      {isOwner && sale.status === "COMPLETED" && (
        <Card>
          {cancelError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {cancelError}
            </div>
          )}
          {!showCancelConfirm ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelConfirm(true)}
            >
              {t("cancelSale")}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {t("cancelConfirm")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? tCommon("loading") : tCommon("confirm")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
